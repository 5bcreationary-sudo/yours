import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Briefcase, Star, TrendingUp, Brain, MapPin, Calendar, ArrowUpRight, ArrowDownRight, ExternalLink, MessageCircle } from "lucide-react";
import { HugoScore } from "@/components/HugoScore";
import { useChatFork } from "@/hooks/use-chat-fork";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface CompetitorDetailProps {
  competitor: {
    id: string;
    name: string;
    website: string;
    category: string;
    score: number;
    scoreDelta: number;
    lastActivity: string;
  };
  onClose: () => void;
}

const tabs = ["Overview", "Job Postings", "Reviews", "Hugo's Take"] as const;
type Tab = (typeof tabs)[number];

// Mock data
const scoreHistory = [
  { week: "W1", score: 68 },
  { week: "W2", score: 71 },
  { week: "W3", score: 69 },
  { week: "W4", score: 74 },
  { week: "W5", score: 72 },
  { week: "W6", score: 78 },
  { week: "W7", score: 75 },
  { week: "W8", score: 82 },
];

const jobPostings = [
  { id: 1, title: "Senior Enterprise Account Executive", location: "New York, NY", department: "Sales", posted: "2 days ago", url: "#" },
  { id: 2, title: "Enterprise Account Executive - EMEA", location: "London, UK", department: "Sales", posted: "3 days ago", url: "#" },
  { id: 3, title: "Solutions Engineer", location: "San Francisco, CA", department: "Pre-Sales", posted: "5 days ago", url: "#" },
  { id: 4, title: "Product Manager, AI Features", location: "Remote", department: "Product", posted: "1 week ago", url: "#" },
  { id: 5, title: "Senior Backend Engineer", location: "Austin, TX", department: "Engineering", posted: "1 week ago", url: "#" },
  { id: 6, title: "Director of Marketing", location: "New York, NY", department: "Marketing", posted: "2 weeks ago", url: "#" },
];

const reviews = [
  { platform: "G2", rating: 4.2, total: 287, trend: -0.3, topPros: ["Easy setup", "Good integrations", "Fast support"], topCons: ["Expensive", "UI feels dated", "Limited reporting"], recentQuote: "Solid platform but pricing is getting out of hand for mid-market teams." },
  { platform: "Capterra", rating: 4.0, total: 156, trend: 0.1, topPros: ["Feature-rich", "Reliable", "Good API"], topCons: ["Steep learning curve", "Slow updates", "Mobile experience"], recentQuote: "We've been using it for 2 years. Feature-rich but the UI needs a refresh." },
];

function getHugoAssessment(name: string) {
  return `**${name} is in growth mode.** They've increased enterprise hiring by 40% this quarter, focusing heavily on EMEA expansion. The 20% price increase on their enterprise tier suggests confidence in product-market fit — or pressure from investors to improve margins.

**Key signals this week:**
- Aggressive sales hiring in EMEA signals international expansion push
- No new product features to justify the price increase — potential vulnerability
- Their G2 rating dropped 0.3 stars — support quality complaints are increasing

**What this means for us:**
Their EMEA push creates a window where they'll be stretched thin. Their price increase without new value is already generating negative chatter. This is an opportunity to position on value and undercut their enterprise pitch.

**Recommended actions:**
1. Prepare a "switching from ${name}" campaign targeting their enterprise customers
2. Update battle cards to highlight the price increase with no new features
3. Monitor their EMEA job posts to predict which markets they'll enter first`;
}

