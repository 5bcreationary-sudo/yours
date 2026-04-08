import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { HugoMark } from "@/components/HugoMark";
import { FileText } from "lucide-react";

/* ---- Chat scene data ---- */

const scene1 = {
  question: "Why are we losing deals to Acme Corp?",
  answer: "Based on 34 closed-lost deals and 18 Gong call transcripts from the last 90 days, here are the top 3 patterns:",
  bullets: [
    "Pricing perception — Acme's starter tier is 40% lower. Reps hear \"too expensive\" in 62% of losses.",
    "Implementation speed — Acme promises 2-week onboarding vs our 6-week average.",
    "Missing SSO — 8 enterprise deals cited this as a dealbreaker.",
  ],
  sources: ["Gong Calls", "HubSpot CRM", "G2 Reviews"],
};

const scene2 = {
  question: "Generate a battle playbook for Acme Corp",
  answer: "I've compiled a complete playbook based on your latest win/loss data, 12 Gong calls, and Acme's current pricing page. Here's the summary:",
  bullets: [
    "Lead with ROI — your 90-day payback period is 3× faster than Acme's.",
    "Counter their price objection with the TCO calculator (link included in playbook).",
    "Highlight your API-first architecture — Acme has no public API.",
  ],
  sources: ["Internal DB", "Acme Pricing Page", "Gong Calls"],
  attachment: {
    name: "Acme_Corp_Playbook.pdf",
    size: "2.4 MB",
    pages: "12 pages",
  },
};

/* ---- Component ---- */

export function ScrollChatDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15], [80, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [0.94, 1]);

  // Scene switch based on scroll
  const [activeScene, setActiveScene] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [showBullets, setShowBullets] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const currentScene = activeScene === 0 ? scene1 : scene2;

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setIsInView(v > 0.1 && v < 0.9);
      const newScene = v > 0.3 ? 1 : 0;
      if (newScene !== activeScene) {
        setActiveScene(newScene);
        setTypedChars(0);
        setShowBullets(0);
        setShowExtras(false);
      }
    });
    return unsub;
  }, [scrollYProgress, activeScene]);

  // Typing
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= currentScene.answer.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 3;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, activeScene, currentScene.answer.length]);

  // Bullets + extras after typing
  useEffect(() => {
    if (typedChars < currentScene.answer.length) return;
    const timers = currentScene.bullets.map((_, i) =>
      setTimeout(() => setShowBullets(i + 1), 250 + i * 280)
    );
    const extTimer = setTimeout(() => setShowExtras(true), 250 + currentScene.bullets.length * 280 + 200);
    return () => { timers.forEach(clearTimeout); clearTimeout(extTimer); };
  }, [typedChars, currentScene.answer.length, currentScene.bullets, activeScene]);

  return (
    <section ref={containerRef} className="py-8 px-8 min-h-[90vh] relative">
      {/* Vivid mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full bg-[hsl(210,100%,80%)] opacity-60 blur-[150px]" />
        <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-[hsl(200,85%,82%)] opacity-50 blur-[130px]" />
        <div className="absolute bottom-[15%] left-[20%] w-[550px] h-[550px] rounded-full bg-[hsl(220,70%,85%)] opacity-45 blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-[hsl(195,80%,82%)] opacity-40 blur-[120px]" />
      </div>
      <div className="sticky top-16 max-w-[720px] mx-auto relative z-10">
        <motion.div style={{ opacity, y, scale }}>
          {/* Frosted glass chat */}
          <div className="rounded-3xl overflow-hidden p-[1px] shadow-[0_8px_60px_-12px_hsl(210,60%,50%/0.25)]">
            <div className="rounded-3xl overflow-hidden bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/10">
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0,72%,68%)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(40,85%,65%)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(130,45%,58%)]" />
                <span className="text-[11px] text-muted-foreground/80 ml-3 font-medium">Hugo Chat</span>
              </div>

              {/* Chat content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 space-y-4 min-h-[380px]"
                >
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="bg-[hsl(var(--blue-accent))] rounded-2xl rounded-br-md px-4 py-2.5 max-w-[380px] shadow-sm">
                      <p className="text-[13px] text-white font-medium">{currentScene.question}</p>
                    </div>
                  </div>

                  {/* Hugo reply */}
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <HugoMark size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Hugo</p>
                      <p className="text-[13px] text-primary-app leading-relaxed">
                        {currentScene.answer.slice(0, typedChars)}
                        {typedChars < currentScene.answer.length && (
                          <span className="inline-block w-[2px] h-[13px] bg-muted-foreground/40 ml-0.5 animate-pulse align-text-bottom" />
                        )}
                      </p>

                      {showBullets > 0 && (
                        <ul className="mt-3 space-y-2">
                          {currentScene.bullets.slice(0, showBullets).map((b, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.25 }}
                              className="flex gap-2 text-[13px] text-muted-foreground"
                            >
                              <span className="text-primary-app font-medium shrink-0">{i + 1}.</span>
                              <span className="leading-relaxed">{b}</span>
                            </motion.li>
                          ))}
                        </ul>
                      )}

                      {showExtras && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 space-y-3"
                        >
                          {/* PDF attachment for scene 2 */}
                          {"attachment" in currentScene && currentScene.attachment && (
                            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md p-3 max-w-[320px]">
                              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-primary-app truncate">{(currentScene as typeof scene2).attachment.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(currentScene as typeof scene2).attachment.pages} · {(currentScene as typeof scene2).attachment.size}</p>
                              </div>
                            </div>
                          )}

                          {/* Source pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {currentScene.sources.map((src) => (
                              <span key={src} className="text-[10px] bg-white/10 backdrop-blur-sm text-muted-foreground border border-white/10 rounded-full px-2.5 py-0.5">
                                {src}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Scene indicator dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeScene === i ? "w-6 bg-foreground/30" : "w-1.5 bg-foreground/10"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
