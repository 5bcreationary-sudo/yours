import { useState } from "react";
import { Search, ChevronDown, Eye } from "lucide-react";

interface Deal {
  id: number;
  company: string;
  competitor: string;
  outcome: "won" | "lost";
  value: string;
  rep: string;
  date: string;
  reason: string;
  notes: string;
}

const deals: Deal[] = [
  { id: 1, company: "TechFlow Inc", competitor: "Acme Corp", outcome: "won", value: "$52K", rep: "Sarah Chen", date: "Mar 6", reason: "Real-time intel", notes: "Client loved the instant competitive alerts. Closed 2 weeks early." },
  { id: 2, company: "DataStack", competitor: "Rival.io", outcome: "lost", value: "$38K", rep: "Mike Torres", date: "Mar 5", reason: "Onboarding speed", notes: "They chose Rival.io for their 2-week setup vs our 6-week." },
  { id: 3, company: "CloudNine", competitor: "BetaCo", outcome: "won", value: "$28K", rep: "Lisa Park", date: "Mar 4", reason: "Feature depth", notes: "Our API-first approach was the deciding factor." },
  { id: 4, company: "ScaleUp Co", competitor: "Zenith", outcome: "lost", value: "$61K", rep: "James Lee", date: "Mar 3", reason: "Salesforce integration", notes: "Needed deep bi-directional Salesforce sync we don't have yet." },
  { id: 5, company: "Revenue.ai", competitor: "Acme Corp", outcome: "won", value: "$44K", rep: "Emma Davis", date: "Mar 2", reason: "Hugo Chat", notes: "The AI chat demo in the sales call sealed the deal." },
  { id: 6, company: "Nextera", competitor: "DataPulse", outcome: "won", value: "$22K", rep: "Lisa Park", date: "Mar 1", reason: "Win/loss insights", notes: "They were impressed by pattern detection across their pilot data." },
  { id: 7, company: "Omnicore", competitor: "NovaCRM", outcome: "lost", value: "$55K", rep: "Ryan Patel", date: "Feb 28", reason: "Brand trust", notes: "Went with incumbent — couldn't overcome brand trust gap." },
  { id: 8, company: "FluxData", competitor: "Rival.io", outcome: "won", value: "$33K", rep: "Sarah Chen", date: "Feb 27", reason: "Slack integration", notes: "Our Slack alerts were a key differentiator for their distributed team." },
];

export function DealLog() {
  const [filter, setFilter] = useState<"all" | "won" | "lost">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = deals.filter((d) => {
    if (filter !== "all" && d.outcome !== filter) return false;
    if (search && !`${d.company} ${d.competitor} ${d.rep}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Deal Log</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals..."
              className="h-8 rounded-lg bg-accent pl-8 pr-3 text-[12px] text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
            />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["all", "won", "lost"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Company</th>
              <th className="px-3 py-3 text-left">Competitor</th>
              <th className="px-3 py-3 text-center">Outcome</th>
              <th className="px-3 py-3 text-center">Value</th>
              <th className="px-3 py-3 text-left">Rep</th>
              <th className="px-3 py-3 text-left">Date</th>
              <th className="px-3 py-3 text-left">Reason</th>
              <th className="px-3 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <>
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary-app">{d.company}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.competitor}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] font-medium rounded-full px-2.5 py-0.5 ${
                      d.outcome === "won" ? "bg-[hsl(var(--urgency-low)/0.1)] text-[hsl(var(--urgency-low))]" : "bg-destructive/10 text-destructive"
                    }`}>
                      {d.outcome}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{d.value}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.rep}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.date}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.reason}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-primary-app transition-colors">
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
                {expanded === d.id && (
                  <tr key={`${d.id}-detail`} className="border-b border-border">
                    <td colSpan={8} className="px-5 py-3 bg-accent/20">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Notes & Hugo's Analysis</p>
                      <p className="text-sm text-primary-app leading-relaxed">{d.notes}</p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
