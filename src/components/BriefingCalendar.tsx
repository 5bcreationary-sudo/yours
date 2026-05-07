import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { BriefingListItem } from "@/types/database";

interface Props {
  briefings: BriefingListItem[];
  isLoading?: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isoLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function BriefingCalendar({ briefings, isLoading }: Props) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(today));

  // Map iso date -> briefing for O(1) lookup.
  const byDate = useMemo(() => {
    const m = new Map<string, BriefingListItem>();
    for (const b of briefings) m.set(b.date, b);
    return m;
  }, [briefings]);

  // Build a 6-row grid (42 cells) starting from the Sunday before/at the
  // first of the month so weekdays line up consistently.
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startSun = new Date(first);
    startSun.setDate(first.getDate() - first.getDay());
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      out.push(new Date(startSun.getFullYear(), startSun.getMonth(), startSun.getDate() + i));
    }
    return out;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cursorMonth = cursor.getMonth();
  const canGoNext = cursor.getFullYear() < today.getFullYear() || cursor.getMonth() < today.getMonth();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => canGoNext && setCursor((c) => addMonths(c, 1))}
            disabled={!canGoNext}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="h-6 flex items-center justify-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursorMonth;
          const iso = isoLocalDate(d);
          const briefing = byDate.get(iso);
          const isToday = isSameDay(d, today);
          const isReady = briefing?.status === "ready";
          const isGenerating = briefing?.status === "generating";
          const isFailed = briefing?.status === "failed";

          const baseCls = `relative h-11 rounded-lg flex flex-col items-center justify-center text-xs transition-colors`;
          const interactive = isReady ? "hover:bg-accent/70 cursor-pointer" : briefing ? "" : "cursor-default";
          const muted = !inMonth ? "text-muted-foreground/40" : "text-foreground";
          const todayRing = isToday ? "ring-1 ring-foreground/40" : "";

          const content = (
            <>
              <span className={`text-[13px] tabular-nums ${muted} ${isToday ? "font-semibold" : "font-medium"}`}>
                {d.getDate()}
              </span>
              {/* Status indicator */}
              <span className="mt-0.5 h-1.5 flex items-center justify-center">
                {isReady && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-1.5 w-1.5 rounded-full bg-foreground"
                  />
                )}
                {isGenerating && (
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse" />
                )}
                {isFailed && (
                  <span className="text-[8px] leading-none text-muted-foreground">×</span>
                )}
              </span>
            </>
          );

          if (isReady && briefing) {
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => navigate(`/b/${briefing.id}`)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`${baseCls} ${interactive} ${todayRing}`}
              >
                {content}
              </motion.button>
            );
          }

          return (
            <div
              key={i}
              className={`${baseCls} ${interactive} ${todayRing}`}
              aria-label={iso}
            >
              {content}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading briefings…
        </div>
      )}
    </div>
  );
}
