import { useState } from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "How long does it take to set up?",
    a: "Most teams are live within a day. Connect your knowledge base, point us at your product, and our agents start handling traffic immediately.",
  },
  {
    q: "How do my agents stay up to date?",
    a: "Agents continuously sync with your docs, product, and CRM. Any update to your sources is reflected in conversations in minutes.",
  },
  {
    q: "How are the sessions personalised?",
    a: "Each session adapts to the visitor's role, intent, and prior context — surfaced from your CRM and enrichment providers.",
  },
  {
    q: "What languages does Handhold support?",
    a: "Out of the box we support 30+ languages. Conversations and demos are localised automatically based on the visitor.",
  },
  {
    q: "What kind of analytics are available?",
    a: "Full transcripts, intent signals, qualification scores, and revenue-attributed outcomes — exportable to your warehouse and CRM.",
  },
  {
    q: "Is the agent able to show my actual product interface?",
    a: "Yes. Agents can drive your live product or a sandbox replica to give visitors a true 1:1 walkthrough.",
  },
];

export function HandholdFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-0">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-black/10">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-6 md:py-8 text-left group"
              aria-expanded={isOpen}
            >
              <span className="text-[22px] md:text-[28px] font-normal tracking-[-0.01em] text-foreground">
                {item.q}
              </span>
              <span
                className={`shrink-0 h-10 w-10 md:h-11 md:w-11 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-all ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <Plus className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? "max-h-48 pb-6" : "max-h-0"
              }`}
            >
              <p className="text-[16px] text-muted-foreground leading-relaxed max-w-3xl">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
