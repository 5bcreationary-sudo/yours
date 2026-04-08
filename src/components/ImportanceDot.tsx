import { cn } from "@/lib/utils";

type Importance = "high" | "medium" | "low";

const dotStyles: Record<Importance, string> = {
  high: "bg-destructive",
  medium: "bg-[hsl(var(--urgency-medium))]",
  low: "bg-muted-foreground",
};

const labelStyles: Record<Importance, string> = {
  high: "bg-destructive/8 text-destructive",
  medium: "bg-[hsl(var(--urgency-medium)/0.08)] text-[hsl(var(--urgency-medium))]",
  low: "bg-muted text-muted-foreground",
};

export function ImportanceDot({ level, className }: { level: Importance; className?: string }) {
  return (
    <div className={cn("w-1 shrink-0 self-stretch rounded-full", dotStyles[level], className)} />
  );
}

export function ImportanceBadge({ level, className }: { level: Importance; className?: string }) {
  const labels: Record<Importance, string> = { high: "Urgent", medium: "Important", low: "FYI" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide", labelStyles[level], className)}>
      {labels[level]}
    </span>
  );
}
