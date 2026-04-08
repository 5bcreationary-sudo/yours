import { cn } from "@/lib/utils";

type UrgencyLevel = "high" | "medium" | "low";

const labels: Record<UrgencyLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const styles: Record<UrgencyLevel, string> = {
  high: "bg-[hsl(0_72%_55%/0.08)] text-[hsl(0_72%_45%)]",
  medium: "bg-[hsl(35_90%_52%/0.08)] text-[hsl(35_90%_38%)]",
  low: "bg-[hsl(152_60%_42%/0.08)] text-[hsl(152_60%_32%)]",
};

export function UrgencyBadge({ level, className }: { level: UrgencyLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[10px] py-[2px] text-2xs font-medium tracking-wide",
        styles[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
}
