import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Current input value. When this becomes truthy, the line transitions
   *  through "thinking" → "response". Empty/null reverts to idle. */
  input: string | null | undefined;
  /** Function that produces the response copy given the current input.
   *  Called with the input that triggered the response (post-debounce). */
  format: (input: string) => string;
  /** Milliseconds to spend in the "thinking" state before showing the response. */
  thinkingMs?: number;
  /** Optional className for outer container. */
  className?: string;
}

/** Tiny reactive helper used across the onboarding wizard.
 *
 *  Lifecycle: empty → idle (no UI). On non-empty `input`, debounce briefly,
 *  then show a pulsing dot for ~thinkingMs, then crossfade to the response.
 *  Designed to make every step feel like the system is reasoning about the
 *  user's input in real time. */
export function ReactiveLine({ input, format, thinkingMs = 700, className = "" }: Props) {
  const value = (input ?? "").trim();
  const [phase, setPhase] = useState<"idle" | "thinking" | "response">("idle");
  const [responseText, setResponseText] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setPhase("idle");
      setResponseText("");
      return;
    }
    setPhase("thinking");
    const timer = window.setTimeout(() => {
      setResponseText(format(value));
      setPhase("response");
    }, thinkingMs);
    return () => window.clearTimeout(timer);
    // format is intentionally omitted so consumers can pass inline lambdas
    // without re-triggering the thinking state on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, thinkingMs]);

  return (
    <div className={`min-h-[1.5rem] ${className}`} aria-live="polite">
      <AnimatePresence mode="wait">
        {phase === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-pulse" />
            <span>…</span>
          </motion.div>
        )}
        {phase === "response" && responseText && (
          <motion.p
            key={responseText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="text-sm font-medium leading-snug"
          >
            {responseText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
