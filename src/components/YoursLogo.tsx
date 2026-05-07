import { cn } from "@/lib/utils";

interface YoursLogoProps {
  size?: number;
  className?: string;
}

export function YoursLogo({ size = 56, className }: YoursLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Yours logo"
      width={size}
      height={size * 0.65}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: "auto" }}
    />
  );
}
