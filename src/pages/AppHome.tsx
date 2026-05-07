import { useMemo, useState, useCallback, useEffect } from "react";
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
import { YoursLogo } from "@/components/YoursLogo";
import { BriefingCalendar } from "@/components/BriefingCalendar";
import { useWeatherPreview } from "@/hooks/useWeatherPreview";
import { useGmailHighlights, useCalendarToday } from "@/hooks/useGoogleData";

function minutesFromDuration(seconds: number | null, sectionsCount: number): number {
  if (seconds && seconds > 0) return Math.max(1, Math.round(seconds / 60));
  return Math.max(1, Math.round(sectionsCount * 1.5));
}

function formatEventTime(iso: string): string {
  if (!iso) return "";
  // All-day events are date-only (YYYY-MM-DD); display as "all day" rather than 12am.
  if (!iso.includes("T")) return "All day";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Strip the "Name <addr>" wrapper most senders use; fall back to whole string. */
function senderShort(from: string): string {
  if (!from) return "";
  const m = from.match(/^"?([^"<]+?)"?\s*<.*>$/);
  return (m ? m[1] : from).trim();
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
  // pendingGenerate stays true from the moment the user clicks until the query
  // confirms a generating briefing exists. This prevents the ~300ms flash back
  // to the old ready state that happens between triggering→false and the
  // React Query refetch completing.
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (triggering || pendingGenerate) return;
    setTriggering(true);
    setPendingGenerate(true);
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
      setPendingGenerate(false);
      toast.error(err instanceof Error ? err.message : "Couldn't generate briefing");
    } finally {
      setTriggering(false);
    }
  }, [triggering, pendingGenerate, user?.id, user?.home_address]);

  const calendarConnected = sources.some((s) => s.type === "calendar" && s.enabled);
  const gmailConnected = sources.some((s) => s.type === "gmail" && s.enabled);

  const latestBriefing = history[0] ?? null;
  const readyBriefing =
    latestBriefing?.status === "ready"
      ? latestBriefing
      : history.find((briefing) => briefing.status === "ready") ?? null;
  const generating = history.find((b) => b.status === "generating") ?? null;

  // Once the query confirms a generating briefing, we no longer need to hold
  // the pending state locally. Also clear if it fails fast (no generating row).
  useEffect(() => {
    if (generating) setPendingGenerate(false);
  }, [generating?.id]);

  const isGenerating = triggering || pendingGenerate || !!generating;

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

        {/* Today's briefing CTA — three mutually-exclusive states:
            1. Generating (triggering locally or backend is generating)
            2. Ready to play
            3. No briefing yet — prompt to generate */}
        <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" strokeWidth={2} />
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
            </div>
            <p className="text-white text-lg font-bold mb-3">Generating now…</p>
            <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-white/70"
                initial={{ width: "5%" }}
                animate={{ width: ["5%", "60%", "85%"] }}
                transition={{ duration: 180, ease: "easeOut" }}
              />
            </div>
            <p className="text-white/80 text-xs leading-relaxed">
              Expected in ~3 minutes. We'll text you the moment it's ready.
            </p>
          </motion.div>
        ) : readyBriefing ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <Clock className="h-3 w-3" />
                {minutesFromDuration(readyBriefing.audio_duration_seconds, readyBriefing.sections_count)} min
              </div>
            </div>
            <p className="text-white text-xl font-bold mb-1">Ready to play</p>
            <p className="text-white/70 text-xs mb-5">
              {readyBriefing.sections_count} sections · Weather, Calendar, News &amp; more
            </p>
            <Button
              onClick={() => navigate(`/b/${readyBriefing.id}`)}
              className="w-full h-12 rounded-xl bg-white hover:bg-white/90 text-neutral-900 font-semibold text-base shadow-md mb-2"
            >
              <Play className="h-5 w-5 mr-2" fill="currentColor" /> Play briefing
            </Button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full text-white/60 text-xs py-1 hover:text-white/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" /> Regenerate
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="yours-warm-gradient rounded-2xl p-6 mb-8 shadow-lg"
          >
            <p className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Today's Briefing</p>
            <p className="text-white text-lg font-bold mb-3">
              {isLoading
                ? "Loading..."
                : latestBriefing?.status === "failed"
                  ? "Today's briefing hit a snag"
                  : "Your first briefing is on the way"}
            </p>
            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Delivered at {deliveryLabel} ({user?.timezone ?? "your timezone"}). Or generate one right now.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={triggering}
              className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-neutral-900 font-semibold"
            >
              <Play className="h-4 w-4 mr-2" fill="currentColor" /> Generate now
            </Button>
          </motion.div>
        )}
        </AnimatePresence>

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

        {/* Inbox + calendar — Google integrations (minimal cards) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid sm:grid-cols-2 gap-3 mb-8"
        >
          <GmailHighlightsCard />
          <CalendarTodayCard />
        </motion.div>

        {/* Briefings calendar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold mb-3">Recent briefings</h2>

          {history.length === 0 && !isLoading ? (
            <div className="p-5 rounded-xl border border-dashed border-border bg-card text-center">
              <p className="text-sm font-medium mb-1">No briefings yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your first briefing will arrive at {deliveryLabel} in {user?.timezone ?? "your timezone"}.
              </p>
            </div>
          ) : (
            <BriefingCalendar briefings={history} isLoading={isLoading} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function GmailHighlightsCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useGmailHighlights();
  const items = data?.items ?? [];
  const connected = items.length > 0 || isLoading || data !== undefined;
  // `data === undefined` while disabled (no gmail source) — treat as disconnected.

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1.5 mb-2">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Inbox highlights</p>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </div>
      ) : !connected ? (
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="text-xs text-foreground font-medium inline-flex items-center gap-1 hover:underline"
        >
          Connect Gmail <ChevronRight className="h-3 w-3" />
        </button>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No new highlights today.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="text-xs leading-snug">
              <span className="font-medium">{senderShort(item.from)}</span>
              <span className="text-muted-foreground">: {item.subject}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalendarTodayCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useCalendarToday();
  const events = data?.events ?? [];
  const connected = events.length > 0 || isLoading || data !== undefined;

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today's calendar</p>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </div>
      ) : !connected ? (
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="text-xs text-foreground font-medium inline-flex items-center gap-1 hover:underline"
        >
          Connect Calendar <ChevronRight className="h-3 w-3" />
        </button>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing on the books.</p>
      ) : (
        <ul className="space-y-1.5">
          {events.slice(0, 4).map((e) => (
            <li key={e.id} className="text-xs leading-snug flex gap-2">
              <span className="text-muted-foreground tabular-nums shrink-0">{formatEventTime(e.start_iso)}</span>
              <span className="truncate">{e.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
