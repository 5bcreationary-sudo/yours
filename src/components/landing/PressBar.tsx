import { motion } from "framer-motion";
import { Building2, GraduationCap } from "lucide-react";

const items = [
  { name: "Google", type: "company" },
  { name: "Meta", type: "company" },
  { name: "Stripe", type: "company" },
  { name: "Shopify", type: "company" },
  { name: "Notion", type: "company" },
  { name: "Figma", type: "company" },
  { name: "Stanford", type: "school" },
  { name: "MIT", type: "school" },
  { name: "Harvard", type: "school" },
  { name: "OpenAI", type: "company" },
  { name: "Salesforce", type: "company" },
  { name: "HubSpot", type: "company" },
  { name: "Slack", type: "company" },
  { name: "Datadog", type: "company" },
  { name: "Snowflake", type: "company" },
  { name: "Vercel", type: "company" },
];

const doubled = [...items, ...items];

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
        Used by people at
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <motion.div
          className="flex items-center gap-10 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center gap-2 select-none"
            >
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                {item.type === "school" ? (
                  <GraduationCap className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                )}
              </div>
              <span className="text-base font-semibold tracking-tight text-muted-foreground/40">
                {item.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
