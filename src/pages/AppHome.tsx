import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Play, Settings, Clock, Calendar, Headphones, ChevronRight, LogOut, Zap } from "lucide-react";

// Mock briefing history
const MOCK_HISTORY = [
  { id: "1", date: "2026-04-12", status: "ready" as const, length: 8, sections: 6 },
  { id: "2", date: "2026-04-11", status: "ready" as const, length: 7, sections: 5 },
  { id: "3", date: "2026-04-10", status: "ready" as const, length: 9, sections: 6 },
];

export default function AppHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const todayBriefing = MOCK_HISTORY[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <span className="text-base font-semibold tracking-tight">Yours</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        {/* Today's briefing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
              <p className="text-white text-lg font-bold mt-1">Ready to listen</p>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {todayBriefing.length} min
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-xs mb-5">
            <Calendar className="h-3.5 w-3.5" />
            {todayBriefing.sections} sections · Weather, Calendar, News, and more
          </div>
          <Button
            onClick={() => navigate(`/b/${todayBriefing.id}`)}
            className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-neutral-900 font-semibold"
          >
            <Play className="h-4 w-4 mr-2" fill="currentColor" /> Play briefing
          </Button>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <button
            onClick={() => navigate("/b/demo")}
            className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow text-left"
          >
            <Zap className="h-5 w-5 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium">DeepCast</p>
            <p className="text-xs text-muted-foreground">Custom episode on any topic</p>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow text-left"
          >
            <Headphones className="h-5 w-5 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium">Preferences</p>
            <p className="text-xs text-muted-foreground">Adjust your briefing</p>
          </button>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold mb-3">Recent briefings</h2>
          <div className="space-y-2">
            {MOCK_HISTORY.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`/b/${b.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.length} min · {b.sections} sections</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
