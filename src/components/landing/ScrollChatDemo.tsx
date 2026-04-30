import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Play, SkipForward, Volume2 } from "lucide-react";
import { YoursLogo } from "@/components/YoursLogo";

const chapters = [
  { emoji: "☀️", label: "Weather", time: "0:00", text: "Sunny skies today, high of 72°F. Perfect for your outdoor lunch meeting." },
  { emoji: "🚗", label: "Commute", time: "1:12", text: "22 minutes via 101 — light traffic this morning. Leave by 8:15." },
  { emoji: "📅", label: "Calendar", time: "2:30", text: "Three meetings today: 10am design review, 1pm investor call, 3pm team standup." },
  { emoji: "📧", label: "Emails", time: "3:45", text: "Two important emails — board deck feedback from your CEO and a partnership proposal from Acme." },
  { emoji: "🤖", label: "AI News", time: "5:10", text: "OpenAI announced GPT-5 turbo with 2x context. Anthropic raised another $2B. Y Combinator batch had 12 AI-native startups." },
  { emoji: "🏈", label: "49ers", time: "7:00", text: "49ers signed a new wide receiver from the draft. Preseason starts in 3 weeks." },
];

export function ScrollChatDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15], [80, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [0.94, 1]);

  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v > 0.1 && v < 0.9) {
        const chapterIdx = Math.min(Math.floor((v - 0.1) / 0.133), chapters.length - 1);
        setActiveChapter(Math.max(0, chapterIdx));
        setProgress(Math.min(100, ((v - 0.1) / 0.8) * 100));
      }
    });
    return unsub;
  }, [scrollYProgress]);

  return (
    <section ref={containerRef} className="py-8 px-8 min-h-[90vh] relative">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full bg-[hsl(210,100%,80%)] opacity-60 blur-[150px]" />
        <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-[hsl(200,85%,82%)] opacity-50 blur-[130px]" />
        <div className="absolute bottom-[15%] left-[20%] w-[550px] h-[550px] rounded-full bg-[hsl(220,70%,85%)] opacity-45 blur-[140px]" />
      </div>

      <div className="sticky top-16 max-w-[420px] mx-auto relative z-10">
        <motion.div style={{ opacity, y, scale }}>
          <div className="text-center mb-6">
            <p className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--blue-accent))] mb-2">The Player</p>
            <h2 className="text-xl font-semibold tracking-tight text-primary-app">A beautiful listening experience</h2>
          </div>

          {/* Player mockup */}
          <div className="rounded-3xl overflow-hidden p-[1px] shadow-[0_8px_60px_-12px_hsl(210,60%,50%/0.25)]">
            <div className="rounded-3xl overflow-hidden bg-card border border-border">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <YoursLogo size={48} />
                <div>
                  <p className="text-sm font-semibold text-primary-app">Today's Briefing</p>
                  <p className="text-[11px] text-muted-foreground">8 min · Wednesday, Apr 8</p>
                </div>
              </div>

              {/* Progress */}
              <div className="px-5 pt-4">
                <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[hsl(var(--blue-accent))] rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{chapters[activeChapter]?.time}</span>
                  <span className="text-[10px] text-muted-foreground">8:12</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 py-3">
                <button className="text-muted-foreground hover:text-primary-app transition-colors">
                  <Volume2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center">
                  <Play className="h-4 w-4 text-background ml-0.5" fill="currentColor" />
                </button>
                <button className="text-muted-foreground hover:text-primary-app transition-colors">
                  <SkipForward className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Chapters */}
              <div className="px-4 pb-4 space-y-1">
                {chapters.map((ch, i) => (
                  <AnimatePresence key={ch.label}>
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: i <= activeChapter ? 1 : 0.4 }}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        i === activeChapter ? "bg-[hsl(var(--blue-accent-light))]" : ""
                      }`}
                    >
                      <span className="text-sm shrink-0">{ch.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary-app">{ch.label}</span>
                          <span className="text-[10px] text-muted-foreground">{ch.time}</span>
                        </div>
                        {i === activeChapter && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[11px] text-muted-foreground leading-relaxed mt-1"
                          >
                            {ch.text}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
