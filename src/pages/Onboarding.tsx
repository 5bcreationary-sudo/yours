import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sun,
  Briefcase,
  Moon,
  Car,
  Mail,
  Newspaper,
  Trophy,
  Cpu,
  HeartPulse,
  Building2,
  Music,
  Sparkles,
  Zap,
  Waves,
  Rss,
  MessageSquare,
  ListChecks,
  MapPin,
  LocateFixed,
  type LucideIcon,
} from "lucide-react";
import { RSS_PRESETS } from "@/types/database";
import type { UserInterest } from "@/types/database";
import { toast } from "sonner";
import { addRssSource, getInterests, upsertInterests } from "@/lib/supabase";

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/\D/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "7:00 AM";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const STEPS = [
  { title: "About you", subtitle: "Let's personalize your briefing" },
  { title: "Briefing style", subtitle: "How should your briefing feel?" },
  { title: "Wake-up time", subtitle: "When do you want your briefing?" },
  { title: "Interests", subtitle: "What matters to you?" },
  { title: "News sources", subtitle: "Pick your preferred sources" },
  { title: "Evening mode", subtitle: "Optional: wind-down briefing" },
];

type Tone = {
  id: "upbeat" | "calm" | "professional";
  label: string;
  icon: LucideIcon;
  desc: string;
};

