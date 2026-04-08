import { motion } from "framer-motion";
import { MessageCircle, Zap, BarChart3, Shield, Bell, Search } from "lucide-react";
import { HugoMark } from "@/components/HugoMark";

const stats = [
  { value: "2,400+", label: "Competitors tracked" },
  { value: "142K", label: "Deals analyzed" },
  { value: "+23%", label: "Avg. win rate lift" },
  { value: "< 4s", label: "Avg. response time" },
];

/* ---------- visual mockups ---------- */

function ChatVisual() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HugoMark size={16} />
        <span className="text-[11px] font-medium text-muted-foreground">Hugo Chat</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="bg-[hsl(var(--blue-accent-light))] rounded-2xl rounded-br-md px-3 py-2 max-w-[220px]">
            <p className="text-xs text-primary-app">Why are we losing to Acme?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-[hsl(var(--blue-accent-light))] shrink-0 flex items-center justify-center">
            <HugoMark size={10} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-primary-app leading-relaxed">Based on 34 deals, here are the top 3 loss patterns…</p>
            <div className="flex gap-1">
              {["Gong", "HubSpot", "G2"].map((s) => (
                <span key={s} className="text-[9px] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))] rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsVisual() {
  const alerts = [
    { tag: "Pricing", text: "Acme dropped starter tier by 30%", time: "2m ago", urgent: true },
    { tag: "Hiring", text: "Rival.io posted 8 ML engineer roles", time: "1h ago", urgent: false },
    { tag: "Feature", text: "BetaCo launched SSO support", time: "3h ago", urgent: false },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
      <p className="text-[11px] font-medium text-muted-foreground">Intel Feed</p>
      {alerts.map((a) => (
        <div key={a.text} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
          <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${a.urgent ? "bg-[hsl(var(--blue-accent))]" : "bg-muted-foreground/30"}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))] rounded-full px-2 py-0.5">{a.tag}</span>
              <span className="text-[9px] text-muted-foreground">{a.time}</span>
            </div>
            <p className="text-xs text-primary-app leading-relaxed">{a.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaybookVisual() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* macOS window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-accent/50">
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0,72%,68%)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(40,85%,65%)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(130,45%,58%)]" />
        <span className="text-[10px] text-muted-foreground ml-2 font-medium">Acme_Corp_Playbook.pdf</span>
      </div>
      {/* PDF content */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary-app">Competitive Playbook — Acme Corp</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Auto-generated · Updated 2h ago</p>
          </div>
          <span className="text-[9px] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))] rounded-full px-2.5 py-0.5 font-medium">Sales</span>
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Win Rate", value: "68%", sub: "+4% this month" },
            { label: "Avg Deal Size", value: "$42K", sub: "vs $38K theirs" },
            { label: "Avg Cycle", value: "34 days", sub: "vs 28 theirs" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-accent/60 p-2.5">
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold text-primary-app mt-0.5">{s.value}</p>
              <p className="text-[8px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-primary-app mb-2">Top Objections & Counters</p>
          {[
            { obj: "\"Too expensive for what you get\"", counter: "Lead with ROI — 90-day payback vs Acme's 6-month avg." },
            { obj: "\"Acme has more integrations\"", counter: "Highlight API-first arch — our customers build 3× faster." },
            { obj: "\"We already use Acme\"", counter: "Offer free migration + 60-day parallel run guarantee." },
          ].map((row) => (
            <div key={row.obj} className="flex gap-2 py-1.5 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-[10px] text-destructive/80 font-medium">{row.obj}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{row.counter}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WinLossVisual() {
  const bars = [
    { label: "Price", pct: 62, side: "loss" },
    { label: "Onboarding", pct: 48, side: "loss" },
    { label: "Features", pct: 71, side: "win" },
    { label: "Support", pct: 84, side: "win" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-medium text-muted-foreground mb-4">Win/Loss Patterns</p>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-primary-app">{b.label}</span>
              <span className="text-[10px] text-muted-foreground">{b.pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${b.side === "win" ? "bg-[hsl(var(--urgency-low))]" : "bg-[hsl(var(--blue-accent))]"}`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- section data ---------- */

const sections = [
  {
    tag: "Conversational Intel",
    title: "Ask anything.\nGet answers with sources.",
    description: "Talk to Hugo like a smart colleague who's read every deal, call transcript, and competitor page. Sourced answers in seconds — not search results.",
    features: [
      { icon: MessageCircle, text: "Natural language queries across all your competitive data" },
      { icon: Search, text: "Auto-cited sources from Gong, CRM, G2, and the web" },
    ],
    visual: <ChatVisual />,
  },
  {
    tag: "Real-Time Monitoring",
    title: "Know before\nyour team asks.",
    description: "Hugo watches pricing pages, job boards, product launches, and review sites — then tells you what it means for your deals.",
    features: [
      { icon: Zap, text: "Instant alerts when competitors make moves" },
      { icon: Bell, text: "Slack-native delivery with smart urgency levels" },
    ],
    visual: <AlertsVisual />,
  },
  {
    tag: "Battle-Ready Playbooks",
    title: "Playbooks that\nupdate themselves.",
    description: "Auto-generated competitive playbooks that stay fresh. Win rates, objection handlers, and positioning — always current.",
    features: [
      { icon: Shield, text: "Living docs that evolve with every new signal" },
    ],
    visual: <PlaybookVisual />,
  },
  {
    tag: "Win/Loss Analysis",
    title: "See exactly why\nyou win and lose.",
    description: "AI-clustered patterns from your closed deals reveal the real reasons — not gut feelings — behind every outcome.",
    features: [
      { icon: BarChart3, text: "Pattern detection across hundreds of deals" },
    ],
    visual: <WinLossVisual />,
  },
];

export function FeaturesAndStats() {
  return (
    <section id="features" className="max-w-[1100px] mx-auto px-8 py-20">
      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16 py-8 border-y border-border"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-2xl font-semibold tracking-tight text-primary-app">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Alternating offset feature sections */}
      <div className="space-y-20">
        {sections.map((section, i) => {
          const reversed = i % 2 === 1;
          const offsetClass = reversed ? "lg:translate-x-12" : "lg:-translate-x-12";

          return (
            <motion.div
              key={section.tag}
              initial={{ opacity: 0, y: 40, x: reversed ? 30 : -30 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${offsetClass}`}
            >
              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, x: reversed ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className={`text-center lg:text-left ${reversed ? "lg:order-2" : ""}`}
              >
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--blue-accent))] mb-3 rounded-full"
                >
                  {section.tag}
                </motion.p>
                <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight leading-[1.15] text-primary-app whitespace-pre-line">
                  {section.title}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed mt-4 max-w-[440px] mx-auto lg:mx-0">
                  {section.description}
                </p>
                <div className="mt-6 space-y-3 inline-flex flex-col items-start">
                  {section.features.map((f, fi) => (
                    <motion.div
                      key={f.text}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + fi * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="h-7 w-7 rounded-full bg-[hsl(var(--blue-accent-light))] flex items-center justify-center shrink-0 mt-0.5">
                        <f.icon className="h-3.5 w-3.5 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1 text-left">{f.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Visual side */}
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                className={reversed ? "lg:order-1" : ""}
              >
                {section.visual}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
