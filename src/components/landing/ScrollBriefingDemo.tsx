import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Calendar, CloudSun, Newspaper } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Scene {
  id: string;
  type: "weather" | "calendar" | "news";
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  bullets: string[];
}

const SCENES: Scene[] = [
  {
    id: "weather",
    type: "weather",
    icon: CloudSun,
    eyebrow: "Weather",
    title: "72° and sunny in San Francisco.",
    bullets: [
      "High of 78 by mid-afternoon.",
      "Light wind off the bay.",
      "Clear through the evening commute.",
    ],
  },
  {
    id: "calendar",
    type: "calendar",
    icon: Calendar,
    eyebrow: "Today's calendar",
    title: "Three meetings today.",
    bullets: [
      "10:00 — Design review",
      "12:30 — One-on-one with Priya",
      "16:00 — Weekly all-hands",
    ],
  },
  {
    id: "news",
    type: "news",
    icon: Newspaper,
    eyebrow: "News headlines",
    title: "OpenAI ships a faster turbo model.",
    bullets: [
      "Apple beat Q1 expectations.",
      "Fed signals it'll hold rates this spring.",
      "Stripe revenue growth re-accelerates.",
    ],
  },
];

interface SceneCardProps {
  scene: Scene;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
}

const SCENE_BG: Record<Scene["type"], string> = {
  weather: "yours-section-weather",
  calendar: "yours-section-calendar",
  news: "yours-section-news",
};

function SceneCard({ scene, opacity, scale }: SceneCardProps) {
  const Icon = scene.icon;
  return (
    <motion.div
      style={{ opacity, scale }}
      className={`absolute inset-0 ${SCENE_BG[scene.type]} rounded-[2rem] flex flex-col px-7 pt-10 pb-8`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/20">
          <Icon className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
        </span>
        <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase">
          {scene.eyebrow}
        </p>
      </div>

      <h3 className="text-white text-[22px] font-bold leading-tight tracking-tight mb-5">
        {scene.title}
      </h3>

      <ul className="space-y-2.5 flex-1">
        {scene.bullets.map((b, i) => (
          <motion.li
            key={b}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30%" }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
            className="flex items-start gap-2 text-white/90 text-[14px] leading-snug"
          >
            <span className="mt-1.5 shrink-0 h-1 w-1 rounded-full bg-white/70" />
            <span>{b}</span>
          </motion.li>
        ))}
      </ul>

      {/* Faux audio bars at the bottom to imply active playback */}
      <div className="mt-6 flex items-end gap-1 h-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            animate={{ scaleY: [0.4, 1.0, 0.6, 1.2, 0.4] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
            className="block w-0.5 h-4 bg-white/80 rounded-full origin-bottom"
          />
        ))}
        <span className="ml-2 text-white/50 text-[10px] uppercase tracking-wider">
          Now playing
        </span>
      </div>
    </motion.div>
  );
}

export function ScrollBriefingDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Each scene's opacity: a triangle that ramps up, holds, then ramps down.
  // Scene 0: holds 0.0 → 0.25, fades out by 0.40.
  // Scene 1: fades in 0.25 → 0.40, holds → 0.60, fades out by 0.75.
  // Scene 2: fades in 0.60 → 0.75, holds through 1.0.
  const op0 = useTransform(scrollYProgress, [0, 0.25, 0.4], [1, 1, 0]);
  const op1 = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [0, 1, 1, 0]);
  const op2 = useTransform(scrollYProgress, [0.6, 0.75, 1], [0, 1, 1]);
  const opacities = [op0, op1, op2];

  // Subtle scale-pop as each scene becomes active.
  const sc0 = useTransform(scrollYProgress, [0, 0.25, 0.4], [1, 1, 0.97]);
  const sc1 = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [0.97, 1, 1, 0.97]);
  const sc2 = useTransform(scrollYProgress, [0.6, 0.75, 1], [0.97, 1, 1]);
  const scales = [sc0, sc1, sc2];

  // Active dot index follows the same thresholds.
  const activeDot = useTransform(scrollYProgress, (v) => {
    if (v < 0.33) return 0;
    if (v < 0.66) return 1;
    return 2;
  });

  return (
    <section ref={ref} id="how-it-works" className="relative" style={{ minHeight: "130vh" }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Decorative warm orbs in the background */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/4 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl yours-warm-gradient"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-1/4 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl yours-warm-gradient-2"
        />

        <div className="relative w-full max-w-md text-center mb-8">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            One listen. Your whole morning.
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Scroll to walk through how a briefing flows — weather, your calendar, then the news that matters.
          </p>
        </div>

        {/* Phone mock with stacked scene cards */}
        <div className="relative w-[280px] aspect-[9/16] max-h-[70vh] rounded-[2rem] shadow-2xl shadow-orange-900/20 overflow-hidden">
          {SCENES.map((scene, i) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              opacity={opacities[i]}
              scale={scales[i]}
            />
          ))}
        </div>

        {/* Scene indicator dots */}
        <div className="mt-6 flex items-center gap-1.5">
          {SCENES.map((_, i) => (
            <Dot key={i} index={i} active={activeDot} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Dot({ index, active }: { index: number; active: MotionValue<number> }) {
  const opacity = useTransform(active, (v) => (v === index ? 1 : 0.3));
  const width = useTransform(active, (v) => (v === index ? 18 : 6));
  return (
    <motion.span
      style={{ opacity, width }}
      className="block h-1.5 rounded-full bg-foreground transition-[width] duration-300"
    />
  );
}
