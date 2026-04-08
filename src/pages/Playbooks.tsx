import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Clock, Share2, FileText, Archive, X, ChevronRight } from "lucide-react";

type PlaybookStatus = "fresh" | "needs_review" | "stale";
type PlaybookType = "sales" | "product" | "marketing" | "exec";

interface Playbook {
  id: number;
  competitor: string;
  type: PlaybookType;
  status: PlaybookStatus;
  updated: string;
  usage: string;
  winRate: number;
  hasUpdate: boolean;
}

const playbooks: Playbook[] = [
  { id: 1, competitor: "Acme Corp", type: "sales", status: "needs_review", updated: "2 hrs ago", usage: "Used in 12 deals this month", winRate: 68, hasUpdate: true },
  { id: 2, competitor: "Rival.io", type: "product", status: "fresh", updated: "1 day ago", usage: "Used in 8 deals this month", winRate: 72, hasUpdate: false },
  { id: 3, competitor: "BetaCo", type: "sales", status: "fresh", updated: "3 hrs ago", usage: "Used in 5 deals this month", winRate: 81, hasUpdate: false },
  { id: 4, competitor: "Zenith", type: "marketing", status: "stale", updated: "45 days ago", usage: "Used in 2 deals this month", winRate: 42, hasUpdate: false },
  { id: 5, competitor: "DataPulse", type: "exec", status: "fresh", updated: "1 day ago", usage: "Used in 3 deals this month", winRate: 75, hasUpdate: false },
  { id: 6, competitor: "Acme Corp", type: "marketing", status: "needs_review", updated: "6 hrs ago", usage: "Used in 7 deals this month", winRate: 55, hasUpdate: true },
  { id: 7, competitor: "Rival.io", type: "sales", status: "fresh", updated: "12 hrs ago", usage: "Used in 15 deals this month", winRate: 64, hasUpdate: false },
  { id: 8, competitor: "BetaCo", type: "exec", status: "stale", updated: "60 days ago", usage: "Not used yet", winRate: 0, hasUpdate: false },
];

const tabs = ["All", "Sales", "Product", "Marketing", "Exec", "Stale"];

const statusConfig: Record<PlaybookStatus, { label: string; className: string }> = {
  fresh: { label: "Fresh", className: "bg-[hsl(var(--urgency-low)/0.08)] text-[hsl(var(--urgency-low))]" },
  needs_review: { label: "Needs review", className: "bg-[hsl(var(--urgency-medium)/0.08)] text-[hsl(var(--urgency-medium))]" },
  stale: { label: "Stale", className: "bg-destructive/8 text-destructive" },
};

export default function Playbooks() {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [detailTab, setDetailTab] = useState("overview");

  const staleCount = playbooks.filter((p) => p.status === "stale").length;

  const filtered = activeTab === "All"
    ? playbooks
    : activeTab === "Stale"
    ? playbooks.filter((p) => p.status === "stale")
    : playbooks.filter((p) => p.type === activeTab.toLowerCase());

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Playbooks</h1>
            <p className="text-sm text-muted-foreground mt-1">Auto-generated competitive guides, updated in real-time</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-[10px] bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity">
            <Plus className="h-[13px] w-[13px]" strokeWidth={2} />
            New Playbook
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab ? "text-primary-app" : "text-muted-foreground hover:text-primary-app"
              }`}
            >
              {tab}
              {tab === "Stale" && staleCount > 0 && (
                <span className="ml-1 text-[10px] bg-destructive/10 text-destructive rounded-full px-1.5 py-0.5">
                  {staleCount}
                </span>
              )}
              {activeTab === tab && (
                <motion.div layoutId="playbook-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((pb, i) => (
            <motion.div
              key={pb.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => setSelectedPlaybook(pb)}
              className="surface-card rounded-xl border border-border p-5 hover:border-ring/20 transition-all cursor-pointer flex flex-col"
            >
              {pb.hasUpdate && (
                <div className="text-[11px] text-[hsl(var(--blue-accent))] font-medium mb-2">
                  Hugo updated this playbook ›
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[28px] w-[28px] rounded-full bg-accent flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                  {pb.competitor[0]}
                </div>
                <h3 className="text-[15px] font-medium text-primary-app flex-1">vs. {pb.competitor}</h3>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[11px] font-medium text-muted-foreground bg-accent rounded-full px-2.5 py-0.5 capitalize">
                  {pb.type}
                </span>
                <span className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 ${statusConfig[pb.status].className}`}>
                  {statusConfig[pb.status].label}
                </span>
              </div>

              <p className="text-[12px] text-muted-foreground mb-1">{pb.usage}</p>

              <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-[11px] w-[11px]" strokeWidth={1.5} />
                  {pb.updated}
                </div>
                {pb.winRate > 0 && (
                  <span className={`text-[11px] font-medium ${pb.winRate >= 60 ? "text-[hsl(var(--urgency-low))]" : "text-destructive"}`}>
                    {pb.winRate}% win rate
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selectedPlaybook && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedPlaybook(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] bg-card border-l border-border z-50 overflow-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="h-[32px] w-[32px] rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {selectedPlaybook.competitor[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-primary-app tracking-tight">vs. {selectedPlaybook.competitor}</h2>
                      <span className="text-[11px] text-muted-foreground capitalize">{selectedPlaybook.type} playbook</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <FileText className="h-[15px] w-[15px]" strokeWidth={1.5} />
                    </button>
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <Share2 className="h-[15px] w-[15px]" strokeWidth={1.5} />
                    </button>
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <Archive className="h-[15px] w-[15px]" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setSelectedPlaybook(null)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <X className="h-[15px] w-[15px]" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {selectedPlaybook.hasUpdate && (
                  <div className="rounded-xl bg-[hsl(var(--blue-accent)/0.06)] border border-[hsl(var(--blue-accent)/0.15)] p-4 mb-6">
                    <p className="text-sm text-[hsl(var(--blue-accent))] font-medium">Hugo updated this playbook based on 3 new intel items.</p>
                    <div className="flex gap-2 mt-2.5">
                      <button className="rounded-lg bg-[hsl(var(--blue-accent))] px-3 py-1.5 text-[12px] font-medium text-background">Approve</button>
                      <button className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground">Reject</button>
                    </div>
                  </div>
                )}

                {/* Detail tabs */}
                <div className="flex gap-1 mb-6 border-b border-border">
                  {["Overview", "Objections", "Feature Gaps", "Pricing", "Recent Intel"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab.toLowerCase())}
                      className={`px-3 py-2 text-sm transition-colors ${
                        detailTab === tab.toLowerCase() ? "text-primary-app font-medium border-b-2 border-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="text-sm text-primary-app leading-[1.7] space-y-4">
                  <div>
                    <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Positioning</h3>
                    <p>{selectedPlaybook.competitor} positions as a comprehensive competitive intelligence platform for mid-market and enterprise teams. They emphasize ease of setup and automated monitoring.</p>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Differentiators vs Us</h3>
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">–</span> They have native mobile app (we don't)</li>
                      <li className="flex items-start gap-2"><span className="text-[hsl(var(--urgency-low))] mt-0.5">+</span> Our AI chat is significantly more capable</li>
                      <li className="flex items-start gap-2"><span className="text-[hsl(var(--urgency-low))] mt-0.5">+</span> We offer real-time intel; they batch daily</li>
                      <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">–</span> Their Salesforce integration is deeper</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h3>
                    <p>Strong competitor in the mid-market. Watch their AI assistant launch closely — if it gains traction, they'll be positioning directly against Hugo's core differentiator. Their pricing increase is an opportunity to win cost-conscious prospects.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
