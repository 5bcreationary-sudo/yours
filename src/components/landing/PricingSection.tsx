import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Get started with a basic daily briefing.",
    features: [
      "Daily 3-minute briefing",
      "Weather + general news",
      "SMS delivery",
      "Web audio player",
      "1 preset voice",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "/mo",
    description: "The full experience — your morning, your way.",
    features: [
      "Up to 15-minute briefings",
      "Unlimited custom interests",
      "Email & calendar integration",
      "Traffic & commute data",
      "Multi-voice conversational style",
      "Voice cloning (your voice)",
      "Podcast feed export",
      "Priority delivery",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$29.99",
    period: "/user/mo",
    description: "Shared company briefings for your whole team.",
    features: [
      "Everything in Premium",
      "Shared company news sources",
      "Team admin dashboard",
      "Combined personal + team briefs",
      "Usage analytics",
      "Priority support",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

export function PricingSection({ onStartTrial }: { onStartTrial?: () => void }) {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="max-w-[1200px] mx-auto px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--blue-accent))] mb-3">Pricing</p>
        <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] text-primary-app">
          Start free. Upgrade when you're hooked.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-[400px] mx-auto">
          14-day free trial on Premium. No credit card required.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`rounded-2xl border p-6 flex flex-col transition-shadow ${
              plan.highlight
                ? "border-[hsl(var(--blue-accent)/0.3)] bg-card shadow-[0_4px_24px_-6px_hsl(var(--blue-accent)/0.12)]"
                : "border-border bg-card hover:shadow-sm"
            }`}
          >
            {plan.highlight && (
              <span className="text-[11px] font-medium text-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))] rounded-full px-2.5 py-0.5 self-start mb-3">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-medium text-primary-app">{plan.name}</h3>
            <div className="flex items-baseline gap-0.5 mt-2">
              <span className="text-3xl font-semibold tracking-tight text-primary-app">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{plan.description}</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--blue-accent))] mt-0.5 shrink-0" strokeWidth={2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => plan.cta === "Contact Us" ? navigate("/contact") : navigate("/signup")}
              className={`mt-6 rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:opacity-85 ${
                plan.highlight
                  ? "bg-foreground text-background"
                  : "border border-border text-primary-app hover:bg-accent"
              }`}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
