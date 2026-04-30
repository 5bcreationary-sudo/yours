import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Play,
  Settings,
  Clock,
  Calendar,
  Headphones,
  ChevronRight,
  LogOut,
  Loader2,
  CloudSun,
  Mail,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import { listRecentBriefingsWithCounts, listSources, triggerBriefing } from "@/lib/supabase";
import { toast } from "sonner";
import type { BriefingListItem } from "@/types/database";
import { YoursLogo } from "@/components/YoursLogo";

function minutesFromDuration(seconds: number | null, sectionsCount: number): number {
  if (seconds && seconds > 0) return Math.max(1, Math.round(seconds / 60));
  return Math.max(1, Math.round(sectionsCount * 1.5));
}

interface WeatherSnapshot {
  tempF: number;
  condition: string;
  code: number;
  highF: number;
  lowF: number;
  city: string | null;
}

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Storms";
  return "—";
}

async function fetchWeatherFromCoords(lat: number, lon: number): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const body = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
  };
  const tempF = Math.round(body.current?.temperature_2m ?? 0);
  const code = body.current?.weather_code ?? 0;
  const highF = Math.round(body.daily?.temperature_2m_max?.[0] ?? tempF);
  const lowF = Math.round(body.daily?.temperature_2m_min?.[0] ?? tempF);
  return { tempF, code, condition: describeWeatherCode(code), highF, lowF, city: null };
}

function useWeatherPreview(userAddress: { lat?: number; lng?: number; city?: string } | null) {
  const [data, setData] = useState<WeatherSnapshot | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "denied" | "error" | "ready">("idle");

  const load = () => {
    setState("loading");

    // Prefer saved location from user profile
    if (userAddress?.lat != null && userAddress?.lng != null) {
      fetchWeatherFromCoords(userAddress.lat, userAddress.lng)
        .then((snap) => {
          setData({ ...snap, city: userAddress.city ?? null });
          setState("ready");
        })
        .catch(() => setState("error"));
      return;
    }

    // Fall back to browser geolocation
    if (!("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const snap = await fetchWeatherFromCoords(pos.coords.latitude, pos.coords.longitude);
          setData(snap);
          setState("ready");
        } catch {
          setState("error");
        }
      },
      () => setState("denied"),
      { maximumAge: 10 * 60 * 1000, timeout: 8000 },
    );
  };

  useEffect(() => {
    load();
  }, [userAddress?.lat, userAddress?.lng]);

  return { data, state, reload: load };
}

