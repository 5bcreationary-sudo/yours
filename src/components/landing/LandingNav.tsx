import { useNavigate } from "react-router-dom";
import { HugoMark } from "@/components/HugoMark";

export function LandingNav() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 rounded-full border border-border/60 bg-card/70 backdrop-blur-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] px-2.5 py-2">
        <div className="flex items-center gap-2 px-3">
          <HugoMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-primary-app">Hugo</span>
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <a href="#features" className="text-[14px] text-muted-foreground hover:text-primary-app transition-colors px-3.5 py-1.5 rounded-full hover:bg-accent">Features</a>
        <a href="#pricing" className="text-[14px] text-muted-foreground hover:text-primary-app transition-colors px-3.5 py-1.5 rounded-full hover:bg-accent">Pricing</a>
        <a href="#" className="text-[14px] text-muted-foreground hover:text-primary-app transition-colors px-3.5 py-1.5 rounded-full hover:bg-accent">About</a>
        <a href="#" className="text-[14px] text-muted-foreground hover:text-primary-app transition-colors px-3.5 py-1.5 rounded-full hover:bg-accent">Blog</a>
        <a href="#" className="text-[14px] text-muted-foreground hover:text-primary-app transition-colors px-3.5 py-1.5 rounded-full hover:bg-accent">Contact</a>
        <div className="h-4 w-px bg-border mx-1" />
        <a
          href="#demo"
          className="rounded-full border border-border px-5 py-2 text-[14px] font-medium text-foreground whitespace-nowrap hover:bg-accent transition-all"
        >
          Book a 1:1 Demo
        </a>
        <button
          onClick={() => navigate("/chat")}
          className="rounded-full bg-foreground text-background px-5 py-2 text-[14px] font-medium whitespace-nowrap shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] hover:opacity-90 transition-all"
        >
          Get&nbsp;Started
        </button>
      </nav>
    </div>
  );
}
