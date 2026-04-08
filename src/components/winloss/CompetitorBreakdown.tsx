import { useState } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatFork } from "@/hooks/use-chat-fork";

interface CompetitorRow {
  competitor: string;
  deals: number;
  wins: number;
  losses: number;
  winRate: number;
  trend: "up" | "down" | "stable";
  trendDelta: string;
  topLoss: string;
  avgDealWon: string;
  avgDealLost: string;
  sparkline: number[];
}

const data: CompetitorRow[] = [
  { competitor: "Acme Corp", deals: 45, wins: 28, losses: 17, winRate: 62, trend: "up", trendDelta: "+4%", topLoss: "Mobile app", avgDealWon: "$42K", avgDealLost: "$38K", sparkline: [55, 58, 60, 57, 62, 65, 62] },
  { competitor: "Rival.io", deals: 31, wins: 18, losses: 13, winRate: 58, trend: "up", trendDelta: "+2%", topLoss: "Onboarding speed", avgDealWon: "$35K", avgDealLost: "$31K", sparkline: [52, 54, 56, 55, 58, 57, 58] },
  { competitor: "BetaCo", deals: 22, wins: 16, losses: 6, winRate: 73, trend: "stable", trendDelta: "0%", topLoss: "Price", avgDealWon: "$28K", avgDealLost: "$24K", sparkline: [70, 72, 71, 73, 72, 74, 73] },
  { competitor: "Zenith", deals: 18, wins: 10, losses: 8, winRate: 55, trend: "down", trendDelta: "-6%", topLoss: "Salesforce integration", avgDealWon: "$51K", avgDealLost: "$47K", sparkline: [62, 60, 58, 57, 55, 54, 55] },
  { competitor: "DataPulse", deals: 14, wins: 11, losses: 3, winRate: 79, trend: "up", trendDelta: "+8%", topLoss: "Incumbent", avgDealWon: "$22K", avgDealLost: "$19K", sparkline: [68, 70, 73, 75, 78, 77, 79] },
  { competitor: "NovaCRM", deals: 9, wins: 4, losses: 5, winRate: 44, trend: "down", trendDelta: "-3%", topLoss: "Brand trust", avgDealWon: "$61K", avgDealLost: "$55K", sparkline: [50, 48, 47, 46, 45, 44, 44] },
];

function MiniSparkline({ data: points }: { data: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const trending = points[points.length - 1] >= points[0];
  return (
    <svg width={w} height={h} className="shrink-0">
      <path d={path} fill="none" stroke={trending ? "hsl(var(--urgency-low))" : "hsl(var(--destructive))"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type SortKey = "competitor" | "deals" | "winRate";

export function CompetitorBreakdown() {
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<CompetitorRow | null>(null);
  const { forkToChat } = useChatFork();

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...data].sort((a, b) => {
    const m = sortDir === "asc" ? 1 : -1;
    if (sortKey === "competitor") return m * a.competitor.localeCompare(b.competitor);
    return m * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />;

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Competitor Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3 text-left cursor-pointer select-none" onClick={() => toggle("competitor")}>
                  <span className="inline-flex items-center gap-1">Competitor <SortIcon k="competitor" /></span>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => toggle("deals")}>
                  <span className="inline-flex items-center gap-1">Deals <SortIcon k="deals" /></span>
                </th>
                <th className="px-3 py-3 text-center">W / L</th>
                <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => toggle("winRate")}>
                  <span className="inline-flex items-center gap-1">Win % <SortIcon k="winRate" /></span>
                </th>
                <th className="px-3 py-3 text-center">Trend</th>
                <th className="px-3 py-3 text-center">Sparkline</th>
                <th className="px-3 py-3 text-left">Top Loss</th>
                <th className="px-3 py-3 text-center">Avg Won</th>
                <th className="px-3 py-3 text-center">Avg Lost</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.competitor}
                  onClick={() => setSelected(r)}
                  className="border-b border-border last:border-0 hover:bg-[hsl(var(--blue-accent-light))] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-primary-app">{r.competitor}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.deals}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-[hsl(var(--urgency-low))]">{r.wins}</span>
                    <span className="text-muted-foreground/40 mx-0.5">/</span>
                    <span className="text-destructive">{r.losses}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-medium ${r.winRate >= 65 ? "text-[hsl(var(--urgency-low))]" : r.winRate >= 50 ? "text-[hsl(var(--blue-accent))]" : "text-destructive"}`}>
                      {r.winRate}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[11px] font-medium ${r.trend === "up" ? "text-[hsl(var(--urgency-low))]" : r.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                      {r.trendDelta}
                    </span>
                  </td>
                  <td className="px-3 py-3 flex justify-center"><MiniSparkline data={r.sparkline} /></td>
                  <td className="px-3 py-3 text-muted-foreground">{r.topLoss}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.avgDealWon}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.avgDealLost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitor detail drawer */}
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
                <h3 className="text-lg font-semibold text-primary-app tracking-tight">{selected.competitor}</h3>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
                  <p className={`text-2xl font-semibold tracking-tight ${selected.winRate >= 60 ? "text-[hsl(var(--urgency-low))]" : "text-destructive"}`}>{selected.winRate}%</p>
                  <p className="text-[11px] text-muted-foreground">{selected.trendDelta} vs last month</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deals</p>
                  <p className="text-2xl font-semibold text-primary-app tracking-tight">{selected.deals}</p>
                  <p className="text-[11px] text-muted-foreground">{selected.wins}W / {selected.losses}L</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Deal Won</p>
                  <p className="text-xl font-semibold text-primary-app tracking-tight">{selected.avgDealWon}</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Deal Lost</p>
                  <p className="text-xl font-semibold text-primary-app tracking-tight">{selected.avgDealLost}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-accent/30 mb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Top Loss Reason</p>
                <p className="text-sm font-medium text-primary-app">{selected.topLoss}</p>
              </div>

              <div className="rounded-xl border border-border p-3 bg-accent/30 mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Trend (7 months)</p>
                <MiniSparkline data={selected.sparkline} />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const c = selected.competitor;
                    setSelected(null);
                    forkToChat(`Give me a full competitive analysis of ${c}. Our win rate is ${selected.winRate}% across ${selected.deals} deals. Top loss reason: ${selected.topLoss}. What should we do?`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Deep dive with Hugo
                </button>
                <button
                  onClick={() => {
                    const c = selected.competitor;
                    setSelected(null);
                    forkToChat(`Generate a battle playbook for ${c}. Include positioning, objection handling for "${selected.topLoss}", and talk tracks.`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-border py-2.5 text-sm font-medium text-primary-app hover:bg-accent transition-colors"
                >
                  Generate Playbook
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
