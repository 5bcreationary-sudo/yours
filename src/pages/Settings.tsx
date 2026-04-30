import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  Trash2,
  Plus,
  X,
  Rss,
  Zap,
  Waves,
  Briefcase,
  Sun,
  Car,
  Mail,
  Calendar as CalendarIcon,
  MapPin,
  LocateFixed,
} from "lucide-react";
import { RSS_PRESETS } from "@/types/database";
import type { UserSource } from "@/types/database";
import { toast } from "sonner";
import {
  getInterests,
  listSources,
  addRssSource,
  removeSource,
  upsertInterests,
  deleteAccount,
} from "@/lib/supabase";

const TABS = ["Profile", "Interests", "Sources", "Audio"];

const TONES = [
  {
    id: "upbeat" as const,
    label: "Upbeat",
    icon: Zap,
    desc: "Warm, energetic delivery with a motivating lift.",
  },
  {
    id: "calm" as const,
    label: "Calm",
    icon: Waves,
    desc: "Measured, grounded pace — thoughtful podcast host.",
  },
  {
    id: "professional" as const,
    label: "Professional",
    icon: Briefcase,
    desc: "Direct, efficient, facts-first — daily executive brief.",
  },
];

const MODES = [
  { id: "morning" as const, label: "Morning", icon: Sun, desc: "Full overview to start your day" },
  { id: "commute" as const, label: "Commute", icon: Car, desc: "Tighter brief for the drive in" },
  { id: "executive" as const, label: "Executive", icon: Briefcase, desc: "Headlines and calendar only" },
];

const LENGTHS = [3, 8, 12];

