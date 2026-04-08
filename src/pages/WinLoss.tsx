import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, X, Calendar, BarChart3, Users, FileText, CloudUpload, LayoutDashboard } from "lucide-react";
import { StatCard } from "@/components/winloss/StatCard";
import { CompetitorBreakdown } from "@/components/winloss/CompetitorBreakdown";
import { LossClusters } from "@/components/winloss/LossClusters";
import { TeamBreakdown } from "@/components/winloss/TeamBreakdown";
import { WinLossTimeline } from "@/components/winloss/WinLossTimeline";
import { DealLog } from "@/components/winloss/DealLog";
import { UploadSync } from "@/components/winloss/UploadSync";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "competitors", label: "Competitors", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
  { id: "deals", label: "Deal Log", icon: FileText },
  { id: "upload", label: "Upload / Sync", icon: CloudUpload },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default function WinLoss() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showLogDeal, setShowLogDeal] = useState(false);

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive win/loss analysis across 142 deals · Last updated 2h ago</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogDeal(true)}
              className="flex items-center gap-1.5 rounded-[10px] bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Log Deal
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary-app"
                  : "text-muted-foreground hover:text-primary-app"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[hsl(var(--blue-accent))]"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "competitors" && <CompetitorsTab />}
            {activeTab === "team" && <TeamTab />}
            {activeTab === "deals" && <DealLog />}
            {activeTab === "upload" && <UploadSync />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Log Deal Modal */}
      <AnimatePresence>
        {showLogDeal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={() => setShowLogDeal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-6"
            >
              <div className="bg-card rounded-2xl border border-border w-full max-w-[480px] p-6 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-primary-app tracking-tight">Log Deal</h2>
                  <button onClick={() => setShowLogDeal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app">
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Company name</label>
                    <input className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. TechFlow Inc" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Outcome</label>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-[10px] bg-[hsl(var(--urgency-low)/0.1)] text-[hsl(var(--urgency-low))] py-2 text-sm font-medium border-2 border-[hsl(var(--urgency-low))]">Won</button>
                      <button className="flex-1 rounded-[10px] bg-accent text-muted-foreground py-2 text-sm font-medium border-2 border-transparent">Lost</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Competitor</label>
                    <select className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring">
                      <option>Select competitor</option>
                      <option>Acme Corp</option>
                      <option>Rival.io</option>
                      <option>BetaCo</option>
                      <option>Zenith</option>
                      <option>DataPulse</option>
                      <option>NovaCRM</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Deal value</label>
                    <input className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="$0" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Win/Loss reason</label>
                    <select className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring">
                      <option>Select reason</option>
                      <option>Price</option>
                      <option>Feature gap</option>
                      <option>Onboarding speed</option>
                      <option>Relationship / trust</option>
                      <option>Timing</option>
                      <option>Integration</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Notes</label>
                    <textarea className="w-full h-[80px] rounded-[10px] bg-accent px-4 py-2.5 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Any additional context Hugo should know..." />
                  </div>
                  <button className="w-full rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity mt-1">Save Deal</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Tab views ---- */

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Overall Win Rate" value="64%" sub="vs 61% last month" trend="up" trendValue="+3%" accent />
        <StatCard label="Competitive Win Rate" value="58%" sub="Deals with named competitor" trend="up" trendValue="+2%" />
        <StatCard label="Avg Deal Won" value="$38K" sub="vs $34K lost" trend="up" trendValue="+$4K" />
        <StatCard label="Total Deals" value="142" sub="76 won · 66 lost" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Deals This Week" value="12" sub="8 won · 4 lost" trend="up" trendValue="+3" />
        <StatCard label="Top Loss Competitor" value="Acme Corp" sub="17 losses this quarter" trend="down" trendValue="62% WR" />
        <StatCard label="Stale Playbooks" value="3" sub="Not updated in 30+ days" />
        <StatCard label="Intel Since Login" value="14" sub="5 high · 6 med · 3 low" />
      </div>

      {/* Timeline chart */}
      <WinLossTimeline />

      {/* Loss clusters preview */}
      <LossClusters />
    </div>
  );
}

function CompetitorsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Competitors Tracked" value="6" sub="Active in deals" />
        <StatCard label="Best Win Rate" value="DataPulse" sub="79% · 14 deals" trend="up" trendValue="+8%" />
        <StatCard label="Worst Win Rate" value="NovaCRM" sub="44% · 9 deals" trend="down" trendValue="-3%" />
        <StatCard label="Biggest Revenue Lost" value="Zenith" sub="$376K lost this quarter" />
      </div>
      <CompetitorBreakdown />
      <LossClusters />
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Team Size" value="6" sub="Active reps" />
        <StatCard label="Top Performer" value="Lisa Park" sub="77% win rate" trend="up" trendValue="+5%" accent />
        <StatCard label="Most Active" value="Sarah Chen" sub="28 deals logged" />
        <StatCard label="Needs Coaching" value="Ryan Patel" sub="42% win rate" trend="down" trendValue="-8%" />
      </div>
      <TeamBreakdown />
    </div>
  );
}
