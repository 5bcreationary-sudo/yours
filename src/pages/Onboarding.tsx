import { useEffect, useMemo, useRef, useState } from "react";
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
  Mail,
  Newspaper,
  Trophy,
  Cpu,
  HeartPulse,
  Building2,
  Music,
  MapPin,
  LocateFixed,
  type LucideIcon,
} from "lucide-react";
import type { UserInterest, UserProfile } from "@/types/database";
import { toast } from "sonner";
import { addRssSource, getInterests, triggerBriefing, upsertInterests } from "@/lib/supabase";
import { useWeatherPreview } from "@/hooks/useWeatherPreview";
import { ReactiveLine } from "@/components/onboarding/ReactiveLine";

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
  { title: "Tell us about you", subtitle: "This helps us give you accurate weather and local updates." },
  { title: "What should we cover most?", subtitle: "Don't worry — we'll refine this later." },
  { title: "Pick your style", subtitle: "Each preset shapes voice, length, and tone." },
  { title: "Anything else we should know?", subtitle: "Brain dump anything — the more we know, the more personalized your briefings get." },
  { title: "When should we have it ready?", subtitle: "We'll text you the moment your briefing is ready." },
];

type CoverageOption = { id: string; label: string; icon: LucideIcon };

const COVERAGE_OPTIONS: CoverageOption[] = [
  { id: "emails_calendar", label: "My emails & calendar", icon: Mail },
  { id: "news", label: "Latest news", icon: Newspaper },
  { id: "sports", label: "Sports & teams", icon: Trophy },
  { id: "tech", label: "AI, tech & startups", icon: Cpu },
  { id: "health", label: "Health & wellness", icon: HeartPulse },
  { id: "work", label: "My company & job", icon: Building2 },
  { id: "culture", label: "Music & culture", icon: Music },
];

const DISABLED_COVERAGE: Partial<Record<string, string>> = {
  emails_calendar: "Coming next beta",
};

const DEEP_DIVE_PROMPTS: Partial<Record<string, string>> = {
  sports: "Which sports or teams?",
  work: "Where do you work and what do you do?",
};

const DEEP_DIVE_PLACEHOLDERS: Partial<Record<string, string>> = {
  sports: "e.g. 49ers, Warriors, Premier League",
  work: "e.g. PM at a health-tech startup in SF",
};

interface StylePreset {
  id: string;
  length: 3 | 8 | 12;
  style: UserProfile["briefing_style"];
  tone: UserProfile["tone"];
  mode: UserProfile["briefing_mode"];
  label: string;
  duration: string;
  desc: string;
  example: string;
  /** Sample dialogue surfaced in the live preview when this preset is selected. */
  sample: string[];
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "quick",
    length: 3,
    style: "straightforward",
    tone: "professional",
    mode: "executive",
    label: "Quick brief",
    duration: "3 min",
    desc: "Headlines only — facts, no filler.",
    example: "Bloomberg-style executive update",
    sample: [
      "Markets opened up half a percent. Apple beats on iPhone. Fed holds.",
      "Three meetings today. First at ten. That's your morning.",
    ],
  },
  {
    id: "morning",
    length: 8,
    style: "conversational",
    tone: "upbeat",
    mode: "morning",
    label: "Morning show",
    duration: "8 min",
    desc: "Two hosts walk you through the day, with light banter.",
    example: "NPR Up First with energy",
    sample: [
      "It's seventy-two and sunny — perfect for that one-pm meeting.",
      "Speaking of meetings — three on your plate today, first at ten.",
    ],
  },
  {
    id: "discussion",
    length: 12,
    style: "conversational",
    tone: "calm",
    mode: "morning",
    label: "Long discussion",
    duration: "12 min",
    desc: "Hosts dig into stories, ask questions, follow threads.",
    example: "Joe Rogan-style discussion",
    sample: [
      "So OpenAI dropped this turbo variant overnight.",
      "Wait — agent workloads specifically? That's wild. Let's actually break down what changed.",
    ],
  },
];

/** Convert a free-form interests blob into discrete chips. Splits on commas,
 *  newlines, and sentence-ending punctuation; trims, drops empties, dedupes
 *  case-insensitively, caps at 12. Pure function so it's unit-testable. */