export default function AppHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["briefings", user?.id],
    queryFn: () => listRecentBriefingsWithCounts(user!.id),
    enabled: !!user,
    refetchInterval: (q) =>
      q.state.data?.some((b) => b.status === "generating") ? 15000 : false,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["sources", user?.id],
    queryFn: () => listSources(user!.id),
    enabled: !!user,
  });

  const userAddr = user?.home_address as { lat?: number; lng?: number; city?: string } | null;
  const weather = useWeatherPreview(userAddr);
  const [triggering, setTriggering] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (triggering) return;
    setTriggering(true);
    try {
      // Pass user's saved location, fall back to 22101 (McLean, VA).
      const addr = user?.home_address as { lat?: number; lng?: number; city?: string } | null;
      const location = addr?.lat != null && addr?.lng != null
        ? { lat: addr.lat, lng: addr.lng, city: addr.city ?? "" }
        : { lat: 38.9233, lng: -77.1626, city: "McLean" };
      await triggerBriefing({ location });
      queryClient.invalidateQueries({ queryKey: ["briefings", user?.id] });
    } catch (err) {
      console.error("trigger failed", err);
      toast.error(err instanceof Error ? err.message : "Couldn't generate briefing");
    } finally {
      setTriggering(false);
    }
  }, [triggering, user?.id, user?.home_address]);

  const calendarConnected = sources.some((s) => s.type === "calendar" && s.enabled);
  const gmailConnected = sources.some((s) => s.type === "gmail" && s.enabled);

  const latestBriefing = history[0] ?? null;
  const readyBriefing =
    latestBriefing?.status === "ready"
      ? latestBriefing
      : history.find((briefing) => briefing.status === "ready") ?? null;
  const generating = history.find((b) => b.status === "generating") ?? null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const deliveryLabel = useMemo(() => {
    const t = user?.delivery_time?.slice(0, 5) ?? "07:00";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }, [user?.delivery_time]);

  const nextBriefingLabel = useMemo(() => {
    const t = user?.delivery_time?.slice(0, 5) ?? "07:00";
    const [h, m] = t.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const diffMs = target.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
    if (diffH > 0) return `${diffH}h ${diffM}m`;
    return `${diffM}m`;
  }, [user?.delivery_time]);

  const [expandedCard, setExpandedCard] = useState<"weather" | "next" | "inbox" | null>(null);
  const toggleCard = (card: "weather" | "next" | "inbox") =>
    setExpandedCard((prev) => (prev === card ? null : card));

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <YoursLogo size={48} />
            <span className="text-base font-semibold tracking-tight">Yours</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        {/* Quick-glance cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {/* Weather card */}
          <button
            onClick={() => toggleCard("weather")}
            className="p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <CloudSun className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weather</p>
            </div>
            {weather.state === "ready" && weather.data ? (
              <>
                <p className="text-base font-semibold tabular-nums">{weather.data.tempF}°</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">{weather.data.condition}</p>
              </>
            ) : weather.state === "loading" ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : weather.state === "denied" ? (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.5} /> Enable
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} /> Retry
              </span>
            )}
          </button>

          {/* Next briefing card */}
          <button
            onClick={() => toggleCard("next")}
            className="p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Next up</p>
            </div>
            {generating ? (
              <>
                <p className="text-base font-semibold">Now</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">Generating…</p>
              </>
            ) : readyBriefing ? (
              <>
                <p className="text-base font-semibold">Ready</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">Tap to play</p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold tabular-nums">{nextBriefingLabel}</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">at {deliveryLabel}</p>
              </>
            )}
          </button>

          {/* Inbox card */}
          <button
            onClick={() => toggleCard("inbox")}
            className="p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Inbox</p>
            </div>
            {gmailConnected ? (
              <>
                <p className="text-base font-semibold">Connected</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">In your briefing</p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-muted-foreground">—</p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">Connect Gmail</p>
              </>
            )}
          </button>
        </motion.div>

        {/* Expanded card detail */}
        <AnimatePresence>
          {expandedCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    {expandedCard === "weather" && "Weather"}
                    {expandedCard === "next" && "Next Briefing"}
                    {expandedCard === "inbox" && "Email & Calendar"}
                  </h3>
                  <button onClick={() => setExpandedCard(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {expandedCard === "weather" && (
                  weather.state === "ready" && weather.data ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold tabular-nums">{weather.data.tempF}°F</span>
                        <span className="text-sm text-muted-foreground">{weather.data.condition}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>High: {weather.data.highF}°</span>
                        <span>Low: {weather.data.lowF}°</span>
                      </div>
                      {weather.data.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {weather.data.city}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {weather.state === "denied"
                        ? "Enable location in Settings to see weather here."
                        : "Couldn't load weather. Tap the card to retry."}
                    </p>
                  )
                )}

                {expandedCard === "next" && (
                  <div className="space-y-2">
                    {generating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <p className="text-sm">Your briefing is generating now — usually takes 2-3 minutes.</p>
                      </div>
                    ) : readyBriefing ? (
                      <>
                        <p className="text-sm">Today's briefing is ready — {readyBriefing.sections_count} sections, ~{minutesFromDuration(readyBriefing.audio_duration_seconds, readyBriefing.sections_count)} min.</p>
                        <Button
                          onClick={() => navigate(`/b/${readyBriefing.id}`)}
                          size="sm"
                          className="mt-1 rounded-lg"
                        >
                          <Play className="h-3.5 w-3.5 mr-1.5" fill="currentColor" /> Play now
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">Next briefing in <strong>{nextBriefingLabel}</strong> at {deliveryLabel}.</p>
                        <p className="text-xs text-muted-foreground">Or generate one now with the button below.</p>
                      </>
                    )}
                  </div>
                )}

                {expandedCard === "inbox" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{gmailConnected ? "Gmail connected" : "Gmail not connected"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{calendarConnected ? "Calendar connected" : "Calendar not connected"}</span>
                      </div>
                    </div>
                    {(!gmailConnected || !calendarConnected) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 rounded-lg"
                        onClick={() => navigate("/settings")}
                      >
                        Connect in Settings <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                    {gmailConnected && calendarConnected && (
                      <p className="text-xs text-muted-foreground">Email highlights and calendar events will be included in your next briefing.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's briefing CTA */}
        {readyBriefing ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
                <p className="text-white text-lg font-bold mt-1">Ready to listen</p>
              </div>
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <Clock className="h-3.5 w-3.5" />
                {minutesFromDuration(readyBriefing.audio_duration_seconds, readyBriefing.sections_count)} min
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-5">
              <Calendar className="h-3.5 w-3.5" />
              {readyBriefing.sections_count} sections · Weather, Calendar, News, and more
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/b/${readyBriefing.id}`)}
                className="flex-1 h-11 rounded-xl bg-white hover:bg-white/90 text-neutral-900 font-semibold"
              >
                <Play className="h-4 w-4 mr-2" fill="currentColor" /> Play briefing
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={triggering || !!generating}
                className="h-11 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold px-4"
              >
                {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              {generating && <Loader2 className="h-3.5 w-3.5 text-white animate-spin" strokeWidth={2} />}
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
            </div>
            <p className="text-white text-lg font-bold mb-3">
              {isLoading
                ? "Loading..."
                : generating
                  ? "Generating now…"
                  : latestBriefing?.status === "failed"
                    ? "Today's briefing hit a snag"
                    : "Your first briefing is on the way"}
            </p>
            {generating ? (
              <>
                <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-white/70"
                    initial={{ width: "15%" }}
                    animate={{ width: ["15%", "65%", "85%"] }}
                    transition={{ duration: 180, ease: "easeOut" }}
                  />
                </div>
                <p className="text-white/80 text-xs leading-relaxed">
                  Expected in ~3 minutes. We'll text you the moment it's ready.
                </p>
              </>
            ) : (
              <>
                <p className="text-white/70 text-xs leading-relaxed mb-4">
                  Delivered at {deliveryLabel} ({user?.timezone ?? "your timezone"}). Or generate one right now.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={triggering}
                  className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-neutral-900 font-semibold"
                >
                  {triggering ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" fill="currentColor" /> Generate now</>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Preferences tile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/settings")}
            className="w-full p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow text-left flex items-center gap-3"
          >
            <Headphones className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">Preferences</p>
              <p className="text-xs text-muted-foreground">Tone, length, interests, and sources</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold mb-3">Recent briefings</h2>

          {history.length === 0 && !isLoading && (
            <div className="p-5 rounded-xl border border-dashed border-border bg-card text-center">
              <p className="text-sm font-medium mb-1">No briefings yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your first briefing will arrive at {deliveryLabel} in {user?.timezone ?? "your timezone"}.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {history.map((b: BriefingListItem) => {
              const isReady = b.status === "ready";
              const dateLabel = new Date(b.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const preview = b.preview_titles.length ? b.preview_titles.join(" + ") : null;
              return (
                <button
                  key={b.id}
                  onClick={() => isReady && navigate(`/b/${b.id}`)}
                  disabled={!isReady}
                  className="w-full p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{dateLabel}</p>
                        {isReady ? (
                          <span className="text-[10px] text-muted-foreground">
                            · {minutesFromDuration(b.audio_duration_seconds, b.sections_count)} min
                          </span>
                        ) : b.status === "generating" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> Generating
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground capitalize">· {b.status}</span>
                        )}
                      </div>
                      {preview && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{preview}</p>
                      )}
                    </div>
                    {isReady && (
                      <div className="inline-flex items-center gap-1 text-xs font-medium shrink-0 mt-0.5">
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                        Listen
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
