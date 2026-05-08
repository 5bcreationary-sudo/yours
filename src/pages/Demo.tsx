import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pause, Play, SkipForward, List, FileText, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YoursLogo } from "@/components/YoursLogo";

/** Static demo briefing — runs entirely client-side. Lets visitors hear what
 *  Yours sounds like without needing an account. The audio file lives at
 *  VITE_DEMO_AUDIO_URL (or /demo.wav as a fallback). If the file isn't present
 *  the visual section walkthrough still plays so the UX is conveyed. */

interface DemoSection {
  id: string;
  type: "weather" | "calendar" | "news" | "sports" | "interests";
  title: string;
  summary: string;
  duration_seconds: number;
}

const DEMO_SECTIONS: DemoSection[] = [
  {
    id: "weather",
    type: "weather",
    title: "Weather",
    summary:
      "High of sixty-eight today with increasing clouds moving in by afternoon. There's a forty percent chance of showers around four or five o'clock, so if you're heading out for lunch, grab a light jacket. Saturday looks nice, then we're back to rain on Sunday.",
    duration_seconds: 18,
  },
  {
    id: "calendar",
    type: "calendar",
    title: "Your schedule",
    summary:
      "Product standup at ten, marketing sync at eleven-thirty. After that, your calendar opens up until four with the exec briefing. That's your window if you need to catch up on emails or anything from yesterday's board prep.",
    duration_seconds: 18,
  },
  {
    id: "news",
    type: "news",
    title: "Headlines",
    summary:
      "The European Union just formalized its AI Safety Act — any AI system above a set capability threshold now needs third-party audits. The U.S. is already drafting its version. Markets opened down point-three percent after the Fed held rates steady again. Most analysts expect they'll start cutting by summer.",
    duration_seconds: 30,
  },
  {
    id: "wrap",
    type: "interests",
    title: "Wrap-up",
    summary:
      "That's your morning. Get some good work done. This has been Yours.",
    duration_seconds: 8,
  },
];

const TOTAL_DEMO_DURATION = DEMO_SECTIONS.reduce((s, x) => s + x.duration_seconds, 0);

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Section start offsets in seconds — exact, since we control the durations. */
function buildOffsets(): number[] {
  const offsets: number[] = [];
  let cursor = 0;
  for (const s of DEMO_SECTIONS) {
    offsets.push(cursor);
    cursor += s.duration_seconds;
  }
  return offsets;
}

