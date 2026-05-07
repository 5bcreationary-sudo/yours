import { Briefcase, Building2, Coffee, GraduationCap, Laptop, Mic, Palette, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Persona {
  icon: LucideIcon;
  label: string;
}

// Generic personas. Yours.fm is pre-launch, so no real press logos or named
// testimonials yet — these are anonymized role pills that suggest a diverse
// listener base. Replace with real names/companies once available.
const PERSONAS: Persona[] = [
  { icon: Briefcase, label: "Product Manager · SF" },
  { icon: Rocket, label: "Founder · NYC" },
  { icon: GraduationCap, label: "PhD Student · Boston" },
  { icon: Palette, label: "Designer · Austin" },
  { icon: Laptop, label: "Engineer · Seattle" },
  { icon: Mic, label: "Podcaster · LA" },
  { icon: Coffee, label: "Operator · Chicago" },
  { icon: Building2, label: "Investor · Miami" },
];

function Track({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-3 shrink-0 px-1.5" aria-hidden={ariaHidden}>
      {PERSONAS.map((p, i) => {
        const Icon = p.icon;
        return (
          <div
            key={`${p.label}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-sm whitespace-nowrap"
          >
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-secondary">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <span className="text-[13px] font-medium">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PressBar() {
  return (
    <section className="py-14 md:py-20 px-6 border-t border-border/60">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] mb-6">
          Loved by early listeners
        </p>

        <div className="relative overflow-hidden">
          {/* Edge fades to mask the loop seam */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />

          <div className="flex w-max animate-marquee">
            <Track />
            <Track ariaHidden />
          </div>
        </div>
      </div>
    </section>
  );
}
