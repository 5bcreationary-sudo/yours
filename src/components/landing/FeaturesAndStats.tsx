import { motion } from "framer-motion";
import { Cloud, Car, Calendar, Mail, Newspaper, Mic, Smartphone, Zap, Clock, Sparkles } from "lucide-react";

const stats = [
  { value: "5-15", label: "Minutes per briefing" },
  { value: "6:30am", label: "Avg delivery time" },
  { value: "94%", label: "Listen-through rate" },
  { value: "< 2min", label: "Setup time" },
];

const howSteps = [
  {
    step: "1",
    title: "Tell us what matters",
    description: "Add your interests, connect your calendar & email. Takes 2 minutes.",
    icon: Sparkles,
  },
  {
    step: "2",
    title: "We build your briefing",
    description: "Every morning, AI compiles weather, traffic, calendar, emails, and your custom interests into a podcast-style script.",
    icon: Zap,
  },
  {
    step: "3",
    title: "Listen via SMS",
    description: "Get a text with a link to your beautiful web player. No app needed — just tap and listen.",
    icon: Smartphone,
  },
];

const features = [
  { icon: Cloud, title: "Weather", description: "Local forecast tailored to your schedule" },
  { icon: Car, title: "Traffic", description: "Commute time from home to work, real-time" },
  { icon: Calendar, title: "Calendar", description: "Today's meetings with context and prep notes" },
  { icon: Mail, title: "Emails", description: "AI summary of important new messages" },
  { icon: Newspaper, title: "News & Interests", description: "AI startups, 49ers scores, stocks — you choose" },
  { icon: Mic, title: "Multi-Voice Audio", description: "Conversational two-host style, like your own podcast" },
  { icon: Clock, title: "Your Schedule", description: "Delivered exactly when you wake up, in your timezone" },
  { icon: Sparkles, title: "Gets Smarter", description: "Learns from your skips and feedback over time" },
];

export function FeaturesAndStats() {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="max-w-[900px] mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--blue-accent))] mb-3">How It Works</p>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] text-primary-app">
            Three steps to your perfect morning
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howSteps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-6 w-6 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-primary-app mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1100px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-border"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-2xl font-semibold tracking-tight text-primary-app">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-[1100px] mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--blue-accent))] mb-3">What's Inside</p>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] text-primary-app">
            Everything you need, nothing you don't
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[440px] mx-auto">
            Your briefing is assembled from real-time data sources, then narrated in a natural conversational style.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-primary-app mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
