import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugoMark } from "@/components/HugoMark";

const thinkingSteps = [
  { label: "Searching Gong call transcripts…", source: "Gong" },
  { label: "Analyzing CRM deal records…", source: "HubSpot" },
  { label: "Scanning competitor pricing pages…", source: "Web Intel" },
  { label: "Cross-referencing win/loss data…", source: "Internal DB" },
  { label: "Synthesizing insights…", source: "Hugo AI" },
];

export function ThinkingAnimation() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % thinkingSteps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const currentStep = thinkingSteps[stepIndex];
  const visibleSources = thinkingSteps.slice(0, stepIndex + 1);

  return (
    <div className="flex gap-3">
      {/* Pulsing avatar */}
      <div className="relative shrink-0 mt-0.5">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <HugoMark size={20} />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full border border-foreground/10"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Current thinking step */}
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            {currentStep.label}
          </motion.p>
        </AnimatePresence>

        {/* Source pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {visibleSources.map((step, i) => (
            <motion.span
              key={step.source}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <motion.span
                className="h-1 w-1 rounded-full bg-foreground/30"
                animate={
                  i === stepIndex
                    ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }
                    : { opacity: 0.3 }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {step.source}
            </motion.span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-[2px] w-full max-w-[200px] bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground/20 rounded-full"
            animate={{
              width: ["0%", "100%"],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}
