// Real Supabase client + typed data-access helpers used across the app.
// Edge function contracts live in supabase/functions/**; call them via
// invokeFunction() below so signed-link and authed paths share one entry.

import { createClient } from "@supabase/supabase-js";
import type {
  Briefing,
  BriefingListItem,
  BriefingSection,
  BriefingWithSections,
  CalendarEvent,
  GmailHighlight,
  UserInterest,
  UserProfile,
  UserSource,
} from "@/types/database";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const APP_BASE_URL =
  (import.meta.env.VITE_APP_BASE_URL as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "https://yours.fm");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear message in dev rather than letting createClient throw opaquely.
  // Landing page still renders because this module isn't imported there.
  console.warn(
    "[yours] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth + data queries will fail. Copy .env.example to .env.local.",
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? "http://localhost:54321",
  SUPABASE_ANON_KEY ?? "anon",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "yours-auth",
    },
  },
);

// ---------- profile ----------

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProfile | null) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserProfile;
}

// ---------- interests ----------

export async function getInterests(userId: string): Promise<UserInterest | null> {
  const { data, error } = await supabase
    .from("user_interests")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserInterest | null) ?? null;
}

export async function upsertInterests(
  userId: string,
  patch: Pick<UserInterest, "freeform_text" | "selected_packages" | "tags">,
): Promise<UserInterest> {
  const { data, error } = await supabase
    .from("user_interests")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserInterest;
}

// ---------- sources ----------

export async function listSources(userId: string): Promise<UserSource[]> {
  const { data, error } = await supabase
    .from("user_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as UserSource[]) ?? [];
}

export async function addRssSource(
  userId: string,
  feed: { url: string; name?: string; preset_id?: string },
): Promise<UserSource> {
  const { data, error } = await supabase
    .from("user_sources")
    .insert({ user_id: userId, type: "rss", config: feed, enabled: true })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserSource;
}

export async function removeSource(id: string): Promise<void> {
  const { error } = await supabase.from("user_sources").delete().eq("id", id);
  if (error) throw error;
}

export async function setSourceEnabled(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from("user_sources").update({ enabled }).eq("id", id);
  if (error) throw error;
}

// ---------- briefings ----------

export async function listRecentBriefings(userId: string, limit = 10): Promise<Briefing[]> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Briefing[]) ?? [];
}

export async function listRecentBriefingsWithCounts(
  userId: string,
  limit = 60,
): Promise<BriefingListItem[]> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*, briefing_sections(title, order)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const raw = row as Briefing & {
      briefing_sections?: Array<{ title: string; order: number }>;
    };
    const sections = (raw.briefing_sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order);
    return {
      ...(raw as Briefing),
      sections_count: sections.length,
      preview_titles: sections.slice(0, 2).map((s) => s.title),
    };
  });
}

export async function getLatestBriefing(userId: string): Promise<Briefing | null> {
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Briefing | null) ?? null;
}

/** Read the persisted JWT directly from localStorage. Bypasses
 *  supabase.auth.getSession() which can hang on page reload (cross-tab
 *  Web Lock contention in supabase-js v2). See useAuth.ts for the same fix. */
function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("yours-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const stored = parsed?.access_token ? parsed : parsed?.currentSession;
    if (stored?.access_token && stored?.expires_at && stored.expires_at * 1000 > Date.now()) {
      return stored.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a briefing + sections for the player. Works for:
 *   - signed-link visitors: pass the `t` query param from the URL
 *   - authed owner: omit token; the user's bearer is attached automatically
 *
 * Calls the get-briefing edge function so both paths share one entry point
 * (and the same status/404 semantics).
 */
export async function getBriefingForPlayer(
  id: string,
  token?: string | null,
): Promise<(BriefingWithSections & { audio_signed_url: string | null }) | null> {
  const url = new URL(`${SUPABASE_URL}/functions/v1/get-briefing`);
  url.searchParams.set("id", id);
  if (token) url.searchParams.set("t", token);

  const headers: Record<string, string> = { apikey: SUPABASE_ANON_KEY };
  if (!token) {
    const jwt = getStoredAccessToken();
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get-briefing ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    briefing: Briefing;
    sections: BriefingSection[];
    audio_signed_url: string | null;
  };
  return { ...body.briefing, sections: body.sections, audio_signed_url: body.audio_signed_url };
}

export async function markBriefingListened(id: string): Promise<void> {
  // Authed owners can mark listened through the RPC. Signed-link visitors
  // currently read through the edge function but don't present a Supabase JWT.
  await supabase.rpc("mark_briefing_listened", { p_briefing_id: id });
}

// ---------- edge-function invokers ----------

/**
 * Trigger a new briefing for the current user. Calls `trigger-briefing`
 * which creates the briefing row and dispatches the pipeline with service_role
 * auth. The user's JWT is sent automatically via supabase.functions.invoke.
 */
export async function triggerBriefing(opts?: {
  location?: { lat: number; lng: number; city: string };
}): Promise<{ briefing_id: string }> {
  const accessToken = getStoredAccessToken();
  if (!accessToken) throw new Error("Not signed in");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/trigger-briefing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(opts?.location ? { location: opts.location } : {}),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error ?? `trigger failed (${res.status})`);
  return { briefing_id: body.briefing_id };
}

/**
 * Mint a public share URL for one of the current user's briefings.
 * The URL points to /listen/:id?t=<jwt>, a sign-up gate. Visitors
 * must create an account before the player loads.
 *
 * Pass `opts.sectionIndex` to share a specific section — the returned URL
 * carries `&s=<index>`, which the Player reads to seek into that section.
 * The JWT itself does NOT encode the section; it's a UI hint only.
 */
export async function shareBriefing(
  briefingId: string,
  opts?: { sectionIndex?: number },
): Promise<{ url: string; expires_at: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const body: Record<string, unknown> = { briefing_id: briefingId };
  if (typeof opts?.sectionIndex === "number" && Number.isFinite(opts.sectionIndex)) {
    body.section_index = opts.sectionIndex;
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/share-briefing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const respBody = await res.json();
  if (!res.ok || !respBody.ok) throw new Error(respBody.error ?? `share failed (${res.status})`);
  return { url: respBody.url, expires_at: respBody.expires_at };
}

// ---------- Google integrations ----------

export async function fetchGmailHighlights(): Promise<{ items: GmailHighlight[]; fetched_at: string }> {
  const accessToken = getStoredAccessToken();
  if (!accessToken) throw new Error("Not signed in");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/gmail-summary`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error ?? `gmail-summary failed (${res.status})`);
  return { items: body.items ?? [], fetched_at: body.fetched_at };
}

export async function fetchCalendarToday(): Promise<{ events: CalendarEvent[]; fetched_at: string }> {
  const accessToken = getStoredAccessToken();
  if (!accessToken) throw new Error("Not signed in");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/calendar-today`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error ?? `calendar-today failed (${res.status})`);
  return { events: body.events ?? [], fetched_at: body.fetched_at };
}

/**
 * Permanently delete the current user's account and all associated data.
 */
export async function deleteAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error ?? `delete failed (${res.status})`);
}
