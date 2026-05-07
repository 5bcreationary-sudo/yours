import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Play } from "lucide-react";
import { getBriefingForPlayer } from "@/lib/supabase";
import { useWeatherPreview } from "@/hooks/useWeatherPreview";

interface Props {
  briefingId: string;
  /** User's saved location used for the live weather pill. */
  location?: { lat?: number; lng?: number; city?: string } | null;
  /** Tags from coverage step + freeform interests, used for live previews. */
  tags?: string[];
  /** Called once the briefing has audio_signed_url available. */
  onReady: (briefingId: string) => void;
}

interface PreviewHeadline {
  title: string;
  source: string;
}

/** Best-effort fetch of 2 real headlines for the "pulling relevant news"
 *  step. Goes through Hacker News first (no CORS), falls back to nothing
 *  rather than fabricating content. */
function usePreviewHeadlines(): { headlines: PreviewHeadline[]; loading: boolean } {
  const [headlines, setHeadlines] = useState<PreviewHeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const ids = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json").then((r) =>
          r.ok ? (r.json() as Promise<number[]>) : Promise.reject(new Error("hn list"))
        );
        const top = ids.slice(0, 4);
        const items = await Promise.all(
          top.map((id) =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => (r.ok ? r.json() : null)),
          ),
        );
        const out: PreviewHeadline[] = items
          .filter((it): it is { title: string; url?: string } => !!it && typeof it.title === "string")
          .slice(0, 2)
          .map((it) => {
            let source = "Hacker News";
            try {
              if (it.url) source = new URL(it.url).hostname.replace(/^www\./, "");
            } catch {
              /* fall through */
            }
            return { title: it.title, source };
          });
        if (!cancelled) {
          setHeadlines(out);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { headlines, loading };
}

interface StepDef {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

/** Pacing — minimum dwell on each step before advancing visually. The actual
 *  briefing generation runs in parallel; the steps are a UX overlay that
 *  shows what the system is doing in human terms. */
const STEP_DWELL_MS = 1500;

export function GenerationFlow({ briefingId, location, tags = [], onReady }: Props) {
  // Poll the briefing until audio is ready.
  const { data: briefing } = useQuery({
    queryKey: ["briefing-generation", briefingId],
    queryFn: () => getBriefingForPlayer(briefingId),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const ready = !!briefing?.audio_signed_url;

  // Live data for the visual previews — real, not mocked.
  const weather = useWeatherPreview(location ?? null);
  const { headlines } = usePreviewHeadlines();

  // Step machine: walk through 4 steps with a min dwell. The last step
  // ("generating audio") stays active until the polling query reports ready.
  const [activeStep, setActiveStep] = useState(0);
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    if (activeStep < 3) {
      advanceTimerRef.current = window.setTimeout(() => {
        setActiveStep((s) => s + 1);
      }, STEP_DWELL_MS);
    }
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, [activeStep]);

  // When the briefing is ready, mark all steps complete and show a play button.
  const [showPlayButton, setShowPlayButton] = useState(false);
  const readyHandledRef = useRef(false);
  useEffect(() => {
    if (!ready || readyHandledRef.current) return;
    readyHandledRef.current = true;
    setActiveStep(4); // past last step → all green
    const t = window.setTimeout(() => setShowPlayButton(true), 600);
    return () => window.clearTimeout(t);
  }, [ready, briefingId]);

  const tagsSlice = useMemo(() => tags.slice(0, 3), [tags]);

  const steps: StepDef[] = [
    {
      id: "interests",
      title: "Understanding your interests",
      render: () => (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tagsSlice.length > 0 ? (
            tagsSlice.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 text-[11px] font-medium"
              >
                {t}
              </motion.span>
            ))
          ) : (
            <span className="text-white/60 text-xs">Reading your preferences…</span>
          )}
        </div>
      ),
    },
    {
      id: "news",
      title: "Pulling relevant news",
      render: () => (
        <div className="space-y-1 mt-2">
          {headlines.length > 0 ? (
            headlines.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.18 }}
                className="text-[12px] leading-snug text-white/90"
              >
                <span className="font-medium">{h.title}</span>
                <span className="text-white/50"> · {h.source}</span>
              </motion.div>
            ))
          ) : (
            <span className="text-white/60 text-xs">Scanning sources…</span>
          )}
        </div>
      ),
    },
    {
      id: "summary",
      title: "Summarizing your day",
      render: () => (
        <div className="flex items-center gap-2 mt-2">
          {weather.state === "ready" && weather.data ? (
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 text-[11px] font-medium tabular-nums">
              {weather.data.tempF}° · {weather.data.condition}
            </span>
          ) : weather.state === "loading" ? (
            <span className="text-white/60 text-xs">Loading weather…</span>
          ) : null}
          {tagsSlice[0] && (
            <span className="text-white/70 text-[11px]">+ {tagsSlice[0]}</span>
          )}
          <span className="text-white/70 text-[11px]">+ your calendar</span>
        </div>
      ),
    },
    {
      id: "audio",
      title: "Generating your audio",
      render: () => (
        <div className="flex items-center gap-1 mt-2 h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ scaleY: [0.5, 1.4, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              className="block w-1 h-3 bg-white/80 rounded-full origin-center"
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 yours-warm-gradient overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-center mb-2"
        >
          Creating your first briefing…
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-white/70 text-sm mb-10 text-center max-w-xs"
        >
          We're pulling everything together. This usually takes about three minutes.
        </motion.p>

        <div className="w-full max-w-sm space-y-5">
          {steps.map((step, i) => {
            const status: "pending" | "active" | "done" =
              activeStep > i ? "done" : activeStep === i ? "active" : "pending";
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: status === "pending" ? 0.4 : 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex items-start gap-3"
              >
                <div className="shrink-0 mt-0.5">
                  {status === "done" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 18, stiffness: 280 }}
                      className="h-5 w-5 rounded-full bg-white/90 flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-orange-700" strokeWidth={3} />
                    </motion.div>
                  ) : status === "active" ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" strokeWidth={2} />
                  ) : (
                    <span className="block h-5 w-5 rounded-full border border-white/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${status === "pending" ? "text-white/60" : "text-white"}`}>
                    {step.title}
                  </p>
                  <AnimatePresence>
                    {status !== "pending" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {step.render()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="pb-[env(safe-area-inset-bottom,16px)] pb-8 px-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {showPlayButton ? (
            <motion.button
              key="play"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: "spring", damping: 18 }}
              type="button"
              onClick={() => onReady(briefingId)}
              className="flex items-center justify-center gap-2 bg-white text-orange-800 font-semibold text-base px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              <Play className="h-5 w-5 fill-current" />
              Play your briefing
            </motion.button>
          ) : (
            <motion.p
              key="waiting"
              exit={{ opacity: 0 }}
              className="text-white/50 text-[11px]"
            >
              Stay on this page — your briefing will start automatically.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
