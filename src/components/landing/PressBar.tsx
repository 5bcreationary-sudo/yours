import { motion } from "framer-motion";
import { User } from "lucide-react";

const testimonials = [
  { name: "Sarah K.", role: "PM at Stripe", quote: "Replaced my morning doomscroll entirely." },
  { name: "Marcus L.", role: "Founder, SeedAI", quote: "Like having a personal news anchor who knows me." },
  { name: "Priya M.", role: "VP Eng at Notion", quote: "The commute game-changer I didn't know I needed." },
];

const doubled = [...testimonials, ...testimonials, ...testimonials];

export function PressBar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      className="py-14 overflow-hidden"
    >
      <p className="text-center text-xs font-medium tracking-widest uppercase text-muted-foreground mb-8">
        Loved by early users
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <motion.div
          className="flex items-center gap-6 whitespace-nowrap"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="flex items-center gap-3 select-none rounded-xl border border-border bg-card px-5 py-3 min-w-[280px]"
            >
              <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-primary-app font-medium truncate">"{t.quote}"</p>
                <p className="text-[10px] text-muted-foreground">{t.name} · {t.role}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
