import { cn } from "@/lib/utils";

interface HugoScoreProps {
  score: number;
  size?: "sm" | "md";
  className?: string;
}

export function HugoScore({ score, size = "md", className }: HugoScoreProps) {
  const radius = size === "sm" ? 18 : 26;
  const stroke = size === "sm" ? 2.5 : 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="hsl(var(--text-primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className={cn("absolute font-medium text-primary-app", size === "sm" ? "text-2xs" : "text-xs")}>
        {score}
      </span>
    </div>
  );
}
