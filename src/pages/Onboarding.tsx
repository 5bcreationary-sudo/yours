import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ArrowRight, Check, MapPin, Clock, Mic, Sparkles, Plus, X } from "lucide-react";

const timezones = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Asia/Tokyo",
];

const suggestedInterests = [
  "AI startups", "SF 49ers", "Rock music", "Tech earnings", "Crypto markets",
  "Product management jobs", "Climate news", "NBA highlights", "Cooking recipes",
  "Science breakthroughs", "Stock market", "Fitness tips", "Movie reviews",
];

const voices = [
  { id: "sarah", name: "Sarah", description: "Warm & conversational", sample: "🎙️" },
  { id: "marcus", name: "Marcus", description: "Confident & engaging", sample: "🎙️" },
  { id: "priya", name: "Priya", description: "Calm & professional", sample: "🎙️" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [deliveryTime, setDeliveryTime] = useState("07:00");

  // Step 2 state
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

  // Step 3 state
  const [length, setLength] = useState(8);
  const [tone, setTone] = useState<"upbeat" | "calm" | "professional">("upbeat");
  const [voice, setVoice] = useState("sarah");

  const steps = [
    { title: "Basics", subtitle: "Timezone & delivery time" },
    { title: "Interests", subtitle: "What matters to you" },
    { title: "Preferences", subtitle: "Length, tone & voice" },
  ];

  const addInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[hsl(210,100%,85%)] opacity-20 blur-[160px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[450px] h-[450px] rounded-full bg-[hsl(200,80%,88%)] opacity-15 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[520px]">
        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-foreground" : i < step ? "w-1.5 bg-foreground/40" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
                  <Headphones className="h-7 w-7 text-background" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Welcome to Yours</h1>
                <p className="text-sm text-muted-foreground mt-2 mb-8">Let's set up your daily briefing in under 2 minutes.</p>

                <div className="space-y-4 max-w-[360px] mx-auto text-left">
                  <div>
                    <label className="text-xs font-medium text-primary-app flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5" /> Delivery Time
                    </label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary-app focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-primary-app flex items-center gap-2 mb-2">
                      <MapPin className="h-3.5 w-3.5" /> Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary-app focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] transition-all"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-7 w-7 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-primary-app">What interests you?</h1>
                <p className="text-sm text-muted-foreground mt-2 mb-6">Select topics or add your own. Be specific — "SF 49ers scores" works better than "sports".</p>

                {/* Selected interests */}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))] px-3 py-1.5 text-xs font-medium"
                      >
                        {interest}
                        <button onClick={() => removeInterest(interest)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested tags */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {suggestedInterests.filter((i) => !interests.includes(i)).map((interest) => (
                    <button
                      key={interest}
                      onClick={() => addInterest(interest)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-primary-app hover:bg-accent transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> {interest}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="flex gap-2 max-w-[360px] mx-auto">
                  <input
                    type="text"
                    placeholder='e.g. "job openings for product manager in SF"'
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customInterest.trim()) {
                        addInterest(customInterest.trim());
                        setCustomInterest("");
                      }
                    }}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] transition-all"
                  />
                  <button
                    onClick={() => {
                      if (customInterest.trim()) {
                        addInterest(customInterest.trim());
                        setCustomInterest("");
                      }
                    }}
                    className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                  <Mic className="h-7 w-7 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Customize your briefing</h1>
                <p className="text-sm text-muted-foreground mt-2 mb-8">Choose your preferred length, tone, and voice.</p>

                <div className="space-y-6 max-w-[360px] mx-auto text-left">
                  {/* Length */}
                  <div>
                    <label className="text-xs font-medium text-primary-app mb-3 block">Briefing Length</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ min: 3, label: "Quick · 3 min" }, { min: 8, label: "Standard · 8 min" }, { min: 12, label: "Deep · 12 min" }].map((opt) => (
                        <button
                          key={opt.min}
                          onClick={() => setLength(opt.min)}
                          className={`rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                            length === opt.min
                              ? "border-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))]"
                              : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="text-xs font-medium text-primary-app mb-3 block">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["upbeat", "calm", "professional"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`rounded-xl border px-3 py-3 text-xs font-medium capitalize transition-all ${
                            tone === t
                              ? "border-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))] text-[hsl(var(--blue-accent))]"
                              : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {t === "upbeat" ? "☀️ " : t === "calm" ? "🧘 " : "💼 "}{t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice */}
                  <div>
                    <label className="text-xs font-medium text-primary-app mb-3 block">Voice</label>
                    <div className="space-y-2">
                      {voices.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVoice(v.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition-all ${
                            voice === v.id
                              ? "border-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))]"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          <span className="text-lg">{v.sample}</span>
                          <div>
                            <p className="text-sm font-medium text-primary-app">{v.name}</p>
                            <p className="text-[11px] text-muted-foreground">{v.description}</p>
                          </div>
                          {voice === v.id && <Check className="h-4 w-4 text-[hsl(var(--blue-accent))] ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary-app transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 2 ? handleComplete() : setStep(step + 1))}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {step === 2 ? "Start Listening" : "Continue"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
