import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugoMark } from "@/components/HugoMark";
import { Plus, Search, Zap, BarChart3, ArrowRight, Check, Sparkles, MessageCircle } from "lucide-react";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Hugo",
    subtitle: "Let's get you set up in under 2 minutes",
    description: "We'll walk you through adding your first competitors, connecting your tools, and getting your first insights.",
    icon: Sparkles,
    visual: "logo",
  },
  {
    id: "add-competitors",
    title: "Add Your Competitors",
    subtitle: "Start by telling Hugo who you compete against",
    description: "Type a company name or URL — Hugo will automatically pull their pricing, product info, reviews, job postings, and more.",
    icon: Plus,
    features: ["Just enter a name or URL", "Hugo scrapes pricing, jobs, reviews automatically", "Add up to 5 on the free trial"],
  },
  {
    id: "connect-tools",
    title: "Connect Your Tools",
    subtitle: "Optional — but powerful",
    description: "Link Slack, Salesforce, Gong, or HubSpot so Hugo can learn from your pipeline and surface deal-level insights.",
    icon: Zap,
    features: ["Slack: get alerts in your channels", "CRM: see win/loss data by competitor", "Gong: analyze call objections automatically"],
  },
  {
    id: "explore-intel",
    title: "Explore Your Intel Feed",
    subtitle: "Hugo is already watching",
    description: "Your feed will populate within minutes. Every item includes a strategic interpretation — not just a headline, but what it means for you.",
    icon: Search,
    features: ["Auto-prioritized by importance", "\"So what\" strategic analysis on every item", "One-click to ask Hugo or create a playbook"],
  },
  {
    id: "ask-hugo",
    title: "Ask Hugo Anything",
    subtitle: "Your always-on competitive analyst",
    description: "Ask Hugo to prep battle cards, analyze losses, or brief you before a call. Hugo pulls from live data — not a static wiki.",
    icon: MessageCircle,
    features: ["\"Why are we losing to Acme?\"", "\"Prep me for a call against Rival.io\"", "\"What changed with competitors this week?\""],
  },
  {
    id: "ready",
    title: "You're All Set",
    subtitle: "Hugo is working for you 24/7",
    description: "Your competitive intelligence is now on autopilot. Hugo will alert you when something important happens and keep your playbooks fresh.",
    icon: BarChart3,
    features: ["Intel feed updates in real-time", "Playbooks auto-refresh with new data", "Weekly competitor assessments from Hugo"],
  },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[hsl(210,100%,85%)] opacity-20 blur-[160px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[450px] h-[450px] rounded-full bg-[hsl(200,80%,88%)] opacity-15 blur-[140px]" />
        <div className="absolute top-[50%] right-[30%] w-[400px] h-[400px] rounded-full bg-[hsl(220,70%,90%)] opacity-12 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-[560px] px-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-foreground" : i < step ? "w-1.5 bg-foreground/40" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {current.visual === "logo" ? (
                <div className="h-16 w-16 rounded-2xl bg-foreground flex items-center justify-center">
                  <HugoMark size={32} />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
                  <current.icon className="h-7 w-7 text-primary-app" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-primary-app">{current.title}</h1>
            <p className="text-sm font-medium text-[hsl(var(--blue-accent))] mt-1">{current.subtitle}</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-[440px] mx-auto">
              {current.description}
            </p>

            {current.features && (
              <div className="mt-6 space-y-2 max-w-[360px] mx-auto">
                {current.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-left rounded-xl bg-card border border-border px-4 py-2.5">
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--urgency-low))] shrink-0" strokeWidth={2} />
                    <span className="text-sm text-primary-app">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary-app transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? onComplete() : setStep(step + 1))}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {isLast ? "Go to Dashboard" : "Continue"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {step === 0 && (
          <button
            onClick={onComplete}
            className="block mx-auto mt-4 text-[12px] text-muted-foreground hover:text-primary-app transition-colors"
          >
            Skip setup — I'll explore on my own
          </button>
        )}
      </div>
    </motion.div>
  );
}
