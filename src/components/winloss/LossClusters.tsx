import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, MessageCircle, X } from "lucide-react";
import { useChatFork } from "@/hooks/use-chat-fork";

const clusters = [
  { theme: "Missing mobile app", count: 18, revenue: "$684K", objections: ["No native app for field reps", "Can't demo on iPad"], detail: "Enterprise prospects need native mobile for field reps. This is our biggest competitive gap.", competitor: "Acme Corp" },
  { theme: "Slower onboarding", count: 11, revenue: "$341K", objections: ["Time-to-value too long", "Need guided setup"], detail: "Prospects report 3x longer time-to-value. Rival.io's guided setup is the benchmark.", competitor: "Rival.io" },
  { theme: "Price perception", count: 7, revenue: "$196K", objections: ["Too expensive upfront", "Competitor offered discount"], detail: "Mid-market deals lost on sticker price even though TCO is comparable or lower.", competitor: "BetaCo" },
  { theme: "Salesforce integration depth", count: 5, revenue: "$255K", objections: ["Need bi-directional sync", "Custom objects not supported"], detail: "CRM-centric orgs need deeper native integration than our current offering.", competitor: "Zenith" },
  { theme: "Brand / trust", count: 4, revenue: "$122K", objections: ["Never heard of you", "Prefer established vendor"], detail: "Smaller deals lost to brand trust — usually incumbent advantage.", competitor: "NovaCRM" },
];

type Cluster = typeof clusters[number];

export function LossClusters() {
  const [selected, setSelected] = useState<Cluster | null>(null);
  const { forkToChat } = useChatFork();

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            AI Loss Clustering
          </h3>
          <span className="text-[11px] text-muted-foreground">5 clusters · 45 deals</span>
        </div>
        {clusters.map((c, i) => (
          <motion.div
            key={c.theme}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(c)}
            className="bg-card rounded-xl border border-border p-4 hover:border-[hsl(var(--blue-accent)/0.3)] cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-primary-app">{c.theme}</span>
                  <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5">{c.count} deals</span>
                  <span className="text-[10px] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))] rounded-full px-2 py-0.5">{c.revenue} lost</span>
                  <span className="text-[10px] text-muted-foreground">vs {c.competitor}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.detail}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  forkToChat(`Analyze our "${c.theme}" loss pattern: ${c.count} deals lost worth ${c.revenue}, mainly against ${c.competitor}. Common objections: ${c.objections.join(", ")}. What strategy should we adopt?`);
                }}
                className="flex items-center gap-1 shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary-app hover:bg-accent transition-colors"
              >
                <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                Ask Hugo
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cluster detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-card border-l border-border z-50 p-6 overflow-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary-app tracking-tight">{selected.theme}</h3>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-border p-3 bg-destructive/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deals Lost</p>
                  <p className="text-2xl font-semibold text-destructive tracking-tight">{selected.count}</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-[hsl(var(--blue-accent-light))]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue Lost</p>
                  <p className="text-2xl font-semibold text-[hsl(var(--blue-accent))] tracking-tight">{selected.revenue}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-accent/30 mb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Primary Competitor</p>
                <p className="text-sm font-medium text-primary-app">{selected.competitor}</p>
              </div>

              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Analysis</p>
                <p className="text-sm text-primary-app leading-relaxed">{selected.detail}</p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Common Objections</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.objections.map((o) => (
                    <span key={o} className="text-[11px] bg-accent text-muted-foreground rounded-full px-3 py-1">"{o}"</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const s = selected;
                    setSelected(null);
                    forkToChat(`Deep dive into our "${s.theme}" loss pattern. ${s.count} deals lost worth ${s.revenue} against ${s.competitor}. Objections: ${s.objections.join(", ")}. ${s.detail} Give me an action plan.`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Get action plan from Hugo
                </button>
                <button
                  onClick={() => {
                    const s = selected;
                    setSelected(null);
                    forkToChat(`Create objection handling scripts for the "${s.theme}" loss pattern against ${s.competitor}. Common objections: ${s.objections.join(", ")}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-border py-2.5 text-sm font-medium text-primary-app hover:bg-accent transition-colors"
                >
                  Generate objection scripts
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