const INTERESTS_PLACEHOLDER = `e.g. I follow AI startups — Anthropic, OpenAI, Mistral, Groq. I want funding rounds, product launches, and technical research papers summarized.

I'm a 49ers fan. Scores, injury reports, trade rumors, upcoming games.

I like alt-rock — Foo Fighters, Arctic Monkeys, The Strokes. Tour dates, new releases, band news.

Morning weather and any traffic on the 101 toward Palo Alto.`;

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, signInWithGoogle, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const [name, setName] = useState(user?.full_name || "");
  const [deliveryTime, setDeliveryTime] = useState(user?.delivery_time?.slice(0, 5) || "07:00");
  const [tone, setTone] = useState<"upbeat" | "calm" | "professional">(user?.tone || "upbeat");
  const [mode, setMode] = useState<"morning" | "commute" | "executive">(user?.briefing_mode || "morning");
  const [length, setLength] = useState(user?.preferred_length_minutes || 8);

  const [freeformInterests, setFreeformInterests] = useState("");

  const [locationCity, setLocationCity] = useState(
    (user?.home_address as { city?: string } | null)?.city || "",
  );
  const [locationLat, setLocationLat] = useState<number | null>(
    (user?.home_address as { lat?: number } | null)?.lat ?? null,
  );
  const [locationLng, setLocationLng] = useState<number | null>(
    (user?.home_address as { lng?: number } | null)?.lng ?? null,
  );
  const [geoLoading, setGeoLoading] = useState(false);

  const [customRss, setCustomRss] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);
  const [savingAudio, setSavingAudio] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingRss, setAddingRss] = useState(false);

  const { data: interests } = useQuery({
    queryKey: ["interests", user?.id],
    queryFn: () => getInterests(user!.id),
    enabled: !!user,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["sources", user?.id],
    queryFn: () => listSources(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (interests?.freeform_text !== undefined) {
      setFreeformInterests(interests.freeform_text ?? "");
    }
  }, [interests]);

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setDeliveryTime(user.delivery_time?.slice(0, 5) || "07:00");
      setTone(user.tone || "upbeat");
      setMode(user.briefing_mode || "morning");
      setLength(user.preferred_length_minutes || 8);
      const addr = user.home_address as { lat?: number; lng?: number; city?: string } | null;
      if (addr) {
        setLocationCity(addr.city || "");
        setLocationLat(addr.lat ?? null);
        setLocationLng(addr.lng ?? null);
      }
    }
  }, [user]);

  const rssSources = sources.filter((s) => s.type === "rss");
  const gmailConnected = sources.some((s) => s.type === "gmail" && s.enabled);
  const calendarConnected = sources.some((s) => s.type === "calendar" && s.enabled);

  const selectedRssPresetIds = rssSources
    .map((s) => (s.config as { preset_id?: string }).preset_id)
    .filter((x): x is string => !!x && x !== "custom");

  const invalidateSources = () =>
    queryClient.invalidateQueries({ queryKey: ["sources", user?.id] });

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
        { headers: { "User-Agent": "YoursFM/1.0" } },
      );
      if (!res.ok) return "";
      const data = await res.json();
      const addr = data.address ?? {};
      return addr.city || addr.town || addr.village || addr.county || "";
    } catch {
      return "";
    }
  };

  const forwardGeocode = async (query: string): Promise<{ lat: number; lng: number; city: string } | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
        { headers: { "User-Agent": "YoursFM/1.0" }, signal: controller.signal },
      );
      clearTimeout(timer);
      if (!res.ok) return null;
      const results = await res.json();
      if (!results.length) return null;
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), city: results[0].display_name.split(",")[0] };
    } catch {
      return null;
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
      setLocationLat(latitude);
      setLocationLng(longitude);
      setLocationCity(city || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
    } catch {
      toast.error("Could not get your location. Please enter your city manually.");
    } finally {
      setGeoLoading(false);
    }
  };

  const savingProfileRef = useRef(false);
  const saveProfile = async () => {
    if (savingProfileRef.current) return;
    savingProfileRef.current = true;
    setSavingProfile(true);
    try {
      let homeAddress: { lat: number; lng: number; city: string } | null = null;
      if (locationLat != null && locationLng != null) {
        homeAddress = { lat: locationLat, lng: locationLng, city: locationCity };
      } else if (locationCity.trim()) {
        // Try to geocode; if it times out or fails, save without coords.
        const geo = await forwardGeocode(locationCity.trim());
        if (geo) {
          homeAddress = geo;
          setLocationLat(geo.lat);
          setLocationLng(geo.lng);
          setLocationCity(geo.city);
        } else {
          toast.info("Couldn't geocode location — saving name and time only.");
        }
      }
      await updateProfile({
        full_name: name,
        delivery_time: deliveryTime,
        ...(homeAddress ? { home_address: homeAddress } : {}),
      });
      toast.success("Profile saved");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't save profile");
    } finally {
      savingProfileRef.current = false;
      setSavingProfile(false);
    }
  };

  const savingAudioRef = useRef(false);
  const saveAudio = async () => {
    if (savingAudioRef.current) return;
    savingAudioRef.current = true;
    setSavingAudio(true);
    try {
      await updateProfile({
        tone,
        briefing_mode: mode,
        preferred_length_minutes: length,
      });
      toast.success("Preferences saved");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't save preferences");
    } finally {
      savingAudioRef.current = false;
      setSavingAudio(false);
    }
  };

  const savingInterestsRef = useRef(false);
  const saveInterests = async () => {
    if (!user || savingInterestsRef.current) return;
    savingInterestsRef.current = true;
    setSavingInterests(true);
    try {
      await upsertInterests(user.id, {
        freeform_text: freeformInterests.trim() || null,
        selected_packages: interests?.selected_packages ?? [],
        tags: interests?.tags ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ["interests", user.id] });
      toast.success("Interests saved");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't save interests");
    } finally {
      savingInterestsRef.current = false;
      setSavingInterests(false);
    }
  };

  const toggleRssPreset = async (presetId: string) => {
    if (!user) return;
    const existing = rssSources.find(
      (s) => (s.config as { preset_id?: string }).preset_id === presetId,
    );
    try {
      if (existing) {
        await removeSource(existing.id);
      } else {
        const preset = RSS_PRESETS.find((r) => r.id === presetId);
        if (!preset) return;
        await addRssSource(user.id, { url: preset.url, name: preset.name, preset_id: preset.id });
      }
      invalidateSources();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update feed");
    }
  };

  const addCustomRss = async () => {
    if (!user || !customRss.trim() || addingRss) return;
    const url = customRss.trim();
    try {
      new URL(url);
    } catch {
      toast.error("That doesn't look like a valid URL");
      return;
    }
    setAddingRss(true);
    try {
      await addRssSource(user.id, {
        url,
        name: new URL(url).hostname,
        preset_id: "custom",
      });
      setCustomRss("");
      invalidateSources();
      toast.success("Feed added");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't add feed");
    } finally {
      setAddingRss(false);
    }
  };

  const removeCustomRss = async (source: UserSource) => {
    try {
      await removeSource(source.id);
      invalidateSources();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove feed");
    }
  };

  const connectGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't start Google sign-in");
    }
  };

  const customRssSources = rssSources.filter(
    (s) => (s.config as { preset_id?: string }).preset_id === "custom",
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-5 h-14">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-xl">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === i ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input value={user?.email || ""} disabled className="h-11 rounded-xl bg-secondary" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Delivery time</label>
              <Input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <div className="flex gap-2">
                <Input
                  value={locationCity}
                  onChange={(e) => {
                    setLocationCity(e.target.value);
                    setLocationLat(null);
                    setLocationLng(null);
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
              <p className="text-xs text-muted-foreground mt-1">For accurate weather in your briefing.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Timezone</label>
              <Input
                value={user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                disabled
                className="h-11 rounded-xl bg-secondary"
              />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="w-full h-11 rounded-xl">
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
            <div className="pt-6 border-t border-border space-y-3">
              {!confirmDelete ? (
                <Button
                  variant="destructive"
                  className="w-full h-11 rounded-xl"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete account & data
                </Button>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive mb-1">Are you sure?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This permanently deletes your account, all briefings, preferences, connected accounts, and audio files. This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 h-11 rounded-xl"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await deleteAccount();
                          await signOut();
                          navigate("/");
                        } catch (err) {
                          console.error(err);
                          toast.error(err instanceof Error ? err.message : "Couldn't delete account");
                          setDeleting(false);
                        }
                      }}
                    >
                      {deleting ? "Deleting..." : "Yes, delete everything"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {tab === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Tell us what you care about</label>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                The more detail you give, the more we can ultra-tailor your briefing. Describe the topics, people,
                teams, companies, or stories you want to hear about — in your own words. Our AI turns this into the
                daily topics we cover just for you.
              </p>
              <Textarea
                value={freeformInterests}
                onChange={(e) => setFreeformInterests(e.target.value)}
                placeholder={INTERESTS_PLACEHOLDER}
                className="rounded-xl resize-none text-sm leading-relaxed"
                rows={10}
              />
            </div>
            <Button onClick={saveInterests} disabled={savingInterests} className="w-full h-11 rounded-xl">
              {savingInterests ? "Saving..." : "Save interests"}
            </Button>
          </motion.div>
        )}

        {tab === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block">Connected accounts</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm font-medium">Gmail</span>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={connectGoogle}>
                    {gmailConnected ? "Reconnect" : "Connect"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm font-medium">Google Calendar</span>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={connectGoogle}>
                    {calendarConnected ? "Reconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">RSS feeds</label>
              <div className="space-y-2">
                {RSS_PRESETS.map((rss) => {
                  const isSelected = selectedRssPresetIds.includes(rss.id);
                  return (
                    <button
                      key={rss.id}
                      onClick={() => toggleRssPreset(rss.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Rss className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rss.name}</p>
                        <p className="text-xs text-muted-foreground">{rss.category}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {customRssSources.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-3 block">Your custom feeds</label>
                <div className="space-y-2">
                  {customRssSources.map((s) => {
                    const cfg = s.config as { url: string; name?: string };
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                        <Rss className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cfg.name || cfg.url}</p>
                          <p className="text-xs text-muted-foreground truncate">{cfg.url}</p>
                        </div>
                        <button
                          onClick={() => removeCustomRss(s)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Custom RSS URL</label>
              <div className="flex gap-2">
                <Input
                  value={customRss}
                  onChange={(e) => setCustomRss(e.target.value)}
                  placeholder="https://..."
                  className="h-11 rounded-xl flex-1"
                />
                <Button
                  size="icon"
                  disabled={addingRss}
                  className="h-11 w-11 rounded-xl shrink-0"
                  onClick={addCustomRss}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block">Briefing mode</label>
              <div className="space-y-2">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        active ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Tone</label>
              <div className="space-y-2">
                {TONES.map((t) => {
                  const Icon = t.icon;
                  const active = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        active ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Length</label>
              <div className="grid grid-cols-3 gap-2">
                {LENGTHS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setLength(n)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      length === n ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">{n} min</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-sm font-medium mb-1">Voice</p>
              <p className="text-xs text-muted-foreground">Voice selection coming in v1.1</p>
            </div>

            <Button onClick={saveAudio} disabled={savingAudio} className="w-full h-11 rounded-xl">
              {savingAudio ? "Saving..." : "Save preferences"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