const TONES: Tone[] = [
  {
    id: "upbeat",
    label: "Upbeat",
    icon: Zap,
    desc: "Warm, energetic delivery with a motivating lift. Each section opens with momentum — the kind of voice that makes you reach for your coffee faster.",
  },
  {
    id: "calm",
    label: "Calm",
    icon: Waves,
    desc: "Measured, grounded pace like a thoughtful podcast host. Softer phrasing, longer beats between ideas. Good if you listen while stretching or winding up.",
  },
  {
    id: "professional",
    label: "Professional",
    icon: Briefcase,
    desc: "Direct, efficient, facts-first. Feels like a daily executive brief — no filler, no flourish. Every sentence earns its place.",
  },
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

type CoverageOption = { id: string; label: string; icon: LucideIcon };

const COVERAGE_OPTIONS: CoverageOption[] = [
  { id: "emails_calendar", label: "My emails & calendar", icon: Mail },
  { id: "news", label: "Latest news (CNN, Fox, NPR, etc.)", icon: Newspaper },
  { id: "sports", label: "Sports & my favorite teams", icon: Trophy },
  { id: "tech", label: "AI, tech & startups", icon: Cpu },
  { id: "health", label: "Health, fitness & wellness", icon: HeartPulse },
  { id: "work", label: "My company & job updates", icon: Building2 },
  { id: "culture", label: "Entertainment, music & culture", icon: Music },
  { id: "other", label: "Other (custom topics)", icon: Sparkles },
];

const COVERAGE_PLACEHOLDER = `e.g. I follow AI startups — Anthropic, OpenAI, Mistral, Groq. I want funding rounds, product launches, and technical research papers summarized.

I'm a 49ers fan. Scores, injury reports, trade rumors, upcoming games.

I like alt-rock — Foo Fighters, Arctic Monkeys, The Strokes. Tour dates, new releases, band news.

I'm a product manager in San Francisco looking for senior PM roles at Series B+ startups. Notable job postings and hiring trends.

Morning weather and any traffic on the 101 toward Palo Alto.`;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location_city: "",
    location_lat: null as number | null,
    location_lng: null as number | null,
    coverage: [] as string[],
    coverage_other: "",
    tone: "upbeat",
    briefing_mode: "morning",
    briefing_style: "conversational" as "straightforward" | "conversational",
    preferred_length_minutes: 8,
    delivery_time: "07:00",
    freeform_interests: "",
    selected_rss: [] as string[],
    custom_rss: "",
    evening_preference: false,
  });
  const [geoLoading, setGeoLoading] = useState(false);

  const update = (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value }));

  // Reverse-geocode lat/lng to city name using free Nominatim API.
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
        { headers: { "User-Agent": "YoursFM/1.0" }, signal: ctrl.signal },
      );
      if (!res.ok) return "";
      const data = await res.json();
      const addr = data.address ?? {};
      return addr.city || addr.town || addr.village || addr.county || "";
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
  };

  // Forward-geocode a city name to lat/lng.
  const forwardGeocode = async (query: string): Promise<{ lat: number; lng: number; city: string } | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
        { headers: { "User-Agent": "YoursFM/1.0" }, signal: ctrl.signal },
      );
      if (!res.ok) return null;
      const results = await res.json();
      if (!results.length) return null;
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), city: results[0].display_name.split(",")[0] };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = pos.coords;
      const city = await reverseGeocode(latitude, longitude);
      setFormData(prev => ({
        ...prev,
        location_lat: latitude,
        location_lng: longitude,
        location_city: city || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      }));
    } catch {
      toast.error("Could not get your location. Please enter your city manually.");
    } finally {
      setGeoLoading(false);
    }
  };

  const toggleCoverage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      coverage: prev.coverage.includes(id)
        ? prev.coverage.filter(c => c !== id)
        : [...prev.coverage, id],
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

  const openTimePicker = () => {
    const el = timeInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      // no-op: showPicker can throw if not user-gesture in some browsers
    }
    el.focus();
    el.click();
  };

  // Read-modify-write so a later step doesn't clobber earlier interest fields.
  async function saveInterestsPartial(
    userId: string,
    patch: Partial<Pick<UserInterest, "freeform_text" | "selected_packages" | "tags">>,
  ) {
    const existing = await getInterests(userId);
    await upsertInterests(userId, {
      freeform_text: patch.freeform_text !== undefined ? patch.freeform_text : existing?.freeform_text ?? null,
      selected_packages: patch.selected_packages ?? existing?.selected_packages ?? [],
      tags: patch.tags ?? existing?.tags ?? [],
    });
  }

  const coverageSummary = (): string | null => {
    const labels = COVERAGE_OPTIONS
      .filter(o => formData.coverage.includes(o.id) && o.id !== "other")
      .map(o => o.label);
    const parts = [
      labels.length ? `Cover most: ${labels.join(", ")}` : null,
      formData.coverage_other.trim() || null,
    ].filter(Boolean);
    return parts.length ? parts.join("\n") : null;
  };

  // Persist the slice owned by the current step. Throws on failure; caller advances only on resolve.
  const saveCurrentStep = async () => {
    if (!user) throw new Error("You must be signed in to continue.");
    switch (step) {
      case 0: {
        // If user typed a city but didn't use geolocation, forward-geocode it.
        let homeAddress: { lat: number; lng: number; city: string } | null = null;
        if (formData.location_lat != null && formData.location_lng != null) {
          homeAddress = { lat: formData.location_lat, lng: formData.location_lng, city: formData.location_city };
        } else if (formData.location_city.trim()) {
          const geo = await forwardGeocode(formData.location_city.trim());
          if (geo) {
            homeAddress = geo;
            setFormData(prev => ({ ...prev, location_lat: geo.lat, location_lng: geo.lng, location_city: geo.city }));
          }
        }
        // Run profile update and interests fetch in parallel — they're independent.
        const [, existing] = await Promise.all([
          updateProfile({
            full_name: formData.full_name || null,
            phone_e164: normalizePhone(formData.phone),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...(homeAddress ? { home_address: homeAddress } : {}),
          }),
          getInterests(user.id),
        ]);
        const summary = coverageSummary();
        const existingFree = existing?.freeform_text ?? "";
        // Replace any prior "Cover most: …" line; preserve step-3 prose if present.
        const withoutCoverLine = existingFree
          .split("\n\n")
          .filter(p => !p.startsWith("Cover most:") && p.trim() !== (formData.coverage_other.trim()))
          .join("\n\n");
        const merged = [summary, withoutCoverLine].filter(Boolean).join("\n\n") || null;
        await upsertInterests(user.id, {
          freeform_text: merged,
          selected_packages: existing?.selected_packages ?? [],
          tags: Array.from(new Set(formData.coverage.filter(c => c !== "other"))),
        });
        return;
      }
      case 1: {
        await updateProfile({
          tone: formData.tone as Tone["id"],
          briefing_mode: formData.briefing_mode as "morning" | "commute" | "executive",
          briefing_style: formData.briefing_style,
          preferred_length_minutes: formData.preferred_length_minutes,
        });
        return;
      }
      case 2: {
        await updateProfile({
          delivery_time: formData.delivery_time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        return;
      }
      case 3: {
        const summary = coverageSummary();
        const prose = formData.freeform_interests.trim() || null;
        const merged = [summary, prose].filter(Boolean).join("\n\n") || null;
        await saveInterestsPartial(user.id, { freeform_text: merged });
        return;
      }
      case 4: {
        const rssToAdd = RSS_PRESETS
          .filter(r => formData.selected_rss.includes(r.id))
          .map(r => ({ url: r.url, name: r.name, preset_id: r.id }));
        const custom = formData.custom_rss.trim();
        if (custom) {
          try {
            new URL(custom);
            rssToAdd.push({ url: custom, name: new URL(custom).hostname, preset_id: "custom" });
          } catch {
            toast.warning("Custom RSS URL was skipped (not a valid URL).");
          }
        }
        await Promise.all(rssToAdd.map(r => addRssSource(user.id, r)));
        return;
      }
      case 5: {
        await updateProfile({
          evening_preference: formData.evening_preference,
          onboarding_complete: true,
        });
        return;
      }
    }
  };

  const next = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timed out — check your connection and try again.")), 30000),
      );
      await Promise.race([saveCurrentStep(), timeout]);
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        toast.success("You're all set!");
        navigate("/app");
      }
    } catch (err) {
      console.error("[onboarding] save failed", err);
      const msg = err instanceof Error ? err.message : "Couldn't save — please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    if (saving) return;
    if (step < STEPS.length - 1) setStep(step + 1);
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
            <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skip</button>
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
                    <label className="text-sm font-medium mb-1.5 block">Mobile number</label>
                    <Input type="tel" inputMode="tel" autoComplete="tel" value={formData.phone} onChange={e => update("phone", e.target.value)} placeholder="+1 555 123 4567" className="h-11 rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-1.5">We'll text you a link each morning when your briefing is ready.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your location</label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.location_city}
                        onChange={e => {
                          update("location_city", e.target.value);
                          update("location_lat", null);
                          update("location_lng", null);
                        }}
                        placeholder="City or zip code"
                        className="h-11 rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl shrink-0"
                        onClick={useMyLocation}
                        disabled={geoLoading}
                        title="Use my location"
                      >
                        {geoLoading ? (
                          <LocateFixed className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">For accurate weather in your briefing.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">What do you want your daily briefing to cover most?</label>
                    <p className="text-xs text-muted-foreground mb-3">We'll use this to make every morning briefing feel personal.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {COVERAGE_OPTIONS.map(opt => {
                        const selected = formData.coverage.includes(opt.id);
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleCoverage(opt.id)}
                            className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${selected ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${selected ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
                            <span className="text-xs font-medium leading-snug">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {formData.coverage.includes("other") && (
                      <Textarea
                        value={formData.coverage_other}
                        onChange={e => update("coverage_other", e.target.value)}
                        placeholder="Tell us what else — e.g. 49ers scores, Foo Fighters news, PM job openings"
                        className="mt-3 rounded-xl resize-none"
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Briefing style</label>
                    <div className="space-y-2">
                      {([
                        { id: "straightforward" as const, label: "Straightforward", icon: ListChecks, desc: "Just the facts. Two hosts walk you through the day — clear, concise, no fluff." },
                        { id: "conversational" as const, label: "Conversational", icon: MessageSquare, desc: "Two hosts with personality. Natural reactions, follow-up questions, and genuine back-and-forth — like a real podcast." },
                      ]).map(s => (
                        <button key={s.id} onClick={() => update("briefing_style", s.id)} className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${formData.briefing_style === s.id ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                          <s.icon className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.desc}</p>
                          </div>
                          {formData.briefing_style === s.id && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    <div className="space-y-2">
                      {TONES.map(t => {
                        const Icon = t.icon;
                        const selected = formData.tone === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => update("tone", t.id)}
                            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${selected ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}
                          >
                            <Icon className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{t.label}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t.desc}</p>
                            </div>
                            {selected && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
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
                  <button
                    type="button"
                    onClick={openTimePicker}
                    className="w-full py-8 px-8 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors flex flex-col items-center justify-center"
                  >
                    <span className="text-5xl font-bold tracking-tight tabular-nums">
                      {formatTime12h(formData.delivery_time)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-2">Tap to change</span>
                  </button>
                  <input
                    ref={timeInputRef}
                    type="time"
                    value={formData.delivery_time}
                    onChange={e => update("delivery_time", e.target.value || "07:00")}
                    className="sr-only"
                    aria-label="Delivery time"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    We'll have your briefing ready by this time every morning.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-secondary">
                    <p className="text-sm font-medium mb-1">Detected timezone</p>
                    <p className="text-sm text-muted-foreground">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Tell us what you care about</label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The more detail you give, the more we can ultra-tailor your briefing. Describe the topics, people, teams, companies, or stories you want to hear about each morning — in your own words. Our AI turns this into the daily topics we cover just for you.
                  </p>
                  <Textarea
                    value={formData.freeform_interests}
                    onChange={e => update("freeform_interests", e.target.value)}
                    placeholder={COVERAGE_PLACEHOLDER}
                    className="rounded-xl resize-none text-sm leading-relaxed"
                    rows={10}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {RSS_PRESETS.map(rss => (
                      <button key={rss.id} onClick={() => toggleRSS(rss.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.selected_rss.includes(rss.id) ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                        <Rss className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
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
            <Button onClick={next} disabled={saving} className="w-full h-11 rounded-xl" size="lg">
              {saving ? "Saving..." : step === STEPS.length - 1 ? "Finish setup" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
