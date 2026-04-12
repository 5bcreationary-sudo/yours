import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Check, Sun, Coffee, Briefcase, Moon, Car } from "lucide-react";
import { INTEREST_PACKAGES, RSS_PRESETS } from "@/types/database";
import { toast } from "sonner";

const STEPS = [
  { title: "About you", subtitle: "Let's personalize your briefing" },
  { title: "Briefing style", subtitle: "How should your briefing feel?" },
  { title: "Wake-up time", subtitle: "When do you want your briefing?" },
  { title: "Interests", subtitle: "What matters to you?" },
  { title: "News sources", subtitle: "Pick your preferred sources" },
  { title: "Evening mode", subtitle: "Optional: wind-down briefing" },
];

const TONES = [
  { id: "upbeat", label: "Upbeat", desc: "Energetic and positive", icon: "☀️" },
  { id: "calm", label: "Calm", desc: "Relaxed and measured", icon: "🧘" },
  { id: "professional", label: "Professional", desc: "Crisp and efficient", icon: "💼" },
];

const MODES = [
  { id: "morning", label: "Morning Routine", desc: "Full briefing while getting ready", icon: Sun },
  { id: "commute", label: "Commute Mode", desc: "Optimized for driving/transit", icon: Car },
  { id: "executive", label: "Executive Brief", desc: "Just the essentials, fast", icon: Briefcase },
];

const LENGTHS = [
  { min: 3, label: "3 min", desc: "Quick headlines" },
  { min: 8, label: "8 min", desc: "Full briefing" },
  { min: 12, label: "12 min", desc: "Deep dive" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    full_name: "",
    morning_goal: "",
    tone: "upbeat",
    briefing_mode: "morning",
    preferred_length_minutes: 8,
    delivery_time: "07:00",
    freeform_interests: "",
    selected_packages: [] as string[],
    selected_rss: [] as string[],
    custom_rss: "",
    evening_preference: false,
  });

  const update = (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value }));

  const togglePackage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selected_packages: prev.selected_packages.includes(id)
        ? prev.selected_packages.filter(p => p !== id)
        : [...prev.selected_packages, id],
    }));
  };

  const toggleRSS = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selected_rss: prev.selected_rss.includes(id)
        ? prev.selected_rss.filter(r => r !== id)
        : [...prev.selected_rss, id],
    }));
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const finish = async () => {
    await updateProfile({
      full_name: formData.full_name,
      tone: formData.tone as "upbeat" | "calm" | "professional",
      briefing_mode: formData.briefing_mode as "morning" | "commute" | "executive",
      preferred_length_minutes: formData.preferred_length_minutes,
      delivery_time: formData.delivery_time,
      evening_preference: formData.evening_preference,
      onboarding_complete: true,
    });
    toast.success("You're all set!");
    navigate("/app");
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-secondary">
        <motion.div className="h-full bg-foreground" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => step > 0 && setStep(step - 1)} className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? "invisible" : ""}`}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">{step + 1} of {STEPS.length}</span>
            <button onClick={() => step < STEPS.length - 1 && next()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skip</button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-xl font-bold tracking-tight mb-1">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{STEPS[step].subtitle}</p>

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">What should we call you?</label>
                    <Input value={formData.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Your name" className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">What's your morning goal?</label>
                    <Textarea value={formData.morning_goal} onChange={e => update("morning_goal", e.target.value)} placeholder="e.g. Stay on top of AI news and start my day prepared" className="rounded-xl resize-none" rows={3} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Briefing mode</label>
                    <div className="space-y-2">
                      {MODES.map(m => (
                        <button key={m.id} onClick={() => update("briefing_mode", m.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${formData.briefing_mode === m.id ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                          <m.icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                          <div><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
                          {formData.briefing_mode === m.id && <Check className="h-4 w-4 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TONES.map(t => (
                        <button key={t.id} onClick={() => update("tone", t.id)} className={`p-3 rounded-xl border text-center transition-all ${formData.tone === t.id ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                          <span className="text-xl mb-1 block">{t.icon}</span>
                          <p className="text-xs font-medium">{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Length</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LENGTHS.map(l => (
                        <button key={l.min} onClick={() => update("preferred_length_minutes", l.min)} className={`p-3 rounded-xl border text-center transition-all ${formData.preferred_length_minutes === l.min ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                          <p className="text-sm font-semibold">{l.label}</p>
                          <p className="text-xs text-muted-foreground">{l.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="text-sm font-medium mb-1.5 block">Delivery time</label>
                  <Input type="time" value={formData.delivery_time} onChange={e => update("delivery_time", e.target.value)} className="h-11 rounded-xl" />
                  <p className="text-xs text-muted-foreground">We'll have your briefing ready by this time every morning.</p>
                  <div className="mt-6 p-4 rounded-xl bg-secondary">
                    <p className="text-sm font-medium mb-1">Detected timezone</p>
                    <p className="text-sm text-muted-foreground">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tell us what you're interested in</label>
                    <Textarea value={formData.freeform_interests} onChange={e => update("freeform_interests", e.target.value)} placeholder="e.g. AI startups in SF, 49ers scores and trades, Foo Fighters and similar rock, job openings for product manager..." className="rounded-xl resize-none" rows={4} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Or pick starter packages</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INTEREST_PACKAGES.map(pkg => (
                        <button key={pkg.id} onClick={() => togglePackage(pkg.id)} className={`p-3 rounded-xl border text-left transition-all ${formData.selected_packages.includes(pkg.id) ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                          <span className="text-lg">{pkg.icon}</span>
                          <p className="text-sm font-medium mt-1">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">{pkg.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {RSS_PRESETS.map(rss => (
                      <button key={rss.id} onClick={() => toggleRSS(rss.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.selected_rss.includes(rss.id) ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                        <span className="text-base">{rss.icon}</span>
                        <div className="flex-1"><p className="text-sm font-medium">{rss.name}</p><p className="text-xs text-muted-foreground">{rss.category}</p></div>
                        {formData.selected_rss.includes(rss.id) && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Add custom RSS feed</label>
                    <Input value={formData.custom_rss} onChange={e => update("custom_rss", e.target.value)} placeholder="https://example.com/feed.xml" className="h-11 rounded-xl" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-border">
                    <div className="flex items-start gap-3">
                      <Moon className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium mb-1">Evening wind-down briefing</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">Get a lighter recap of the day — what happened, what's tomorrow, and a thought to end on.</p>
                        <div className="flex gap-2">
                          <Button variant={formData.evening_preference ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => update("evening_preference", true)}>Yes, I'd like that</Button>
                          <Button variant={!formData.evening_preference ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => update("evening_preference", false)}>Not now</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">This feature is coming soon. Your preference will be saved.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <Button onClick={next} className="w-full h-11 rounded-xl" size="lg">
              {step === STEPS.length - 1 ? "Finish setup" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
