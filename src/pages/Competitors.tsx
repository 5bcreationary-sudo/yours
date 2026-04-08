import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugoScore } from "@/components/HugoScore";
import { Search, Plus, ArrowUpRight, ArrowDownRight, Pause, Trash2, X, Globe, Briefcase, Star, TrendingUp } from "lucide-react";
import { CompetitorDetail } from "@/components/competitors/CompetitorDetail";

interface Competitor {
  id: string;
  name: string;
  website: string;
  category: "direct" | "indirect" | "aspirational";
  score: number;
  scoreDelta: number;
  lastActivity: string;
  playbooks: number;
  isActive: boolean;
}

const competitors: Competitor[] = [
  { id: "1", name: "Acme Corp", website: "acme.com", category: "direct", score: 82, scoreDelta: 5, lastActivity: "Pricing page changed 12 min ago", playbooks: 3, isActive: true },
  { id: "2", name: "Rival.io", website: "rival.io", category: "direct", score: 74, scoreDelta: 8, lastActivity: "AI feature launched 1 hr ago", playbooks: 2, isActive: true },
  { id: "3", name: "BetaCo", website: "betaco.com", category: "direct", score: 61, scoreDelta: -3, lastActivity: "8 EMEA job posts 3 hrs ago", playbooks: 2, isActive: true },
  { id: "4", name: "Zenith", website: "zenith.io", category: "indirect", score: 55, scoreDelta: -7, lastActivity: "Free tier removed 5 hrs ago", playbooks: 1, isActive: true },
  { id: "5", name: "DataPulse", website: "datapulse.com", category: "indirect", score: 43, scoreDelta: -12, lastActivity: "G2 rating dropped 1 day ago", playbooks: 1, isActive: true },
];

export default function Competitors() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = competitors.find((c) => c.id === selectedId);

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Competitors</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {competitors.length} competitors tracked · 47 intel items this week · Last scraped 4 min ago
            </p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddStep(1); }}
            className="flex items-center gap-1.5 rounded-[10px] bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity"
          >
            <Plus className="h-[13px] w-[13px]" strokeWidth={2} />
            Add Competitor
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitors..."
            className="w-full max-w-[320px] h-[36px] rounded-full bg-accent pl-9 pr-4 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
        </div>

        {/* Table */}
        <div className="surface-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_72px_1fr_80px_60px] gap-3 px-5 py-3 border-b border-border">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Competitor</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Score</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Δ</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Activity</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Books</span>
            <span />
          </div>
          {competitors.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedId(c.id)}
              className="grid grid-cols-[1fr_80px_72px_1fr_80px_60px] gap-3 px-5 py-3.5 items-center hover:bg-accent/50 transition-colors cursor-pointer group border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-[32px] w-[32px] rounded-full bg-accent flex items-center justify-center text-[12px] font-semibold text-muted-foreground">
                  {c.name[0]}
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-app">{c.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{c.website}</span>
                    <span className="text-[10px] text-muted-foreground bg-accent rounded-full px-1.5 py-0 capitalize">{c.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <HugoScore score={c.score} size="sm" />
              </div>
              <div className="flex items-center justify-center gap-0.5">
                {c.scoreDelta > 0 ? (
                  <ArrowUpRight className="h-[12px] w-[12px] text-[hsl(var(--urgency-low))]" strokeWidth={2} />
                ) : (
                  <ArrowDownRight className="h-[12px] w-[12px] text-destructive" strokeWidth={2} />
                )}
                <span className={`text-[12px] font-medium ${c.scoreDelta > 0 ? "text-[hsl(var(--urgency-low))]" : "text-destructive"}`}>
                  {c.scoreDelta > 0 ? "+" : ""}{c.scoreDelta}
                </span>
              </div>
              <span className="text-sm text-muted-foreground truncate">{c.lastActivity}</span>
              <span className="text-sm text-muted-foreground text-center">{c.playbooks}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 rounded text-muted-foreground hover:text-primary-app"><Pause className="h-[13px] w-[13px]" strokeWidth={1.5} /></button>
                <button className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-[13px] w-[13px]" strokeWidth={1.5} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Competitor Detail Panel */}
      <AnimatePresence>
        {selected && (
          <CompetitorDetail
            competitor={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Competitor Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-6"
            >
              <div className="bg-card rounded-2xl border border-border w-full max-w-[480px] p-6 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-primary-app tracking-tight">Add Competitor</h2>
                  <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app"><X className="h-[16px] w-[16px]" strokeWidth={1.5} /></button>
                </div>

                {addStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Company name</label>
                      <input className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. Acme Corp" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Website URL</label>
                      <input className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. https://acme.com" />
                    </div>
                    <button onClick={() => setAddStep(2)} className="w-full rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity mt-2">Continue</button>
                  </div>
                )}

                {addStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Hugo auto-detected these URLs to monitor:</p>
                    {["Pricing page", "Careers page", "G2 profile", "LinkedIn"].map((url) => (
                      <label key={url} className="flex items-center gap-2.5 rounded-[10px] bg-accent px-4 py-2.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-primary-app">{url}</span>
                      </label>
                    ))}
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Category</label>
                      <select className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring">
                        <option>Direct</option>
                        <option>Indirect</option>
                        <option>Aspirational</option>
                      </select>
                    </div>
                    <button onClick={() => setShowAdd(false)} className="w-full rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity mt-2">Start Watching</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
