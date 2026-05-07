import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Headphones, Pause, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_AUDIO_URL = (import.meta.env.VITE_DEMO_AUDIO_URL as string | undefined) ?? "/demo.wav";

interface Props {
  getStartedHref: string;
}

/** Inline audio player rendered inside the hero phone-mock card. Probes the
 *  demo URL with HEAD up-front so we can hide the player entirely if the file
 *  is missing (mobile Safari hides 404s until user gesture otherwise). */
function HeroDemoPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DEMO_AUDIO_URL, { method: "HEAD" })
      .then((res) => { if (!cancelled) setAvailable(res.ok); })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (available !== true) return;
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setAvailable(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [available]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  if (available !== true) return null;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <audio ref={audioRef} preload="metadata" src={DEMO_AUDIO_URL} />
      <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-[width] duration-100"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label={isPlaying ? "Pause demo" : "Play demo"}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-orange-800" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="h-5 w-5 text-orange-800 ml-0.5" fill="currentColor" strokeWidth={0} />
        )}
      </button>
      <p className="text-white/70 text-[11px] tracking-wide uppercase">Sample briefing</p>
    </div>
  );
}

export function HeroSection({ getStartedHref }: Props) {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Decorative warm orb behind content — clipped, blurred, low opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 w-[1100px] h-[1100px] rounded-full opacity-[0.18] blur-3xl yours-warm-gradient"
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground mb-6"
        >
          <Headphones className="h-3.5 w-3.5" /> Now in beta
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
          className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold tracking-[-0.03em] leading-[1.05] mb-5"
        >
          Audio that<br />knows you.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed mb-8"
        >
          A personalized audio briefing delivered to your phone every morning. Weather, calendar, emails, news — all in one 5-minute listen.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => navigate(getStartedHref)}
            className="w-full sm:w-auto bg-foreground text-background px-8 py-3 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/demo")}
            className="w-full sm:w-auto text-sm text-muted-foreground hover:text-foreground transition-colors px-6 py-3"
          >
            Hear the full demo →
          </button>
        </motion.div>

        {/* Phone-mock product card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-16 max-w-[280px] mx-auto"
        >
          <div className="yours-warm-gradient rounded-[2rem] p-6 pt-10 pb-8 shadow-2xl shadow-orange-900/20">
            <div className="text-center mb-6">
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
              <p className="text-white text-lg font-bold mt-1">Good morning ☀️</p>
            </div>
            <div className="space-y-3 text-white/90 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-white/50 mt-0.5">○</span>
                <span>72°F and sunny — perfect for your 1pm outdoor meeting</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white/50 mt-0.5">○</span>
                <span>3 meetings today, first at 10am</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white/50 mt-0.5">○</span>
                <span>OpenAI announced GPT-5 turbo</span>
              </div>
            </div>
            <HeroDemoPlayer />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