export function extractChips(text: string): string[] {
  if (!text) return [];
  const parts = text
    .split(/[,;\n.!?]+/g)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2 && p.length <= 60);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= 12) break;
  }
  return out;
}

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
    coverage_details: {} as Record<string, string>,
    style_preset_id: "morning",
    freeform_interests: "",
    delivery_time: "07:00",
  });
  const [geoLoading, setGeoLoading] = useState(false);

  const update = (key: keyof typeof formData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const selectedPreset = useMemo(
    () => STYLE_PRESETS.find((p) => p.id === formData.style_preset_id) ?? STYLE_PRESETS[1],
    [formData.style_preset_id],
  );

  const coverageLabels = useMemo(
    () => COVERAGE_OPTIONS.filter((o) => formData.coverage.includes(o.id)).map((o) => o.label),
    [formData.coverage],
  );

  // ---------- geocoding ----------
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

  const forwardGeocode = async (
    query: string,
  ): Promise<{ lat: number; lng: number; city: string } | null> => {
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
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        city: results[0].display_name.split(",")[0],
      };
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
      setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      coverage: prev.coverage.includes(id) ? prev.coverage.filter((c) => c !== id) : [...prev.coverage, id],
    }));
  };

  const openTimePicker = () => {
    const el = timeInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      /* no-op */
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
    const labeled = COVERAGE_OPTIONS
      .filter((o) => formData.coverage.includes(o.id))
      .map((o) => {
        const detail = (formData.coverage_details[o.id] ?? "").trim();
        return detail ? `${o.label}: ${detail}` : o.label;
      });
    if (!labeled.length) return null;
    return `Cover most: ${labeled.join(", ")}`;
  };

  // Persist the slice owned by the current step. Throws on failure.
  const saveCurrentStep = async () => {
    if (!user) throw new Error("You must be signed in to continue.");
    switch (step) {
      case 0: {
        let homeAddress: { lat: number; lng: number; city: string } | null = null;
        if (formData.location_lat != null && formData.location_lng != null) {
          homeAddress = {
            lat: formData.location_lat,
            lng: formData.location_lng,
            city: formData.location_city,
          };
        } else if (formData.location_city.trim()) {
          const geo = await forwardGeocode(formData.location_city.trim());
          if (geo) {
            homeAddress = geo;
            setFormData((prev) => ({
              ...prev,
              location_lat: geo.lat,
              location_lng: geo.lng,
              location_city: geo.city,
            }));
          }
        }
        await updateProfile({
          full_name: formData.full_name || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(homeAddress ? { home_address: homeAddress } : {}),
        });
        return;
      }
      case 1: {
        const summary = coverageSummary();
        const existing = await getInterests(user.id);
        const existingFree = existing?.freeform_text ?? "";
        const withoutCoverLine = existingFree
          .split("\n\n")
          .filter((p) => !p.startsWith("Cover most:") && p.trim() !== formData.coverage_other.trim())
          .join("\n\n");
        const merged = [summary, withoutCoverLine].filter(Boolean).join("\n\n") || null;
        await upsertInterests(user.id, {
          freeform_text: merged,
          selected_packages: existing?.selected_packages ?? [],
          tags: Array.from(new Set(formData.coverage)),
        });
        return;
      }
      case 2: {
        await updateProfile({
          tone: selectedPreset.tone,
          briefing_mode: selectedPreset.mode,
          briefing_style: selectedPreset.style,
          preferred_length_minutes: selectedPreset.length,
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
        await updateProfile({
          phone_e164: normalizePhone(formData.phone),
          delivery_time: formData.delivery_time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
        // Final step: trigger first briefing and go straight to the player.
        try {
          const loc =
            formData.location_lat != null && formData.location_lng != null
              ? { lat: formData.location_lat, lng: formData.location_lng, city: formData.location_city || "" }
              : undefined;
          const { briefing_id } = await triggerBriefing(loc ? { location: loc } : undefined);
          navigate(`/b/${briefing_id}`, { state: { autoplay: true } });
        } catch (err) {
          console.error("[onboarding] triggerBriefing failed", err);
          toast.success("You're all set!");
          navigate("/app");
        }
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
      {/* Top progress + step counter */}
      <div className="sticky top-0 z-10 bg-background pt-3 pb-2 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? "invisible" : ""}`}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={skip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-bold tracking-tight mb-1">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{STEPS[step].subtitle}</p>

              {step === 0 && <Step0 formData={formData} update={update} useMyLocation={useMyLocation} geoLoading={geoLoading} />}
              {step === 1 && <Step1 formData={formData} toggleCoverage={toggleCoverage} update={update} />}
              {step === 2 && <Step2 formData={formData} update={update} />}
              {step === 3 && <Step3 formData={formData} update={update} />}
              {step === 4 && (
                <Step4
                  formData={formData}
                  update={update}
                  timeInputRef={timeInputRef}
                  openTimePicker={openTimePicker}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <Button onClick={next} disabled={saving} className="w-full h-11 rounded-xl" size="lg">
              {saving ? "Saving..." : step === STEPS.length - 1 ? "Create my first briefing" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Steps ----------

interface StepProps {
  formData: {
    full_name: string;
    phone: string;
    location_city: string;
    location_lat: number | null;
    location_lng: number | null;
    coverage: string[];
    coverage_other: string;
    coverage_details: Record<string, string>;
    style_preset_id: string;
    freeform_interests: string;
    delivery_time: string;
  };
  update: (key: string, value: unknown) => void;
}

function Step0({
  formData,
  update,
  useMyLocation,
  geoLoading,
}: StepProps & { useMyLocation: () => void; geoLoading: boolean }) {
  const firstName = (formData.full_name.split(" ")[0] || "").trim();
  const address =
    formData.location_lat != null && formData.location_lng != null
      ? { lat: formData.location_lat, lng: formData.location_lng, city: formData.location_city }
      : null;
  const weather = useWeatherPreview(address);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-1.5 block">What should we call you?</label>
        <Input
          value={formData.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Your name"
          className="h-11 rounded-xl"
          autoFocus
        />
        <ReactiveLine
          className="mt-2"
          input={firstName}
          format={(name) => `Good morning, ${name} — let's build your briefing.`}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Where are you?</label>
        <div className="flex gap-2">
          <Input
            value={formData.location_city}
            onChange={(e) => {
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
            {geoLoading ? <LocateFixed className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>

        {/* Live weather preview once a location is locked in */}
        <AnimatePresence>
          {address && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="mt-3 p-3 rounded-xl bg-secondary flex items-center gap-3"
            >
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background text-xs font-medium">
                <MapPin className="h-3 w-3" /> {formData.location_city || "Your location"}
              </span>
              {weather.state === "ready" && weather.data ? (
                <span className="text-sm font-semibold tabular-nums">
                  {weather.data.tempF}° · {weather.data.condition}
                </span>
              ) : weather.state === "loading" ? (
                <span className="text-xs text-muted-foreground">Loading weather…</span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <ReactiveLine
          className="mt-2"
          input={address ? "ok" : ""}
          format={() => "Using this for weather and local updates."}
          thinkingMs={400}
        />
      </div>
    </div>
  );
}

function Step1({
  formData,
  toggleCoverage,
  update,
}: StepProps & { toggleCoverage: (id: string) => void }) {
  const selectedLabels = COVERAGE_OPTIONS.filter(
    (o) => formData.coverage.includes(o.id),
  ).map((o) => o.label);

  const deepDiveItems = COVERAGE_OPTIONS.filter(
    (o) => formData.coverage.includes(o.id) && !!DEEP_DIVE_PROMPTS[o.id],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {COVERAGE_OPTIONS.map((opt) => {
          const selected = formData.coverage.includes(opt.id);
          const Icon = opt.icon;
          const disabledNote = DISABLED_COVERAGE[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={disabledNote ? undefined : () => toggleCoverage(opt.id)}
              disabled={!!disabledNote}
              className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                disabledNote
                  ? "border-border opacity-40 cursor-not-allowed"
                  : selected
                  ? "border-foreground bg-secondary"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 mt-0.5 ${selected && !disabledNote ? "text-foreground" : "text-muted-foreground"}`}
                strokeWidth={1.5}
              />
              <span className="flex-1 min-w-0">
                <span className="text-xs font-medium leading-snug block">{opt.label}</span>
                {disabledNote && (
                  <span className="text-[10px] text-muted-foreground italic">{disabledNote}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deep-dive inputs for options that support them */}
      <AnimatePresence>
        {deepDiveItems.map((opt) => (
          <motion.div
            key={`detail-${opt.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {DEEP_DIVE_PROMPTS[opt.id]}
              </label>
              <Textarea
                value={formData.coverage_details[opt.id] ?? ""}
                onChange={(e) =>
                  update("coverage_details", { ...formData.coverage_details, [opt.id]: e.target.value })
                }
                placeholder={DEEP_DIVE_PLACEHOLDERS[opt.id] ?? ""}
                className="rounded-xl resize-none text-sm"
                rows={2}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Live priority pill row */}
      <AnimatePresence>
        {selectedLabels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            className="p-3 rounded-xl bg-secondary"
          >
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Your briefing will prioritize
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedLabels.map((label, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-2 py-0.5 rounded-full bg-background text-xs font-medium border border-border"
                >
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactiveLine
        input={selectedLabels.join(",")}
        format={() => "Adding that to your daily coverage…"}
        thinkingMs={500}
      />
    </div>
  );
}

function Step2({ formData, update }: StepProps) {
  const selectedPreset =
    STYLE_PRESETS.find((p) => p.id === formData.style_preset_id) ?? STYLE_PRESETS[1];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {STYLE_PRESETS.map((p) => {
          const selected = p.id === formData.style_preset_id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update("style_preset_id", p.id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                selected ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold tabular-nums">{p.duration}</span>
                  <span className="text-sm font-medium">{p.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.desc}</p>
                <p className="text-[11px] text-muted-foreground italic mt-1">{p.example}</p>
              </div>
              {selected && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Live sample dialogue preview */}
      <div className="p-4 rounded-xl bg-secondary">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Here's what your briefing might sound like
          </p>
          <div className="flex items-center gap-0.5 h-3">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ scaleY: [0.4, 1.2, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                className="block w-0.5 h-2 bg-foreground/60 rounded-full origin-center"
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPreset.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="space-y-1.5"
          >
            {selectedPreset.sample.map((line, i) => (
              <p key={i} className="text-sm italic leading-snug text-foreground/85">
                "{line}"
              </p>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

function Step3({ formData, update }: StepProps) {
  const chips = useMemo(() => extractChips(formData.freeform_interests), [formData.freeform_interests]);
  const [debouncedChipCount, setDebouncedChipCount] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedChipCount(chips.length), 700);
    return () => window.clearTimeout(t);
  }, [chips.length]);

  return (
    <div className="space-y-3">
      <Textarea
        value={formData.freeform_interests}
        onChange={(e) => update("freeform_interests", e.target.value)}
        placeholder={`AI startups — Anthropic, OpenAI, Mistral. Funding rounds and product launches.

49ers fan — scores, injuries, trade rumors.

Foo Fighters tour dates and new releases.`}
        className="rounded-xl resize-none text-sm leading-relaxed"
        rows={9}
      />

      <AnimatePresence>
        {chips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {chips.map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, scale: 0.85, x: -4 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium"
              >
                {chip}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ReactiveLine
        input={debouncedChipCount > 0 ? String(debouncedChipCount) : ""}
        format={(n) => {
          const count = Number(n);
          if (count >= 4) return "This is getting highly personalized.";
          return "Adding this to your daily briefing…";
        }}
        thinkingMs={400}
      />
    </div>
  );
}

function Step4({
  formData,
  update,
  timeInputRef,
  openTimePicker,
}: StepProps & {
  timeInputRef: React.RefObject<HTMLInputElement>;
  openTimePicker: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-2 block">Briefing time</label>
        <button
          type="button"
          onClick={openTimePicker}
          className="w-full py-7 px-6 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors flex flex-col items-center justify-center"
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
          onChange={(e) => update("delivery_time", e.target.value || "07:00")}
          className="sr-only"
          aria-label="Briefing time"
        />
        <ReactiveLine
          className="mt-2"
          input={formData.delivery_time}
          format={(t) => `Your briefing will arrive at ${formatTime12h(t)}.`}
          thinkingMs={350}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Mobile number</label>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formData.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 555 123 4567"
          className="h-11 rounded-xl"
        />
        <ReactiveLine
          className="mt-2"
          input={formData.phone.trim()}
          format={() => "We'll text you when it's ready."}
          thinkingMs={400}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Detected timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </p>
    </div>
  );
}
