import { motion } from "framer-motion";

export function HeroSection({ onStartTrial }: { onStartTrial?: () => void }) {
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
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--blue-accent))]" />
          <span className="text-[13px] text-[hsl(var(--blue-accent))] font-medium">Live now</span>
          <span className="text-[13px] text-muted-foreground/40">·</span>
          <span className="text-[13px] text-muted-foreground">Used by SaaS & AI leaders</span>
        </div>

        <h1 className="text-[clamp(2.75rem,5.5vw,4.5rem)] font-medium tracking-[-0.03em] leading-[1.08] text-primary-app">
          Your Competitive
          <br />
          Analyst. Always On.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-[480px] mx-auto mt-6">
          Competitive intelligence that you can actually talk to. Hugo knows your pipeline, not just the internet.
        </p>
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={onStartTrial}
            className="rounded-full bg-foreground text-background px-7 py-3 text-[15px] font-medium shadow-[0_2px_10px_-2px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.45)] hover:opacity-90 transition-all"
          >
            Start Free Trial
          </button>
          <button
            onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full border border-border bg-card px-7 py-3 text-[15px] font-medium text-primary-app shadow-[0_1px_6px_-1px_rgba(0,0,0,0.08)] hover:shadow-[0_3px_12px_-2px_rgba(0,0,0,0.12)] hover:bg-accent transition-all"
          >
            See Pricing
          </button>
        </div>
      </motion.div>
    </section>
  );
}
