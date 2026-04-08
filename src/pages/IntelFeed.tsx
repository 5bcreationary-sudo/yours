import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, MessageCircle, BookOpen, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { ImportanceDot, ImportanceBadge } from "@/components/ImportanceDot";
import { useNavigate } from "react-router-dom";

type Importance = "high" | "medium" | "low";

const feedItems = [
  {
    id: 1,
    competitor: "Acme Corp",
    title: "Pricing page updated — enterprise tier increased 20%",
    summary: "Acme's enterprise plan jumped from $499 to $599/mo with no new features. Their growth plan also increased by $50.",
    soWhat: "Pricing change",
    strategic: "This is a major opening. Acme raised prices without adding value — their enterprise customers will be re-evaluating. Position on value and undercut their new pricing in active deals.",
    importance: "high" as Importance,
    time: "12 min ago",
    source: "Pricing page scrape",
  },
  {
    id: 2,
    competitor: "Rival.io",
    title: "Launched AI-powered competitive assistant on Product Hunt",
    summary: "Rival.io announced an AI assistant for competitive intelligence. It generates battle cards and answers competitive questions.",
    soWhat: "New feature",
    strategic: "Rival.io is positioning AI as a differentiator. Expect them to lead with this in enterprise pitches. We need to audit our AI capabilities and prepare counter-positioning fast.",
    importance: "high" as Importance,
    time: "1 hr ago",
    source: "Product Hunt",
  },
  {
    id: 3,
    competitor: "BetaCo",
    title: "8 new enterprise AE positions posted in EMEA",
    summary: "BetaCo posted 8 enterprise account executive roles across London, Berlin, and Paris in the last 48 hours.",
    soWhat: "Hiring signal",
    strategic: "BetaCo is making an aggressive EMEA push. If you have deals in those markets, expect to see them show up within 2-3 months. Brief your EMEA team now.",
    importance: "medium" as Importance,
    time: "3 hrs ago",
    source: "LinkedIn Jobs",
  },
  {
    id: 4,
    competitor: "Zenith",
    title: "Free tier removed from pricing page",
    summary: "Zenith's pricing page no longer shows a free plan. Their minimum tier is now $29/mo Starter.",
    soWhat: "Pricing change",
    strategic: "Zenith cutting their free tier means their PLG funnel is shrinking. SMB prospects who relied on the free plan will be looking for alternatives — opportunity to capture that segment.",
    importance: "medium" as Importance,
    time: "5 hrs ago",
    source: "Pricing page scrape",
  },
  {
    id: 5,
    competitor: "DataPulse",
    title: "Published blog post on enterprise CI trends",
    summary: "DataPulse published a 2,000-word blog post about competitive intelligence trends for 2026. Positions themselves as thought leaders.",
    soWhat: "Content update",
    strategic: "Low immediate impact, but DataPulse is investing in thought leadership. Monitor if this leads to increased inbound — consider a counter-piece or response post.",
    importance: "low" as Importance,
    time: "8 hrs ago",
    source: "Blog scrape",
  },
  {
    id: 6,
    competitor: "DataPulse",
    title: "G2 rating dropped to 3.8 stars",
    summary: "DataPulse lost 0.4 stars on G2 this quarter. Top complaints: slow support response, buggy integrations, outdated UI.",
    soWhat: "Review signal",
    strategic: "DataPulse customers are unhappy with support and UX. This is a displacement opportunity — target their accounts with messaging around reliability and modern experience.",
    importance: "low" as Importance,
    time: "1 day ago",
    source: "G2 Reviews",
  },
];

export default function IntelFeed() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  return (
    <div className="max-w-[860px] mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Intel Feed</h1>
            <p className="text-sm text-muted-foreground mt-1">Live competitive intelligence, auto-refreshed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["All", "Acme Corp", "Rival.io", "BetaCo", "Zenith", "DataPulse"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f.toLowerCase())}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                filter === f.toLowerCase()
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted-foreground hover:text-primary-app"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search intel..."
              className="h-[32px] w-[180px] rounded-full bg-accent pl-8 pr-3 text-[12px] text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-[2px]">
          {feedItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="group flex gap-3 rounded-xl p-4 transition-colors hover:bg-accent/60 cursor-pointer"
            >
              <ImportanceDot level={item.importance} className="mt-1" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-[24px] w-[24px] rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                    {item.competitor[0]}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{item.competitor}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
                  <ImportanceBadge level={item.importance} className="ml-auto" />
                </div>

                <h3 className="text-[15px] font-medium text-primary-app leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.summary}</p>
                
                {/* Strategic "So what" interpretation */}
                <div className="mt-2 rounded-lg bg-accent/60 px-3 py-2 border-l-2 border-[hsl(var(--blue-accent))]">
                  <span className="text-[10px] font-semibold text-[hsl(var(--blue-accent))] uppercase tracking-wider">So what →</span>
                  <p className="text-[12px] text-primary-app leading-relaxed mt-0.5">{item.strategic}</p>
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[11px] text-muted-foreground bg-accent rounded-full px-2.5 py-0.5">
                    {item.soWhat}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{item.source}</span>

                  <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/chat");
                      }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-primary-app transition-colors"
                    >
                      <MessageCircle className="h-[11px] w-[11px]" strokeWidth={1.5} />
                      Ask Hugo
                    </button>
                    <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-primary-app transition-colors">
                      <BookOpen className="h-[11px] w-[11px]" strokeWidth={1.5} />
                      Playbook
                    </button>
                    <button className="p-1 rounded-lg text-muted-foreground hover:bg-background hover:text-primary-app transition-colors">
                      <ThumbsUp className="h-[11px] w-[11px]" strokeWidth={1.5} />
                    </button>
                    <button className="p-1 rounded-lg text-muted-foreground hover:bg-background hover:text-primary-app transition-colors">
                      <ThumbsDown className="h-[11px] w-[11px]" strokeWidth={1.5} />
                    </button>
                    <button className="p-1 rounded-lg text-muted-foreground hover:bg-background hover:text-primary-app transition-colors">
                      <X className="h-[11px] w-[11px]" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
