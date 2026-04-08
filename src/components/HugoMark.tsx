import { cn } from "@/lib/utils";
import telescopeLogo from "@/assets/hugo-telescope.png";

interface HugoMarkProps {
  size?: number;
  className?: string;
}

export function HugoMark({ size = 24, className }: HugoMarkProps) {
  return (
    <img
      src={telescopeLogo}
      alt="Hugo"
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