export default function Demo() {
  const navigate = useNavigate();

  const audioUrl = (import.meta.env.VITE_DEMO_AUDIO_URL as string | undefined) ?? "/demo.wav";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);

  const [audioOk, setAudioOk] = useState<boolean | null>(null); // null = unknown
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [showChapters, setShowChapters] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const sectionOffsets = useMemo(buildOffsets, []);
  const totalDuration = duration > 0 ? duration : TOTAL_DEMO_DURATION;

  // Probe whether the demo audio exists. If not, we'll fall back to a
  // self-driving visual walkthrough using setInterval.
  useEffect(() => {
    let cancelled = false;
    fetch(audioUrl, { method: "HEAD" })
      .then((r) => { if (!cancelled) setAudioOk(r.ok); })
      .catch(() => { if (!cancelled) setAudioOk(false); });
    return () => { cancelled = true; };
  }, [audioUrl]);

  // Real-audio path: drive currentTime from the <audio> element.
  useEffect(() => {
    if (audioOk !== true) return;
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDuration = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDuration);
    el.addEventListener("durationchange", onDuration);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDuration);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioOk]);

  // Visual-only path: tick the progress bar at 100ms so the section
  // walkthrough still works when no audio is hosted yet.
  useEffect(() => {
    if (audioOk !== false) return;
    if (!isPlaying) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = window.setInterval(() => {
      setCurrentTime((t) => {
        if (t >= TOTAL_DEMO_DURATION) {
          setIsPlaying(false);
          return TOTAL_DEMO_DURATION;
        }
        return t + 0.1;
      });
    }, 100);
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [audioOk, isPlaying]);

  // Keep the active section in sync with playback time.
  useEffect(() => {
    let idx = 0;
    for (let i = sectionOffsets.length - 1; i >= 0; i--) {
      if (currentTime >= sectionOffsets[i]) { idx = i; break; }
    }
    if (idx !== activeSectionIndex) setActiveSectionIndex(idx);
  }, [currentTime, sectionOffsets, activeSectionIndex]);

  const togglePlay = useCallback(() => {
    if (audioOk === true) {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) { el.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
      else { el.pause(); setIsPlaying(false); }
    } else {
      setIsPlaying((p) => !p);
    }
  }, [audioOk]);

  const skip15 = useCallback(() => {
    const next = Math.min(currentTime + 15, totalDuration);
    if (audioOk === true) {
      const el = audioRef.current;
      if (el) el.currentTime = next;
    } else {
      setCurrentTime(next);
    }
  }, [currentTime, totalDuration, audioOk]);

  const jumpToSection = useCallback((i: number) => {
    const t = sectionOffsets[i] ?? 0;
    if (audioOk === true) {
      const el = audioRef.current;
      if (el) el.currentTime = t;
    } else {
      setCurrentTime(t);
    }
    setActiveSectionIndex(i);
    if (!isPlaying) setIsPlaying(true);
  }, [sectionOffsets, audioOk, isPlaying]);

  const activeSection = DEMO_SECTIONS[activeSectionIndex];
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="min-h-screen relative flex flex-col yours-section-default">
      {/* Per-section gradient stack — same crossfade as the real player */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {DEMO_SECTIONS.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 yours-section-${s.type} transition-opacity duration-700 ease-out`}
            style={{ opacity: i === activeSectionIndex ? 1 : 0 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {audioOk === true && (
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
        )}

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 28px)" }}
        >
          <button
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-white/90" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <YoursLogo size={44} className="text-white" />
            <h1 className="text-white text-lg font-bold tracking-tight">Demo briefing</h1>
          </div>
          <div className="h-10 w-10" />
        </div>

        {audioOk === false && (
          <div className="mx-5 mt-1 mb-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/85 text-[11px] text-center">
            Visual preview — sign up to hear your own briefing
          </div>
        )}

        {/* Section tabs */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
            {DEMO_SECTIONS.map((s, i) => {
              const isCurrent = i === activeSectionIndex;
              const isPast = currentTime >= (sectionOffsets[i + 1] ?? totalDuration);
              return (
                <button
                  key={s.id}
                  onClick={() => jumpToSection(i)}
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

        {/* Active section content */}
        <div className="flex-1 overflow-y-auto pb-60">
          <div className="max-w-lg mx-auto px-6">
            <motion.div
              key={activeSectionIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-4">
                {activeSection.title}
              </p>
              <p className="text-white text-[20px] leading-[1.5] tracking-[-0.01em] font-medium">
                {activeSection.summary}
              </p>

              {/* CTA card */}
              <div className="mt-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <p className="text-white text-sm font-semibold">Want one of your own?</p>
                </div>
                <p className="text-white/80 text-xs leading-relaxed mb-3">
                  Yours generates a fresh briefing every morning — your weather, your calendar, your news. Free to start.
                </p>
                <Button
                  onClick={() => navigate("/signup")}
                  className="w-full h-10 rounded-xl bg-white text-neutral-900 hover:bg-white/90 text-sm font-semibold"
                >
                  Get started free <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

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
                {DEMO_SECTIONS.map((s, i) => {
                  const isCurrent = i === activeSectionIndex;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { jumpToSection(i); setShowChapters(false); }}
                      className={`w-full text-left flex items-center gap-3 py-3 px-3 rounded-xl transition-colors ${
                        isCurrent ? "bg-white/15" : "hover:bg-white/5"
                      }`}
                    >
                      <span className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-white text-neutral-900" : "bg-white/10 text-white/60"
                      }`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? "text-white" : "text-white/80"}`}>
                          {s.title}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          {formatTime(sectionOffsets[i])} · {Math.max(1, Math.round(s.duration_seconds))}s
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript overlay */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
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
                {DEMO_SECTIONS.map((s, i) => {
                  const isCurrent = i === activeSectionIndex;
                  const isPast = currentTime >= (sectionOffsets[i + 1] ?? totalDuration);
                  return (
                    <div key={s.id}>
                      <p className={`text-xs font-semibold tracking-wider uppercase mb-2 ${
                        isCurrent ? "text-white/70" : "text-white/30"
                      }`}>{s.title}</p>
                      <p className={`text-sm leading-relaxed ${
                        isCurrent ? "text-white/90 font-medium" : isPast ? "text-white/50" : "text-white/25 font-light"
                      }`}>{s.summary}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,16px)] pb-5 pt-3 px-4 bg-gradient-to-t from-black/50 via-black/30 to-transparent">
          <div className="max-w-[480px] mx-auto space-y-3">
            <div className="text-center">
              <p className="text-white/50 text-[11px] font-medium tracking-wide uppercase">Now playing</p>
              <p className="text-white text-sm font-semibold truncate">{activeSection.title}</p>
            </div>

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

            {/* Scrubber */}
            <div className="space-y-1">
              <div className="relative h-1.5 bg-white/15 rounded-full">
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
              </div>
              <div className="flex justify-between text-[11px] text-white/40 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Transport */}
            <div className="flex items-center justify-center gap-6">
              <div className="h-11 w-14" />
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
