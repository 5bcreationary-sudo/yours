import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Sparkle } from "./Sparkle";

type Msg = { from: "agent" | "user"; text: string };

const SCRIPT: Msg[] = [
  { from: "agent", text: "Hi! I'm Holly, your AI guide. What brings you to handhold today?" },
  { from: "user", text: "I want to see how the agents work." },
  { from: "agent", text: "Great — I can give you a quick walkthrough right here." },
  { from: "agent", text: "We deploy agents across your funnel: inbound Q&A, demos, and onboarding." },
  { from: "user", text: "Can it sync with my CRM?" },
  { from: "agent", text: "Yes — we integrate with most popular CRMs out of the box." },
  { from: "agent", text: "Want me to set up your free account so you can try it?" },
];

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shown, setShown] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShown([]);
      setTyping(false);
      return;
    }
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled || i >= SCRIPT.length) {
        setTyping(false);
        return;
      }
      setTyping(true);
      window.setTimeout(() => {
        if (cancelled) return;
        setShown((s) => [...s, SCRIPT[i]]);
        setTyping(false);
        i += 1;
        window.setTimeout(tick, 700);
      }, 900);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center text-[hsl(48,95%,65%)]">
              <Sparkle className="h-3.5 w-3.5" />
            </span>
            <span className="text-[15px] font-semibold">Holly · Demo agent</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close demo"
            className="h-8 w-8 rounded-full hover:bg-black/5 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="px-6 py-6 h-[420px] overflow-y-auto bg-gradient-to-b from-[hsl(48,90%,96%)] to-white space-y-3"
        >
          {shown.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed animate-fade-in ${
                m.from === "agent"
                  ? "bg-white border border-black/5 text-foreground rounded-tl-md"
                  : "bg-foreground text-background ml-auto rounded-tr-md"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="bg-white border border-black/5 rounded-2xl rounded-tl-md w-16 px-4 py-3 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-pulse-soft" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-pulse-soft [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-pulse-soft [animation-delay:300ms]" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-black/5 flex gap-2">
          <input
            placeholder="Type a reply..."
            className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-[14px] outline-none focus:border-foreground transition-colors"
          />
          <button className="rounded-full bg-foreground text-background px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
