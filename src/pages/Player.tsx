import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share, Share2, Pause, Play, SkipForward, List, FileText, X, ExternalLink, Loader2, Sun, Cloud, CloudRain, CloudSnow, Calendar as CalendarIcon, Trophy } from "lucide-react";
import { toast } from "sonner";
import type { BriefingSection } from "@/types/database";
import { getBriefingForPlayer, markBriefingListened, shareBriefing } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { YoursLogo } from "@/components/YoursLogo";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// `new Date("2026-05-06")` parses as UTC midnight, which falls on the previous
// day in any timezone west of UTC. Constructing via (y, m-1, d) lands the Date
// at LOCAL midnight on the intended calendar day, so today's briefing always
// shows today and yesterday's replay correctly says yesterday.
function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatBriefingDate(yyyyMmDd: string): string {
  return parseLocalDate(yyyyMmDd).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Heuristic seconds budget for the spoken intro turns (greeting + 2-3 sentence
// headline summary), measured on top of the music-intro length. The TTS
// pipeline does not yet emit an explicit [intro_end] marker, so we use this
// soft window: while currentTime is within the music + spoken-intro window,
// we show the visual recap instead of the per-section transcript view.
const SPOKEN_INTRO_SECONDS = 14;

// Pick a weather glyph from a free-text condition string. Falls through to
// Sun on no match — we'd rather show a benign default than a wrong icon
// (e.g. a Snow icon for "scattered showers" because the regex was greedy).
function pickWeatherIcon(text: string | undefined | null) {
  const t = (text ?? "").toLowerCase();
  if (/(snow|flurr|sleet|blizzard)/.test(t)) return CloudSnow;
  if (/(rain|shower|drizzle|thunderstorm|storm)/.test(t)) return CloudRain;
  if (/(cloud|overcast|fog|haze|mist)/.test(t)) return Cloud;
  return Sun;
}

// Try to extract a temperature like "73°", "73°F", or "73 degrees" from a
// loose summary string. Returns null when nothing matches — caller then
// falls back to showing the section summary text rather than fabricating a
// number. Spelled-out temps ("seventy-three") are intentionally NOT parsed
// here; the LLM mixes spellings, and a flaky parse looks worse than no temp.
function extractTemperature(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(/(-?\d{1,3})\s*°\s*[FC]?/);
  if (m) return `${m[1]}°`;
  const m2 = text.match(/(-?\d{1,3})\s*(?:degrees?|deg\b)/i);
  if (m2) return `${m2[1]}°`;
  return null;
}

/** Split a summary blob into bullet-friendly paragraphs. */
function splitSummary(text: string): string[] {
  if (/[\n•\-–]/.test(text)) {
    return text
      .split(/\n|(?:(?:^|\.\s)(?=[A-Z]))/g)
      .map((s) => s.replace(/^[\s•\-–]+/, "").trim())
      .filter(Boolean);
  }
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(
      sentences
        .slice(i, i + 2)
        .join("")
        .trim(),
    );
  }
  return chunks.filter(Boolean);
}

/** Seconds of intro music before spoken content begins. Matches the
 *  programmatic intro music (8.8s with built-in fade-out) + 0.4s gap
 *  generated in supabase/functions/_shared/audio-wav.ts. Used only as a
 *  fallback when the server-recorded section_offsets are missing or partial
 *  — when offsets are present, sectionOffsets[0] is the real intro length. */
const INTRO_MUSIC_SECONDS = 9.2;

/** Approximate per-section start times (seconds) when the server didn't
 *  record exact offsets, or recorded fewer than sections.length offsets.
 *  Distributes the spoken portion of the audio proportionally to each
 *  section's summary character count — this tracks the real audio better
 *  than the LLM's claimed `duration_minutes` (which is routinely over-
 *  estimated: 7.5 min of claimed content vs. ~100s of actual dialogue).
 *
 *  introLen is the actual intro-music length in seconds. When the server
 *  recorded at least one offset (sectionOffsets[0]), pass that value — it
 *  reflects the real intro duration baked into the audio file. Otherwise
 *  we fall back to a default (3.6s = 3.2s chime + 0.4s gap). */
function buildSectionOffsets(
  sections: BriefingSection[],
  totalDuration: number,
  introLen: number,
): number[] {
  // Reserve a bit at the tail for the outro chord (~2.1s) so we don't
  // overshoot into a silent outro tail.
  const OUTRO_TAIL = 2.1;
  const spokenDuration = Math.max(0, totalDuration - introLen - OUTRO_TAIL);

  // Weight each section by the length of its summary text. Falls back to
  // 1 each when summaries are missing so we still get a uniform split.
  const weights = sections.map((s) => Math.max(1, (s.summary ?? "").length));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const offsets: number[] = [];
  let cursor = introLen;
  for (const w of weights) {
    offsets.push(cursor);
    cursor += (spokenDuration * w) / totalWeight;
  }
  return offsets;
}

/** Find which section index the current playback time falls in. */
function activeSectionForTime(
  currentTime: number,
  offsets: number[],
  totalDuration: number,
): number {
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (currentTime >= offsets[i]) return i;
  }
  return 0;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Player() {
  const { briefingId, id } = useParams();
  const briefingParam = briefingId ?? id ?? "";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || null;
  const token = useMemo(
    () => new URLSearchParams(location.search).get("t"),
    [location.search],
  );
  // Optional `?s=<index>` deep-link to a specific section. Parsed once here;
  // clamped/applied after audio metadata loads.
  const sectionParam = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("s");
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }, [location.search]);
  const autoplayRequested = (location.state as { autoplay?: boolean } | null)?.autoplay === true;
  const backHref = token ? "/" : "/app";

  // Don't fire the query until we either have a signed-link token (no auth
  // needed) OR auth has fully resolved (have a user, or confirmed unauthed).
  // Otherwise the query fires before the JWT is attached and gets a 401 loop.
  const queryReady = !!briefingParam && (!!token || !authLoading);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["briefing", briefingParam, token, user?.id ?? null],
    queryFn: () => getBriefingForPlayer(briefingParam, token),
    enabled: queryReady,
    staleTime: 60_000,
    // Don't retry on auth errors (401/403) — those won't fix themselves with retries.
    retry: (failureCount, err) => {
      const msg = err instanceof Error ? err.message : "";
      if (/^get-briefing 40[13]/.test(msg)) return false;
      return failureCount < 20;
    },
    retryDelay: 5000,
    // Keep polling every 10s while the briefing is still generating OR while
    // it's marked ready but audio_signed_url hasn't arrived yet (race window
    // between status flip and audio upload finalize).
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return 10_000;
      if (!d.audio_signed_url) return 5_000;
      return false;
    },
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChapters, setShowChapters] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const presentShareLink = useCallback(
    async (url: string, title: string, text: string, copyToast: string) => {
      const shareData = { title, text, url };
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (typeof navigator.share === "function" && (!nav.canShare || nav.canShare(shareData))) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success(copyToast);
      } else {
        prompt("Copy this share link:", url);
      }
    },
    [],
  );

  const handleShare = useCallback(async () => {
    if (sharing || !data?.id) return;
    setSharing(true);
    try {
      const { url } = await shareBriefing(data.id);
      const sectionTitles = (data.sections ?? [])
        .map((s) => s.title)
        .slice(0, 3)
        .join(" · ");
      await presentShareLink(
        url,
        "Yours — Today's Briefing",
        sectionTitles
          ? `Listen to today's Yours briefing: ${sectionTitles}`
          : "Listen to today's Yours briefing.",
        "Share link copied to clipboard",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't create share link";
      // AbortError fires when the user dismisses the system share sheet — ignore.
      if (!/AbortError/i.test(msg)) {
        console.error("[player] share failed", err);
        toast.error(msg);
      }
    } finally {
      setSharing(false);
    }
  }, [sharing, data?.id, data?.sections, presentShareLink]);

  const handleShareSection = useCallback(
    async (index: number) => {
      if (sharing || !data?.id) return;
      const section = data.sections?.[index];
      if (!section) return;
      setSharing(true);
      try {
        const { url } = await shareBriefing(data.id, { sectionIndex: index });
        await presentShareLink(
          url,
          `Yours — ${section.title}`,
          `Listen to "${section.title}" from today's Yours briefing.`,
          "Section share link copied",
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn't create share link";
        if (!/AbortError/i.test(msg)) {
          console.error("[player] section share failed", err);
          toast.error(msg);
        }
      } finally {
        setSharing(false);
      }
    },
    [sharing, data?.id, data?.sections, presentShareLink],
  );

  // When user manually taps a section tab, we pin it until audio catches up
  const [manualSection, setManualSection] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track which audio URL is currently loaded so we don't reset on signed-URL refresh
  const loadedUrlRef = useRef<string | null>(null);
  const markedListenedRef = useRef(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  // Refs to each spoken text chunk so we can scroll the active one into view.
  const chunkRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Refs to each transcript section block (for auto-scroll inside the overlay).
  const transcriptSectionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Scrollable parent for the transcript overlay so we scroll WITHIN it.
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const sections: BriefingSection[] = data?.sections ?? [];
  // Prefer actual audio duration from the <audio> element over the estimate.
  const totalDuration = duration > 0 ? duration : (data?.audio_duration_seconds ?? 0);

  // Compute section time offsets. Prefer the server-recorded offsets when
  // available (TTS pipeline writes the exact byte position of each section's
  // first sample, accounting for intro music + ambient transitions). Fall
  // back to a char-weighted estimate when offsets are missing or partial.
  // When PARTIAL server data is available (e.g. only [3.6] when there are 4
  // sections — LLM didn't emit [section_break] markers), use that first
  // value as the real intro length and char-weight the remainder so sections
  // still align with the actual audio start instead of guessing.
  const sectionOffsets = useMemo(() => {
    const serverOffsets = data?.section_offsets;
    if (Array.isArray(serverOffsets) && serverOffsets.length === sections.length) {
      return serverOffsets;
    }
    const introLen =
      Array.isArray(serverOffsets) && serverOffsets.length > 0
        ? serverOffsets[0]
        : INTRO_MUSIC_SECONDS;
    return buildSectionOffsets(sections, totalDuration, introLen);
  }, [data?.section_offsets, sections, totalDuration]);

  // Section durations in seconds (scaled to match audio)
  const sectionDurations = useMemo(() => {
    return sectionOffsets.map((offset, i) => {
      const next = i < sectionOffsets.length - 1 ? sectionOffsets[i + 1] : totalDuration;
      return next - offset;
    });
  }, [sectionOffsets, totalDuration]);

  // The "intro" of the briefing covers the music sting + the spoken greeting +
  // the 2-3 sentence headline summary, ending just before the first content
  // segment starts. While currentTime is inside this window we show the
  // visual recap instead of the per-section transcript view.
  //
  // We approximate the boundary as (music end) + SPOKEN_INTRO_SECONDS. The
  // music end comes from sectionOffsets[0] when the server recorded real
  // offsets, otherwise the static fallback. A future server-side [intro_end]
  // marker can replace this heuristic with an exact value.
  const introEndTime = useMemo(() => {
    const musicEnd = sectionOffsets[0] ?? INTRO_MUSIC_SECONDS;
    return musicEnd + SPOKEN_INTRO_SECONDS;
  }, [sectionOffsets]);
  const showIntroRecap = currentTime < introEndTime;

  const cycleSpeed = () => {
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const skip15 = () => {
    const el = audioRef.current;
    if (el) el.currentTime = Math.min(el.currentTime + 15, el.duration || Infinity);
  };

  /** Jump audio to a specific section */
  const jumpToSection = useCallback(
    (index: number) => {
      const el = audioRef.current;
      if (el && sectionOffsets[index] != null) {
        const targetTime = sectionOffsets[index];
        const audioDur = el.duration || Infinity;
        // Clamp to not jump past the end of audio
        el.currentTime = Math.min(targetTime, Math.max(0, audioDur - 0.5));
        // Start playback directly to preserve the user-gesture context.
        if (el.paused) {
          const promise = el.play();
          setIsPlaying(true);
          if (promise) {
            promise.catch((err) => {
              console.error("[player] play() rejected on jump", err);
              setIsPlaying(false);
              setAudioError(err instanceof Error ? err.message : "Couldn't start playback");
            });
          }
        }
      }
      setActiveSectionIndex(index);
      setManualSection(null);
    },
    [sectionOffsets],
  );

  // Auto-track active section from audio time
  useEffect(() => {
    if (!isPlaying || sections.length === 0 || totalDuration === 0) return;
    const audioSection = activeSectionForTime(currentTime, sectionOffsets, totalDuration);
    // If user manually selected a section (just tapped a tab without jumping audio),
    // keep showing it until audio naturally enters that section
    if (manualSection != null) {
      if (audioSection === manualSection) setManualSection(null);
      return;
    }
    if (audioSection !== activeSectionIndex) {
      setActiveSectionIndex(audioSection);
    }
  }, [currentTime, isPlaying, sectionOffsets, totalDuration, sections.length, activeSectionIndex, manualSection]);

  // Mark listened on first play
  useEffect(() => {
    if (!isPlaying || markedListenedRef.current || !data?.id) return;
    markedListenedRef.current = true;
    void markBriefingListened(data.id);
  }, [isPlaying, data?.id]);

  // Set audio src only when we get a genuinely new audio file (not just a refreshed signed URL).
  // Supabase signed URLs point to the same storage object — only the path before "?" matters.
  useEffect(() => {
    const el = audioRef.current;
    const url = data?.audio_signed_url;
    if (!el || !url) return;
    // Extract the storage path (everything before the query-string signature)
    const path = url.split("?")[0];
    if (loadedUrlRef.current === path) return; // same file, skip
    loadedUrlRef.current = path;
    setAudioError(null);
    el.src = url;
    el.load();
  }, [data?.audio_signed_url]);

  // One-shot deep-link to ?s=<index> — seek to that section's start once audio
  // metadata is available. Doesn't auto-play (Safari/iOS block autoplay
  // without a user gesture). Guarded so signed-URL refreshes don't re-trigger.
  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;
    if (sectionParam == null) return;
    if (sections.length === 0) return;
    const el = audioRef.current;
    if (!el) return;
    if (sectionOffsets.length !== sections.length) return; // wait for offsets
    const targetIndex = Math.max(0, Math.min(sectionParam, sections.length - 1));
    const targetTime = sectionOffsets[targetIndex];
    const apply = () => {
      const a = audioRef.current;
      if (!a) return;
      // If duration isn't available yet, defer — but mark applied so we don't
      // race the same effect firing again on next render.
      if (!isFinite(a.duration) || a.duration === 0) return;
      a.currentTime = Math.min(targetTime, Math.max(0, a.duration - 0.5));
      setActiveSectionIndex(targetIndex);
      setManualSection(targetIndex);
      deepLinkAppliedRef.current = true;
    };
    if (isFinite(el.duration) && el.duration > 0) {
      apply();
    } else {
      const onMeta = () => apply();
      el.addEventListener("loadedmetadata", onMeta, { once: true });
      return () => el.removeEventListener("loadedmetadata", onMeta);
    }
  }, [sectionParam, sections.length, sectionOffsets, data?.audio_signed_url]);

  // One-shot autoplay when arriving via state.autoplay (set by GenerationFlow
  // after first-briefing onboarding). Browsers count the originating click as
  // a user gesture for ~5s, so this usually succeeds. iOS Safari can still
  // refuse — we surface a small chip and leave the player paused in that case.
  const autoplayAppliedRef = useRef(false);
  useEffect(() => {
    if (autoplayAppliedRef.current) return;
    if (!autoplayRequested) return;
    if (!data?.audio_signed_url) return;
    const el = audioRef.current;
    if (!el) return;
    const tryPlay = () => {
      autoplayAppliedRef.current = true;
      const promise = el.play();
      if (promise) {
        promise
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
            // Not an error — just leave paused. Surface a hint via toast.
            toast("Tap play to listen", { duration: 4000 });
          });
      } else {
        setIsPlaying(true);
      }
      // Clear the autoplay flag from history state so refresh doesn't replay.
      navigate(location.pathname + location.search, { replace: true, state: {} });
    };
    if (el.readyState >= 2) {
      tryPlay();
    } else {
      const onReady = () => tryPlay();
      el.addEventListener("loadedmetadata", onReady, { once: true });
      return () => el.removeEventListener("loadedmetadata", onReady);
    }
  }, [autoplayRequested, data?.audio_signed_url, navigate, location.pathname, location.search]);

  // Sync audio playbackRate when speed changes (no play() here — that must
  // be called synchronously in a user gesture, see togglePlay below).
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  // Toggle play/pause. play() is called directly inside the click handler
  // (not in a useEffect) so the browser preserves the user-gesture context
  // required by autoplay policies (Safari/iOS especially).
  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      const promise = el.play();
      // Optimistically flip state; revert if play() rejects.
      setIsPlaying(true);
      if (promise) {
        promise.catch((err) => {
          console.error("[player] play() rejected", err);
          setIsPlaying(false);
          setAudioError(err instanceof Error ? err.message : "Couldn't start playback");
        });
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  // Track time updates and surface load/play errors
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDuration = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      const err = el.error;
      const codeMap: Record<number, string> = {
        1: "Playback aborted",
        2: "Network error fetching audio",
        3: "Audio decode error — file may be corrupted",
        4: "Audio format not supported",
      };
      const msg = err ? (codeMap[err.code] ?? `Audio error (code ${err.code})`) : "Unknown audio error";
      console.error("[player] audio error", err);
      setIsPlaying(false);
      setAudioError(msg);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDuration);
    el.addEventListener("durationchange", onDuration);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDuration);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, []);

  // RequestAnimationFrame loop while playing — drives the progress bar at
  // ~60fps so it ticks visibly smoothly. Browsers fire `timeupdate` only
  // every ~250ms, which makes the bar look like it lurches.
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const el = audioRef.current;
      if (el) setCurrentTime(el.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Scrubber interaction
  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const el = audioRef.current;
      const bar = progressRef.current;
      if (!el || !bar) return;
      const rect = bar.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      el.currentTime = pct * (el.duration || 0);
    },
    [],
  );

  const activeSection = sections[activeSectionIndex];
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // How far through the active section we are (0..1)
  const sectionProgress = useMemo(() => {
    if (!isPlaying && currentTime === 0) return 0;
    const offset = sectionOffsets[activeSectionIndex] ?? 0;
    const dur = sectionDurations[activeSectionIndex] ?? 1;
    if (dur <= 0) return 0;
    return Math.max(0, Math.min(1, (currentTime - offset) / dur));
  }, [currentTime, activeSectionIndex, sectionOffsets, sectionDurations, isPlaying]);

  // Derive the text chunks and sources from the active section. Must be
  // computed BEFORE any early returns so hook order stays stable across
  // renders (React rules of hooks).
  const summaryChunks = useMemo(
    () => (activeSection ? splitSummary(activeSection.summary) : []),
    [activeSection],
  );
  const payload = (activeSection?.card_payload ?? null) as {
    items?: string[];
    sources?: Array<{ title: string; url?: string; image_url?: string; source_name?: string }>;
  } | null;
  const cardItems = payload?.items;
  const sources = payload?.sources;

  // ---------- Intro recap data ----------
  // The visual recap shown during the spoken intro picks one of each section
  // type from the briefing if present, then renders structured cards. Looked
  // up via section.type rather than position so reordering the briefing
  // (e.g. executive mode leading with news) doesn't break the recap.
  type RecapPayload = {
    items?: string[];
    sources?: Array<{ title: string; url?: string; image_url?: string; source_name?: string }>;
  };
  const weatherSection = sections.find((s) => s.type === "weather");
  const newsSection = sections.find((s) => s.type === "news");
  const calendarSection = sections.find((s) => s.type === "calendar");
  const sportsSection = sections.find((s) => s.type === "sports");
  const newsHeadlines = ((newsSection?.card_payload as RecapPayload | null)?.sources ?? []).slice(0, 3);
  const weatherIconText = `${weatherSection?.summary ?? ""} ${
    ((weatherSection?.card_payload as RecapPayload | null)?.items ?? []).join(" ")
  }`;
  const WeatherIcon = pickWeatherIcon(weatherIconText);
  const weatherTemp =
    extractTemperature(weatherSection?.summary) ??
    extractTemperature(((weatherSection?.card_payload as RecapPayload | null)?.items ?? []).join(" "));

  const allChunks = useMemo(() => {
    const chunks = [...summaryChunks];
    if (cardItems) chunks.push(...cardItems);
    return chunks;
  }, [summaryChunks, cardItems]);

  const spokenUpTo = useMemo(() => {
    if (allChunks.length === 0) return 0;
    const charCounts = allChunks.map((c) => c.length);
    const totalChars = charCounts.reduce((a, b) => a + b, 0);
    if (totalChars === 0) return 0;
    let cumulative = 0;
    for (let i = 0; i < charCounts.length; i++) {
      cumulative += charCounts[i];
      if (cumulative / totalChars > sectionProgress) return i;
    }
    return allChunks.length;
  }, [allChunks, sectionProgress]);

  // Auto-scroll the currently-spoken chunk into view. block: 'center' keeps
  // the active line in the middle of the viewport so the listener's eye
  // doesn't have to hunt for it. Skipped on first paint (when nothing is
  // playing yet) so the page doesn't jump on load.
  useEffect(() => {
    if (!isPlaying) return;
    const el = chunkRefs.current[spokenUpTo];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [spokenUpTo, isPlaying]);

  // When the active section changes inside the transcript overlay, scroll
  // its block into view so the user always sees what's currently playing.
  useEffect(() => {
    if (!showTranscript) return;
    const block = transcriptSectionRefs.current[activeSectionIndex];
    const parent = transcriptScrollRef.current;
    if (!block || !parent) return;
    // Use the parent's scrollTop so we only scroll within the modal, not the
    // whole page (block.scrollIntoView would scroll the page on iOS Safari).
    const parentRect = parent.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const target = parent.scrollTop + (blockRect.top - parentRect.top) - parentRect.height / 3;
    parent.scrollTo({ top: target, behavior: "smooth" });
  }, [activeSectionIndex, showTranscript]);

  // ---------- Media Session API ----------
  // Pick the most recent source-image we have in any section's card_payload
  // for use as lock-screen artwork. Updates as the active section changes
  // (per user request: use real article images, no static logo).
  const artworkUrl = useMemo<string | null>(() => {
    const pl = activeSection?.card_payload as
      | { sources?: Array<{ image_url?: string }> }
      | null
      | undefined;
    return pl?.sources?.find((s) => !!s.image_url)?.image_url ?? null;
  }, [activeSection]);

  // Wire Media Session metadata + action handlers so OS-level lock-screen
  // controls (iOS Now Playing, Android lock screen, macOS Control Center)
  // show the briefing and let the user play/pause/seek without unlocking.
  useEffect(() => {
    if (!data?.id || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const dateLabel = formatBriefingDate(data.date);
    ms.metadata = new MediaMetadata({
      title: `${dateLabel} – Briefing`,
      artist: "Yours",
      album: "Yours",
      // Empty artwork array = no image surfaced (per user: only use real
      // article images; never a static logo). Browsers show the fav-icon
      // or no image in that case.
      artwork: artworkUrl ? [{ src: artworkUrl, sizes: "512x512" }] : [],
    });

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play",         () => { void audioRef.current?.play(); setIsPlaying(true); }],
      ["pause",        () => { audioRef.current?.pause(); setIsPlaying(false); }],
      ["seekto",       (d) => { if (d.seekTime != null && audioRef.current) audioRef.current.currentTime = d.seekTime; }],
      ["seekbackward", (d) => { const el = audioRef.current; if (el) el.currentTime = Math.max(0, el.currentTime - (d.seekOffset ?? 15)); }],
      ["seekforward",  (d) => { const el = audioRef.current; if (el) el.currentTime = Math.min((el.duration || 0) - 0.5, el.currentTime + (d.seekOffset ?? 15)); }],
      ["nexttrack",    () => jumpToSection(Math.min(activeSectionIndex + 1, sections.length - 1))],
      ["previoustrack",() => jumpToSection(Math.max(activeSectionIndex - 1, 0))],
    ];
    for (const [action, handler] of handlers) {
      try { ms.setActionHandler(action, handler); } catch { /* unsupported on this browser */ }
    }
    return () => {
      for (const [action] of handlers) {
        try { ms.setActionHandler(action, null); } catch { /* noop */ }
      }
    };
  }, [data?.id, data?.date, artworkUrl, activeSectionIndex, sections.length, jumpToSection]);

  // Mirror playback state to MediaSession so the OS lock-screen widget knows
  // whether to show Play or Pause.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Push the live position to MediaSession so the lock-screen scrubber
  // tracks accurately. Throttled to once per second to avoid quota churn.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (typeof ms.setPositionState !== "function") return;
    const interval = window.setInterval(() => {
      const el = audioRef.current;
      if (!el || !isFinite(el.duration)) return;
      try {
        ms.setPositionState({
          duration: el.duration,
          position: Math.min(el.currentTime, el.duration),
          playbackRate: el.playbackRate,
        });
      } catch { /* some browsers throw on bad inputs — ignore */ }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [data?.audio_signed_url]);

  // While we're waiting for auth to resolve (and have no signed-link token),
  // hold off on errors and just show a brief loader.
  if (!queryReady) {
    return (
      <div className="min-h-screen yours-warm-gradient flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Signing you in…</p>
      </div>
    );
  }

  if (isLoading || (!data && !isError)) {
    return (
      <div className="min-h-screen yours-warm-gradient flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/80 text-sm">
          {isLoading ? "Loading your briefing..." : "Your briefing is still generating..."}
        </p>
      </div>
    );
  }

  if (isError || !data) {
    const msg = error instanceof Error ? error.message : "";
    const isAuthError = /^get-briefing 40[13]/.test(msg);
    return (
      <div className="min-h-screen yours-warm-gradient flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white text-xl font-bold mb-2">
          {isAuthError ? "Please sign in" : "Briefing unavailable"}
        </p>
        <p className="text-white/70 text-sm max-w-xs mb-6">
          {isAuthError
            ? "Your session expired or you're not signed in. Sign in to access your briefing."
            : "This link may have expired, or your briefing isn't ready yet. Check your dashboard."}
        </p>
        <Link to={isAuthError ? "/login" : backHref} className="text-white/90 underline text-sm">
          {isAuthError ? "Sign in" : "Back to dashboard"}
        </Link>
      </div>
    );
  }

  if (sections.length === 0 || !activeSection) {
    return (
      <div className="min-h-screen yours-warm-gradient flex items-center justify-center">
        <p className="text-white/80 text-sm">No sections in this briefing.</p>
      </div>
    );
  }

  // Briefing exists and has sections, but audio hasn't finished uploading yet.
  // The query keeps polling — show a clear waiting state instead of a silent player.
  if (!data.audio_signed_url) {
    return (
      <div className="min-h-screen yours-warm-gradient flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/90 text-sm font-medium">Finishing your audio…</p>
        <p className="text-white/60 text-xs max-w-xs">
          Sections are ready. The voice track usually wraps up in a few more seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col yours-section-default">
      {/* Per-section gradient stack — one absolute layer per section, only the
          active one is opaque. CSS transition crossfades them as the user
          moves through chapters. Sits behind all content. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 yours-section-${s.type} transition-opacity duration-700 ease-out`}
            style={{ opacity: i === activeSectionIndex ? 1 : 0 }}
          />
        ))}
      </div>

      {/* All real content lives above the gradient stack */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">

      {/* Stable audio element — src is managed via ref to prevent resets on signed-URL refresh */}
      <audio ref={audioRef} preload="metadata" />

      {audioError && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-500/95 text-white text-xs px-4 py-2 text-center">
          {audioError}
        </div>
      )}

      {/* Top bar — extra top padding so the buttons clear the iOS notch
          comfortably and don't crowd the title. */}
      <div
        className="flex items-center justify-between px-5 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 28px)" }}
      >
        <Link
          to={backHref}
          className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-white/90" strokeWidth={1.5} />
        </Link>
        {/* Text-only title — logo lives in the intro recap below where it can
            breathe at premium size. The personalized greeting also moves to
            the recap so the top bar stays clean. */}
        <YoursLogo size={44} className="opacity-90" />
        <button
          onClick={handleShare}
          disabled={sharing}
          className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors disabled:opacity-60"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 text-white/90 animate-spin" />
          ) : (
            <Share className="h-4.5 w-4.5 text-white/90" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Crossfade between intro recap (first ~14s of spoken intro) and the
          per-section transcript view. mode="wait" makes the outgoing layer
          finish fading before the incoming one starts, which avoids the
          two views briefly overlapping at scroll position 0. */}
      <AnimatePresence mode="wait">
        {showIntroRecap ? (
          <motion.div
            key="intro-recap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1 overflow-y-auto pb-56"
          >
            <div className="max-w-lg mx-auto px-6 pt-4">
              {/* Premium brand mark — large and centered, sets the tone for
                  the visual recap. Top bar stays text-only "Yours" so this
                  is the only logo on the page. */}
              <div className="flex justify-center mb-8 mt-2">
                <YoursLogo size={128} className="text-white" />
              </div>

              {/* Greeting + date. Mirrors the spoken intro the listener
                  hears under this card: "Good morning, [Name]. Here's
                  what's happening today…". */}
              <div className="text-center mb-10">
                <p className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                  {formatBriefingDate(data.date)}
                </p>
                <h2 className="text-white text-[34px] font-bold tracking-tight leading-[1.1]">
                  {firstName ? `${getGreeting()}, ${firstName}.` : `${getGreeting()}.`}
                </h2>
                <p className="text-white/75 text-base mt-3 leading-snug">
                  Here's what's happening today.
                </p>
              </div>

              {/* Weather card — icon + extracted temp (when parseable) +
                  condition. Falls back to summary prose when no temp can be
                  pulled cleanly from the LLM-written text. */}
              {weatherSection && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-3 flex items-center gap-4 border border-white/5">
                  <WeatherIcon className="h-14 w-14 text-white shrink-0" strokeWidth={1.25} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/55 text-[10px] font-semibold tracking-[0.18em] uppercase mb-1">
                      Weather
                    </p>
                    {weatherTemp ? (
                      <>
                        <p className="text-white text-3xl font-bold tabular-nums leading-none">
                          {weatherTemp}
                        </p>
                        <p className="text-white/70 text-sm mt-1.5 leading-snug line-clamp-2">
                          {weatherSection.summary}
                        </p>
                      </>
                    ) : (
                      <p className="text-white text-base font-semibold leading-snug line-clamp-3">
                        {weatherSection.summary}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Top headline cards. Each card uses the source's article
                  image when available, otherwise renders text-only so we
                  never show a broken-image placeholder. */}
              {newsHeadlines.length > 0 && (
                <div className="mb-3">
                  <p className="text-white/50 text-[10px] font-semibold tracking-[0.18em] uppercase mb-3 px-1">
                    Top stories
                  </p>
                  <div className="space-y-3">
                    {newsHeadlines.map((src, i) => (
                      <div
                        key={i}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5"
                      >
                        {src.image_url && (
                          <img
                            src={src.image_url}
                            alt=""
                            className="w-full h-36 object-cover bg-white/5"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="p-4">
                          <p className="text-white text-base font-bold leading-snug line-clamp-3">
                            {src.title}
                          </p>
                          {src.source_name && (
                            <p className="text-white/50 text-xs mt-1.5 font-medium tracking-wide uppercase">
                              {src.source_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional context cards — only render when the briefing
                  actually has the section. Skip filler so the recap stays
                  uncluttered when the user has no calendar/sports data. */}
              {calendarSection && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-3 flex items-start gap-3 border border-white/5">
                  <CalendarIcon className="h-6 w-6 text-white/85 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/55 text-[10px] font-semibold tracking-[0.18em] uppercase mb-1">
                      Today
                    </p>
                    <p className="text-white text-sm font-medium leading-snug line-clamp-3">
                      {calendarSection.summary}
                    </p>
                  </div>
                </div>
              )}
              {sportsSection && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-3 flex items-start gap-3 border border-white/5">
                  <Trophy className="h-6 w-6 text-white/85 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/55 text-[10px] font-semibold tracking-[0.18em] uppercase mb-1">
                      Sports
                    </p>
                    <p className="text-white text-sm font-medium leading-snug line-clamp-3">
                      {sportsSection.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="transcript-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1 overflow-y-auto pb-56"
          >
            {/* Section tabs */}
            <div className="px-5 pt-2 pb-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
                {sections.map((s, i) => {
                  const isCurrent = i === activeSectionIndex;
                  const isPast = currentTime >= (sectionOffsets[i + 1] ?? totalDuration);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSectionIndex(i);
                        setManualSection(i);
                      }}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-white/25 text-white"
                          : isPast
                            ? "bg-white/15 text-white/70"
                            : "bg-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content area — centered, large readable typography. */}
            <div className="max-w-lg mx-auto px-6">
              <motion.div
                key={activeSectionIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Section title */}
                <p className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-4">
                  {activeSection.title}
                </p>

                {/* Summary text — single chunk renders centered, multi-chunk
                    is a centered stack with the active line large+bold and
                    siblings dimmed. No bullets so the spoken text reads as
                    a single premium block, not a transcript list. */}
                {summaryChunks.length === 1 ? (
                  <div
                    ref={(el) => { chunkRefs.current[0] = el; }}
                    className="scroll-mt-24"
                  >
                    <p
                      className={`text-[22px] leading-[1.45] tracking-[-0.01em] mb-6 transition-all duration-500 ${
                        spokenUpTo >= 1
                          ? "text-white font-bold"
                          : "text-white/40 font-light"
                      }`}
                    >
                      {summaryChunks[0]}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5 mb-6">
                    {summaryChunks.map((chunk, i) => {
                      const isSpoken = i < spokenUpTo;
                      const isSpeaking = i === spokenUpTo;
                      return (
                        <div
                          key={i}
                          ref={(el) => { chunkRefs.current[i] = el; }}
                          className="scroll-mt-24"
                        >
                          <p
                            className={`text-center transition-all duration-500 ${
                              isSpeaking
                                ? "text-white text-[22px] font-bold leading-[1.35] tracking-[-0.01em]"
                                : isSpoken
                                  ? "text-white/65 text-base font-medium leading-snug"
                                  : "text-white/30 text-base font-light leading-snug"
                            }`}
                          >
                            {chunk}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card items — same centered spoken/upcoming treatment.
                    Card items pick up where summary chunks left off in the
                    chunkRefs index, so the auto-scroll keeps tracking. */}
                {cardItems && cardItems.length > 0 && (
                  <div className="space-y-4 mt-2">
                    {cardItems.map((item, i) => {
                      const globalIndex = summaryChunks.length + i;
                      const isSpoken = globalIndex < spokenUpTo;
                      const isSpeaking = globalIndex === spokenUpTo;
                      return (
                        <div
                          key={i}
                          ref={(el) => { chunkRefs.current[globalIndex] = el; }}
                          className="scroll-mt-24"
                        >
                          <p
                            className={`text-center transition-all duration-500 ${
                              isSpeaking
                                ? "text-white text-lg font-bold leading-snug"
                                : isSpoken
                                  ? "text-white/65 text-[15px] font-medium leading-snug"
                                  : "text-white/25 text-[15px] font-light leading-snug"
                            }`}
                          >
                            {item}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Source links & images */}
                {sources && sources.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-white/30 text-[10px] font-semibold tracking-wider uppercase">Sources</p>
                    {sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                      >
                        {src.image_url && (
                          <img
                            src={src.image_url}
                            alt=""
                            className="shrink-0 w-16 h-16 rounded-lg object-cover bg-white/10"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
                            {src.title}
                          </p>
                          {src.source_name && (
                            <p className="text-white/40 text-xs mt-1">{src.source_name}</p>
                          )}
                        </div>
                        {src.url && (
                          <ExternalLink className="shrink-0 h-3.5 w-3.5 text-white/30 mt-0.5 group-hover:text-white/60 transition-colors" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapters overlay */}
      <AnimatePresence>
        {showChapters && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-black/90 backdrop-blur-xl rounded-t-3xl max-h-[60vh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-xl">
              <h2 className="text-white font-bold text-base">Chapters</h2>
              <button
                onClick={() => setShowChapters(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>
            <div className="px-5 py-2">
              {sections.map((s, i) => {
                const isCurrent = i === activeSectionIndex;
                const startTime = sectionOffsets[i] ?? 0;
                return (
                  <div
                    key={s.id}
                    className={`w-full flex items-center gap-2 py-1 px-1 rounded-xl transition-colors ${
                      isCurrent ? "bg-white/15" : "hover:bg-white/5"
                    }`}
                  >
                    <button
                      onClick={() => {
                        jumpToSection(i);
                        setShowChapters(false);
                      }}
                      className="flex-1 text-left flex items-center gap-3 py-2 px-2 rounded-lg"
                    >
                      <span
                        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent ? "bg-white text-neutral-900" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? "text-white" : "text-white/80"}`}>
                          {s.title}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          {formatTime(startTime)} · {s.duration_minutes} min
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 text-xs font-medium text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                          Playing
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleShareSection(i);
                      }}
                      disabled={sharing}
                      className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors disabled:opacity-40"
                      aria-label={`Share section ${s.title}`}
                      title="Share this section"
                    >
                      {sharing ? (
                        <Loader2 className="h-3.5 w-3.5 text-white/70 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5 text-white/70" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript overlay — auto-scrolls the active section into view as
          playback advances. The scrollable parent is captured in
          transcriptScrollRef so we scroll within the modal, not the page. */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            ref={transcriptScrollRef}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-black/90 backdrop-blur-xl rounded-t-3xl max-h-[70vh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-xl">
              <h2 className="text-white font-bold text-base">Transcript</h2>
              <button
                onClick={() => setShowTranscript(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-5">
              {sections.map((s, i) => {
                const isCurrent = i === activeSectionIndex;
                const isPast = currentTime >= (sectionOffsets[i + 1] ?? totalDuration);
                return (
                  <button
                    key={s.id}
                    ref={(el) => { transcriptSectionRefs.current[i] = el; }}
                    onClick={() => jumpToSection(i)}
                    className="w-full text-left"
                  >
                    <p className={`text-xs font-semibold tracking-wider uppercase mb-2 ${
                      isCurrent ? "text-white/70" : "text-white/30"
                    }`}>
                      {s.title}
                    </p>
                    <p className={`text-sm leading-relaxed transition-all duration-300 ${
                      isCurrent
                        ? "text-white/90 font-medium"
                        : isPast
                          ? "text-white/50"
                          : "text-white/25 font-light"
                    }`}>
                      {s.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom fixed controls */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,16px)] pb-5 pt-3 px-4 bg-gradient-to-t from-black/50 via-black/30 to-transparent">
        <div className="max-w-[480px] mx-auto space-y-3">

          {/* Now playing indicator */}
          <div className="text-center">
            <p className="text-white/50 text-[11px] font-medium tracking-wide uppercase">
              Now playing
            </p>
            <p className="text-white text-sm font-semibold truncate">
              {activeSection.title}
            </p>
          </div>

          {/* Chapters / Transcript row */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setShowChapters(true); setShowTranscript(false); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <List className="h-3.5 w-3.5 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Chapters</span>
            </button>
            <button
              onClick={() => { setShowTranscript(true); setShowChapters(false); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Transcript</span>
            </button>
          </div>

          {/* Progress bar / scrubber */}
          <div className="space-y-1">
            <div
              ref={progressRef}
              onClick={handleScrub}
              onTouchMove={handleScrub}
              className="relative h-1.5 bg-white/15 rounded-full cursor-pointer group"
            >
              {/* Chapter tick marks */}
              {sectionOffsets.slice(1).map((offset, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full w-px bg-white/30"
                  style={{ left: `${(offset / totalDuration) * 100}%` }}
                />
              ))}
              <div
                className="absolute left-0 top-0 h-full bg-white rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/40 font-medium tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Main transport controls: Speed | Play/Pause | Skip 15s */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={cycleSpeed}
              className="h-11 w-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <span className="text-white text-xs font-bold tabular-nums">{speed}x</span>
            </button>

            <button
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 text-neutral-900" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="h-7 w-7 text-neutral-900 ml-0.5" fill="currentColor" strokeWidth={0} />
              )}
            </button>

            <button
              onClick={skip15}
              className="h-11 w-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors gap-0.5"
            >
              <SkipForward className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              <span className="text-[10px] font-bold text-white/80">15</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
