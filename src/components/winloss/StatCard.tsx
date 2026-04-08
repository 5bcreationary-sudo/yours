import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, MessageCircle, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatFork } from "@/hooks/use-chat-fork";

export interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  accent?: boolean;
  detail?: string;
}

export function StatCard({ label, value, sub, trend, trendValue, accent, detail }: StatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { forkToChat } = useChatFork();

  const defaultDetail = `The ${label.toLowerCase()} is currently ${value}. ${sub}. ${trend === "up" ? "This is trending positively." : trend === "down" ? "This needs attention." : ""}`;
  const fullDetail = detail || defaultDetail;

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm group ${
          accent ? "border-[hsl(var(--blue-accent)/0.3)] bg-[hsl(var(--blue-accent-light))]" : "border-border bg-card hover:border-[hsl(var(--blue-accent)/0.2)]"
        }`}
      >
        <div className="flex items-start justify-between">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>
        <div className="flex items-end gap-2 mt-1.5">
          <p className="text-2xl font-semibold text-primary-app tracking-tight">{value}</p>
          {trend && trendValue && (
            <span className={`flex items-center gap-0.5 text-[11px] font-medium mb-1 ${
              trend === "up" ? "text-[hsl(var(--urgency-low))]" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
              onClick={() => setExpanded(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-card border-l border-border z-50 p-6 overflow-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary-app tracking-tight">{label}</h3>
                <button onClick={() => setExpanded(false)} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className={`rounded-xl border p-4 mb-4 ${accent ? "border-[hsl(var(--blue-accent)/0.3)] bg-[hsl(var(--blue-accent-light))]" : "border-border bg-accent/30"}`}>
                <p className="text-3xl font-semibold text-primary-app tracking-tight">{value}</p>
                {trend && trendValue && (
                  <span className={`flex items-center gap-0.5 text-sm font-medium mt-1 ${
                    trend === "up" ? "text-[hsl(var(--urgency-low))]" : trend === "down" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {trend === "up" ? <TrendingUp className="h-4 w-4" /> : trend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    {trendValue} vs last period
                  </span>
                )}
                <p className="text-sm text-muted-foreground mt-1">{sub}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
                <p className="text-sm text-primary-app leading-relaxed">{fullDetail}</p>
              </div>

              <button
                onClick={() => {
                  setExpanded(false);
                  forkToChat(`Tell me more about our ${label.toLowerCase()}. Current value: ${value}. ${sub}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Ask Hugo about this
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