export function CompetitorDetail({ competitor, onClose }: CompetitorDetailProps) {
  const [tab, setTab] = useState<Tab>("Overview");
  const { forkToChat } = useChatFork();

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] bg-card border-l border-border z-50 flex flex-col shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {competitor.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary-app tracking-tight">{competitor.name}</h2>
                <span className="text-[12px] text-muted-foreground">{competitor.website} · {competitor.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => forkToChat(`Give me a full competitive analysis on ${competitor.name}`)}
                className="flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-80 transition-opacity"
              >
                <MessageCircle className="h-3 w-3" strokeWidth={2} />
                Ask Hugo
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary-app transition-colors">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-primary-app hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === "Overview" && <OverviewTab competitor={competitor} />}
              {tab === "Job Postings" && <JobPostingsTab name={competitor.name} />}
              {tab === "Reviews" && <ReviewsTab name={competitor.name} />}
              {tab === "Hugo's Take" && <HugoTakeTab name={competitor.name} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function OverviewTab({ competitor }: { competitor: CompetitorDetailProps["competitor"] }) {
  return (
    <div className="space-y-6">
      {/* Score + trend */}
      <div className="flex items-center gap-6">
        <div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Hugo Score</span>
          <div className="flex items-center gap-2 mt-1">
            <HugoScore score={competitor.score} size="md" />
            <div className="flex items-center gap-0.5">
              {competitor.scoreDelta > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-[hsl(var(--urgency-low))]" strokeWidth={2} />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" strokeWidth={2} />
              )}
              <span className={`text-sm font-medium ${competitor.scoreDelta > 0 ? "text-[hsl(var(--urgency-low))]" : "text-destructive"}`}>
                {competitor.scoreDelta > 0 ? "+" : ""}{competitor.scoreDelta} this week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score trend chart */}
      <div>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Score Trend (8 weeks)</span>
        <div className="h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreHistory}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 90%, 56%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(210, 90%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(0,0%,91%)" }} />
              <Area type="monotone" dataKey="score" stroke="hsl(210, 90%, 56%)" strokeWidth={2} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Win Rate vs Them", value: "58%", sub: "12 of 21 deals" },
          { label: "Avg Deal Size", value: "$42K", sub: "vs their $38K" },
          { label: "Active Deals", value: "4", sub: "2 enterprise" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-accent/50 p-3">
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
            <div className="text-lg font-semibold text-primary-app mt-0.5">{s.value}</div>
            <span className="text-[11px] text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobPostingsTab({ name }: { name: string }) {
  const { forkToChat } = useChatFork();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary-app">{jobPostings.length} Open Positions</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Tracked from LinkedIn, careers page · Updated 4h ago</p>
        </div>
        <button
          onClick={() => forkToChat(`Analyze the hiring patterns at ${name} and what they signal about their strategy`)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary-app hover:bg-accent transition-colors"
        >
          <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
          Analyze with Hugo
        </button>
      </div>

      {/* Department breakdown */}
      <div className="flex gap-2 flex-wrap">
        {["Sales (2)", "Pre-Sales (1)", "Product (1)", "Engineering (1)", "Marketing (1)"].map((d) => (
          <span key={d} className="text-[11px] text-muted-foreground bg-accent rounded-full px-2.5 py-0.5">{d}</span>
        ))}
      </div>

      <div className="space-y-1">
        {jobPostings.map((job) => (
          <div key={job.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/50 transition-colors group">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-primary-app truncate">{job.title}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[11px] text-muted-foreground">{job.location}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{job.department}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <Calendar className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[11px] text-muted-foreground">{job.posted}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({ name }: { name: string }) {
  const { forkToChat } = useChatFork();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-app">Review Sentiment</h3>
        <button
          onClick={() => forkToChat(`Analyze ${name}'s review sentiment on G2 and Capterra. What are their biggest weaknesses we can exploit?`)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary-app hover:bg-accent transition-colors"
        >
          <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
          Analyze with Hugo
        </button>
      </div>

      {reviews.map((r) => (
        <div key={r.platform} className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[hsl(var(--urgency-medium))]" fill="hsl(35, 90%, 52%)" strokeWidth={0} />
              <span className="text-sm font-semibold text-primary-app">{r.platform}</span>
              <span className="text-lg font-bold text-primary-app">{r.rating}</span>
              <span className="text-[11px] text-muted-foreground">/ 5</span>
            </div>
            <div className="flex items-center gap-1">
              {r.trend > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-[hsl(var(--urgency-low))]" strokeWidth={2} />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" strokeWidth={2} />
              )}
              <span className={`text-[12px] font-medium ${r.trend > 0 ? "text-[hsl(var(--urgency-low))]" : "text-destructive"}`}>
                {r.trend > 0 ? "+" : ""}{r.trend} this quarter
              </span>
              <span className="text-[11px] text-muted-foreground ml-1">({r.total} reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-medium text-[hsl(var(--urgency-low))] uppercase tracking-wider">Pros</span>
              <div className="mt-1 space-y-1">
                {r.topPros.map((p) => (
                  <div key={p} className="text-[12px] text-primary-app">+ {p}</div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-destructive uppercase tracking-wider">Cons</span>
              <div className="mt-1 space-y-1">
                {r.topCons.map((c) => (
                  <div key={c} className="text-[12px] text-primary-app">− {c}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-accent rounded-lg p-3">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Recent Review</span>
            <p className="text-[12px] text-primary-app mt-1 italic">"{r.recentQuote}"</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HugoTakeTab({ name }: { name: string }) {
  const { forkToChat } = useChatFork();
  const assessment = getHugoAssessment(name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-primary-app">Hugo's Weekly Assessment</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Updated 2 days ago</span>
      </div>

      <div className="rounded-xl border border-border p-5 bg-accent/30">
        <div className="text-sm text-primary-app leading-[1.8] whitespace-pre-line prose-sm">
          {assessment.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
          )}
        </div>
      </div>

      <button
        onClick={() => forkToChat(`Based on your latest assessment of ${name}, what specific actions should I take this week?`)}
        className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[12px] font-medium text-background hover:opacity-80 transition-opacity"
      >
        <MessageCircle className="h-3 w-3" strokeWidth={2} />
        Discuss with Hugo
      </button>
    </div>
  );
}
