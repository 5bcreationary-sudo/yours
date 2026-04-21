import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HandholdMark, Sparkle } from "./Sparkle";

export function HandholdNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-xl border-b border-black/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          aria-label="handhold home"
        >
          <HandholdMark className="h-3.5 w-7 text-foreground" />
          <span className="text-[19px] font-semibold tracking-tight lowercase">handhold</span>
        </button>

        <nav className="flex items-center gap-6 md:gap-8">
          <button
            onClick={() => navigate("/signup")}
            className="text-[15px] text-foreground hover:opacity-70 transition-opacity"
          >
            Get started
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-[15px] text-foreground hover:opacity-70 transition-opacity"
          >
            Sign in
          </button>
          <button
            aria-label="Open menu"
            className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center text-[hsl(48,95%,65%)] hover:scale-105 transition-transform"
          >
            <Sparkle className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}
