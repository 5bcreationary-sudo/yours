import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatFork } from "@/hooks/use-chat-fork";

const teamData = [
  { name: "Sarah Chen", deals: 28, wins: 19, losses: 9, winRate: 68, bestAgainst: "Acme Corp", worstAgainst: "Zenith" },
  { name: "Mike Torres", deals: 24, wins: 14, losses: 10, winRate: 58, bestAgainst: "BetaCo", worstAgainst: "Rival.io" },
  { name: "Lisa Park", deals: 22, wins: 17, losses: 5, winRate: 77, bestAgainst: "DataPulse", worstAgainst: "Acme Corp" },
  { name: "James Lee", deals: 19, wins: 11, losses: 8, winRate: 58, bestAgainst: "Rival.io", worstAgainst: "NovaCRM" },
  { name: "Emma Davis", deals: 15, wins: 10, losses: 5, winRate: 67, bestAgainst: "Acme Corp", worstAgainst: "BetaCo" },
  { name: "Ryan Patel", deals: 12, wins: 5, losses: 7, winRate: 42, bestAgainst: "BetaCo", worstAgainst: "Zenith" },
];

type TeamMember = typeof teamData[number];

export function TeamBreakdown() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const { forkToChat } = useChatFork();

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Team Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Rep</th>
                <th className="px-3 py-3 text-center">Deals</th>
                <th className="px-3 py-3 text-center">W / L</th>
                <th className="px-3 py-3 text-center">Win %</th>
                <th className="px-3 py-3 text-left">Best Against</th>
                <th className="px-3 py-3 text-left">Worst Against</th>
                <th className="px-3 py-3 text-left">Bar</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((r) => (
                <tr
                  key={r.name}
                  onClick={() => setSelected(r)}
                  className="border-b border-border last:border-0 hover:bg-[hsl(var(--blue-accent-light))] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-[hsl(var(--blue-accent-light))] flex items-center justify-center text-[11px] font-semibold text-[hsl(var(--blue-accent))]">
                        {r.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-primary-app">{r.name}</span>
                    </div>
                  </td>
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
                  <td className="px-3 py-3 text-[hsl(var(--urgency-low))]">{r.bestAgainst}</td>
                  <td className="px-3 py-3 text-destructive">{r.worstAgainst}</td>
                  <td className="px-3 py-3 w-32">
                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden flex">
                      <div className="h-full bg-[hsl(var(--urgency-low))]" style={{ width: `${r.winRate}%` }} />
                      <div className="h-full bg-destructive/60" style={{ width: `${100 - r.winRate}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team member detail drawer */}
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--blue-accent-light))] flex items-center justify-center text-sm font-semibold text-[hsl(var(--blue-accent))]">
                    {selected.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <h3 className="text-lg font-semibold text-primary-app tracking-tight">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
                  <p className={`text-2xl font-semibold tracking-tight ${selected.winRate >= 65 ? "text-[hsl(var(--urgency-low))]" : selected.winRate >= 50 ? "text-[hsl(var(--blue-accent))]" : "text-destructive"}`}>{selected.winRate}%</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-accent/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deals</p>
                  <p className="text-2xl font-semibold text-primary-app tracking-tight">{selected.deals}</p>
                  <p className="text-[11px] text-muted-foreground">{selected.wins}W / {selected.losses}L</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-[hsl(var(--urgency-low)/0.3)] p-3 bg-[hsl(var(--urgency-low)/0.05)]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Against</p>
                  <p className="text-sm font-medium text-[hsl(var(--urgency-low))]">{selected.bestAgainst}</p>
                </div>
                <div className="rounded-xl border border-destructive/20 p-3 bg-destructive/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Worst Against</p>
                  <p className="text-sm font-medium text-destructive">{selected.worstAgainst}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-accent/30 mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Performance Bar</p>
                <div className="h-3 w-full bg-accent rounded-full overflow-hidden flex mt-2">
                  <div className="h-full bg-[hsl(var(--urgency-low))]" style={{ width: `${selected.winRate}%` }} />
                  <div className="h-full bg-destructive/60" style={{ width: `${100 - selected.winRate}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-[hsl(var(--urgency-low))]">{selected.wins} wins</span>
                  <span className="text-[10px] text-destructive">{selected.losses} losses</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const m = selected;
                    setSelected(null);
                    forkToChat(`Analyze ${m.name}'s competitive performance. Win rate: ${m.winRate}%, ${m.deals} deals (${m.wins}W/${m.losses}L). Best against ${m.bestAgainst}, worst against ${m.worstAgainst}. What coaching recommendations do you have?`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Get coaching tips from Hugo
                </button>
                <button
                  onClick={() => {
                    const m = selected;
                    setSelected(null);
                    forkToChat(`Create a competitive prep plan for ${m.name} to improve against ${m.worstAgainst}. Current win rate: ${m.winRate}%.`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-border py-2.5 text-sm font-medium text-primary-app hover:bg-accent transition-colors"
                >
                  Create improvement plan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
