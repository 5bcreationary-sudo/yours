import { motion } from "framer-motion";
import { MessageSquare, Headphones, Check, ExternalLink, Upload, Clock, Hash } from "lucide-react";

const integrations = [
  {
    id: "slack",
    name: "Slack",
    description: "Get proactive alerts and team-personalized playbooks in Slack.",
    icon: MessageSquare,
    connected: true,
    workspace: "Acme Team",
    features: ["Real-time urgent alerts", "Weekly competitive digest", "/hugo slash command"],
  },
  {
    id: "gong",
    name: "Gong / Chorus",
    description: "Automatically ingest call transcripts to power Win/Loss analysis.",
    icon: Headphones,
    connected: false,
    features: ["Auto-import transcripts", "Extract competitor mentions", "Feed Win/Loss engine"],
  },
];

const comingSoon = [
  { name: "HubSpot", description: "Sync CRM deals and contacts" },
  { name: "Salesforce", description: "Two-way CRM integration" },
  { name: "Chrome Extension", description: "Get intel while browsing competitor sites" },
];

const channelMappings = [
  { team: "Sales", channel: "#sales-intel", variant: "Sales + Objections" },
  { team: "Product", channel: "#product-intel", variant: "Product + Feature Gaps" },
  { team: "Marketing", channel: "#marketing-intel", variant: "Marketing + Positioning" },
  { team: "Leadership", channel: "#exec-intel", variant: "Exec summary" },
];

export default function Integrations() {
  return (
    <div className="px-6 py-8 max-w-[860px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect Hugo to the tools your team already uses.</p>
        </div>

        <div className="space-y-4 mb-8">
          {integrations.map((intg, i) => (
            <motion.div
              key={intg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="surface-card rounded-xl border border-border p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-[40px] w-[40px] rounded-[10px] bg-accent flex items-center justify-center">
                    <intg.icon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-primary-app">{intg.name}</h3>
                    {intg.connected && (
                      <span className="text-[11px] text-[hsl(var(--urgency-low))] font-medium flex items-center gap-1">
                        <Check className="h-[10px] w-[10px]" strokeWidth={2} />
                        Connected{intg.workspace ? ` · ${intg.workspace}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                {intg.connected ? (
                  <button className="flex items-center gap-1 rounded-[10px] border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-primary-app transition-colors">
                    <ExternalLink className="h-[11px] w-[11px]" strokeWidth={1.5} />
                    Configure
                  </button>
                ) : (
                  <button className="rounded-[10px] bg-foreground px-4 py-1.5 text-[12px] font-medium text-background hover:opacity-80 transition-opacity">
                    Connect
                  </button>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{intg.description}</p>

              <ul className="space-y-1 mb-4">
                {intg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-[3px] w-[3px] rounded-full bg-muted-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Slack config panel */}
              {intg.id === "slack" && intg.connected && (
                <div className="rounded-xl bg-accent/60 p-4 space-y-3">
                  <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Channel Mapping</h4>
                  <div className="space-y-1.5">
                    {channelMappings.map((cm) => (
                      <div key={cm.team} className="flex items-center gap-3 text-sm">
                        <span className="text-primary-app font-medium w-[80px]">{cm.team}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground flex items-center gap-1"><Hash className="h-[11px] w-[11px]" />{cm.channel.slice(1)}</span>
                        <span className="text-[11px] text-muted-foreground bg-card rounded-full px-2 py-0.5 ml-auto">{cm.variant}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Urgent alerts</span>
                      <span className="text-primary-app font-medium text-[12px]">Send immediately</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weekly digest</span>
                      <span className="text-primary-app font-medium text-[12px]">Monday at 8:00 AM</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Coming soon */}
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {comingSoon.map((item) => (
            <div key={item.name} className="surface-card rounded-xl border border-border p-4 opacity-60">
              <h3 className="text-sm font-medium text-primary-app">{item.name}</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Manual upload */}
        <div className="surface-card rounded-xl border border-border p-5">
          <h3 className="text-[15px] font-medium text-primary-app mb-1">Upload files manually</h3>
          <p className="text-sm text-muted-foreground mb-3">Drag and drop call transcripts, CRM exports, sales decks, or PDFs.</p>
          <div className="rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center hover:border-ring/30 transition-colors cursor-pointer">
            <Upload className="h-[20px] w-[20px] text-muted-foreground mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Drop files here or click to browse</p>
            <p className="text-[11px] text-muted-foreground mt-1">.txt, .pdf, .docx, .csv, .mp3, .vtt, .srt</p>
          </div>
        </div>

        {/* Slash command demo */}
        <div className="surface-card rounded-xl border border-border p-5 mt-4">
          <h3 className="text-sm font-medium text-primary-app mb-2.5">Slash Command</h3>
          <div className="rounded-[10px] bg-accent p-4 font-mono text-sm text-muted-foreground leading-relaxed">
            <span className="text-primary-app font-medium">/hugo</span> battle-card Acme Corp
            <br />
            <span className="text-muted-foreground text-[12px]">→ Returns the latest battle card with differentiators, objection handlers, and recent intel.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
