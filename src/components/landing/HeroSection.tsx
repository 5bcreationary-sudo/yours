import { motion } from "framer-motion";
import { Headphones, MessageSquare, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative mx-auto mt-12 max-w-[280px]"
    >
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-2 border-border bg-card p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        <div className="rounded-[2rem] overflow-hidden bg-accent">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <span className="text-[10px] font-medium text-muted-foreground">9:41</span>
            <div className="flex gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          {/* SMS notification */}
          <div className="px-4 py-3">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center">
                  <Headphones className="h-3 w-3 text-background" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold text-primary-app">Yours</span>
                <span className="text-[10px] text-muted-foreground ml-auto">now</span>
              </div>
              <p className="text-[12px] text-primary-app leading-relaxed">
                ☀️ Good morning, Sarah! Your briefing is ready — 8 min today.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-[hsl(var(--blue-accent-light))] px-3 py-2 flex items-center gap-2">
                  <Play className="h-3 w-3 text-[hsl(var(--blue-accent))]" fill="currentColor" />
                  <span className="text-[11px] font-medium text-[hsl(var(--blue-accent))]">Listen now</span>
                </div>
                <div className="rounded-xl bg-accent px-3 py-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Reply</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini player chapters preview */}
          <div className="px-4 pb-4 space-y-1.5">
            {["☀️ Weather — Sunny, 72°F", "🚗 Commute — 22 min via 101", "📅 Calendar — 3 meetings", "📧 Emails — 2 important", "📰 AI Startups — New funding rounds"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-card/80 border border-border/50 px-3 py-2">
                <span className="text-[11px] text-primary-app">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effect behind phone */}
      <div className="absolute -inset-8 -z-10 rounded-full bg-[hsl(var(--blue-accent))] opacity-[0.06] blur-[60px]" />
    </motion.div>
  );
}

export function HeroSection({ onStartTrial }: { onStartTrial?: () => void }) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-36 pb-12 px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-brand-orb absolute left-1/2 bottom-0 h-[480px] w-[1200px] -translate-x-1/2" />
        <div className="hero-brand-wash absolute inset-x-0 bottom-0 h-[58%]" />
        <div className="hero-brand-columns absolute inset-x-0 bottom-0 h-[52%]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 text-center max-w-[800px] mx-auto"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--urgency-low))]" />
          <span className="text-[13px] text-[hsl(var(--urgency-low))] font-medium">SMS-first</span>
          <span className="text-[13px] text-muted-foreground/40">·</span>
          <span className="text-[13px] text-muted-foreground">No app download needed</span>
        </div>

        <h1 className="text-[clamp(2.75rem,5.5vw,4.5rem)] font-medium tracking-[-0.03em] leading-[1.08] text-primary-app">
          Your morning,
          <br />
          perfectly briefed.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-[520px] mx-auto mt-6">
          A hyper-personalized audio briefing delivered to your phone every morning. Weather, traffic, calendar, emails, news — all in one 5–15 minute listen.
        </p>
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => navigate("/signup")}
            className="rounded-full bg-foreground text-background px-7 py-3 text-[15px] font-medium shadow-[0_2px_10px_-2px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.45)] hover:opacity-90 transition-all"
          >
            Get Started Free
          </button>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full border border-border bg-card px-7 py-3 text-[15px] font-medium text-primary-app shadow-[0_1px_6px_-1px_rgba(0,0,0,0.08)] hover:shadow-[0_3px_12px_-2px_rgba(0,0,0,0.12)] hover:bg-accent transition-all"
          >
            See How It Works
          </button>
        </div>

        <PhoneMockup />
      </motion.div>
    </section>
  );
}
