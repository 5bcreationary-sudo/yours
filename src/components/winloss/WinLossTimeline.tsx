import { useState } from "react";

const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const winData = [18, 22, 20, 25, 28, 24, 30, 26];
const lossData = [12, 14, 11, 13, 16, 12, 14, 10];

export function WinLossTimeline() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...winData, ...lossData);
  const chartH = 160;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Win / Loss Over Time</h3>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--urgency-low))]" />Wins</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/60" />Losses</span>
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: chartH }}>
        {months.map((m, i) => {
          const wH = (winData[i] / maxVal) * chartH * 0.85;
          const lH = (lossData[i] / maxVal) * chartH * 0.85;
          return (
            <div
              key={m}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group relative"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {hoveredIdx === i && (
                <div className="absolute -top-10 bg-foreground text-background text-[10px] font-medium rounded-md px-2 py-1 whitespace-nowrap z-10">
                  {winData[i]}W / {lossData[i]}L
                </div>
              )}
              <div className="w-full flex gap-0.5 items-end justify-center">
                <div
                  className="w-[40%] rounded-t-sm bg-[hsl(var(--urgency-low))] group-hover:opacity-80 transition-opacity"
                  style={{ height: wH }}
                />
                <div
                  className="w-[40%] rounded-t-sm bg-destructive/50 group-hover:opacity-80 transition-opacity"
                  style={{ height: lH }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {months.map((m) => (
          <div key={m} className="flex-1 text-center text-[10px] text-muted-foreground">{m}</div>
        ))}
      </div>
    </div>
  );
}
