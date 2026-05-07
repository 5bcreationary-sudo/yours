import { useNavigate } from "react-router-dom";
import { YoursLogo } from "@/components/YoursLogo";

interface Props {
  /** Where the "Get started" CTA points — caller decides based on auth state. */
  getStartedHref: string;
}

const ANCHORS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#start", label: "Get started" },
];

export function LandingNav({ getStartedHref }: Props) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl">
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/70 backdrop-blur-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.03)] px-2 py-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-accent/50 transition-colors"
          aria-label="Yours home"
        >
          <YoursLogo size={36} />
        </button>

        <div className="hidden md:block h-4 w-px bg-border mx-1" />

        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="text-[14px] px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors whitespace-nowrap"
            >
              {a.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block h-4 w-px bg-border mx-1" />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-full border border-border bg-background px-4 py-1.5 text-[14px] font-medium text-foreground whitespace-nowrap hover:bg-accent transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => navigate(getStartedHref)}
            className="rounded-full bg-foreground text-background px-4 py-1.5 text-[14px] font-medium whitespace-nowrap shadow-sm hover:opacity-90 transition-opacity"
          >
            Get started
          </button>
        </div>
      </div>
    </nav>
  );
}
