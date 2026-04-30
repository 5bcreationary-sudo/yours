import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Calendar, Clock, Settings, ChevronRight, BarChart3, Mic, Sparkles, Bell, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { YoursLogo } from "@/components/YoursLogo";

const recentBriefings = [
  { date: "Today", length: "8 min", status: "ready", listened: false },
  { date: "Yesterday", length: "12 min", status: "listened", listened: true },
  { date: "Apr 6", length: "6 min", status: "listened", listened: true },
  { date: "Apr 5", length: "10 min", status: "listened", listened: true },
  { date: "Apr 4", length: "8 min", status: "listened", listened: true },
];

const quickStats = [
  { label: "Listen streak", value: "12 days", icon: "🔥" },
  { label: "Avg length", value: "8.2 min", icon: "⏱️" },
  { label: "Topics tracked", value: "7", icon: "📡" },
  { label: "This week", value: "5/5", icon: "✅" },
];

const insights = [
  "You skipped Sports 30% this month — want to reduce it?",
  "You replayed AI Startups sections 4× — we'll expand coverage.",
  "Try the 'calm' tone for weekends? Many users prefer it.",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "history" | "settings">("home");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[600px] mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <YoursLogo size={48} />
            <span className="text-[15px] font-semibold tracking-tight text-primary-app">Yours</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("settings")}
              className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary-app transition-colors"
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-accent p-1 mb-6">
          {[
            { id: "home" as const, label: "Home", icon: Sparkles },
            { id: "history" as const, label: "History", icon: Calendar },
            { id: "settings" as const, label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-primary-app shadow-sm"
                  : "text-muted-foreground hover:text-primary-app"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Today's briefing CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[hsl(var(--blue-accent)/0.2)] bg-[hsl(var(--blue-accent-light))] p-6 text-center"
            >
              <p className="text-xs font-medium text-[hsl(var(--blue-accent))] uppercase tracking-widest mb-2">Today's Briefing</p>
              <h2 className="text-lg font-semibold text-primary-app mb-1">Good morning! ☀️</h2>
              <p className="text-sm text-muted-foreground mb-4">Your 8-minute briefing is ready</p>
              <button
                onClick={() => navigate("/player/today")}
                className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" /> Listen Now
              </button>
            </motion.div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-lg">{stat.icon}</span>
                  <p className="text-base font-semibold text-primary-app mt-1">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Smart insights */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Smart Insights</h3>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
                  >
                    <span className="text-xs mt-0.5">💡</span>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{insight}</p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent briefings */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Recent Briefings</h3>
              <div className="space-y-1">
                {recentBriefings.map((b) => (
                  <button
                    key={b.date}
                    onClick={() => navigate("/player/today")}
                    className="w-full rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      b.listened ? "bg-accent" : "bg-[hsl(var(--blue-accent-light))]"
                    }`}>
                      <Play className={`h-3 w-3 ${b.listened ? "text-muted-foreground" : "text-[hsl(var(--blue-accent))]"}`} fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-app">{b.date}</p>
                      <p className="text-[11px] text-muted-foreground">{b.length}</p>
                    </div>
                    {!b.listened && (
                      <span className="text-[10px] font-medium text-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))] rounded-full px-2 py-0.5">New</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-primary-app mb-4">Listening History</h3>
              <div className="space-y-1">
                {recentBriefings.map((b) => (
                  <button
                    key={b.date}
                    onClick={() => navigate("/player/today")}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                  >
                    <Play className="h-4 w-4 text-muted-foreground" fill="currentColor" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-app">{b.date}</p>
                      <p className="text-[11px] text-muted-foreground">{b.length} · {b.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-[hsl(var(--blue-accent))]" />
                <h3 className="text-sm font-medium text-primary-app">This Month</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Listened", value: "26/30" },
                  { label: "Avg Duration", value: "8.2m" },
                  { label: "Sections Skipped", value: "12%" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-semibold text-primary-app">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {[
              { label: "Interests & Topics", desc: "Manage what's in your briefing", icon: Sparkles },
              { label: "Delivery & Timezone", desc: "When and how you get your briefing", icon: Clock },
              { label: "Voice & Tone", desc: "Customize the audio experience", icon: Mic },
              { label: "Connections", desc: "Gmail, Calendar, RSS feeds", icon: Bell },
              { label: "Subscription", desc: "Free plan · Upgrade to Premium", icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full rounded-xl border border-border bg-card px-4 py-3.5 flex items-center gap-3 hover:bg-accent transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-app">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}

            <div className="pt-4 border-t border-border">
              <button className="w-full rounded-xl border border-destructive/20 px-4 py-3 flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
