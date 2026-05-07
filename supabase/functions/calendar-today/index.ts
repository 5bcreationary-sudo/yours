// calendar-today
//
// Returns today's calendar events (in the user's timezone) for the authenticated
// user. Used by the AppHome "Today's calendar" card.
//
// GET with Authorization: Bearer <user-jwt>
// Returns: { ok, events: [{ id, summary, start_iso, end_iso, location? }], fetched_at }
//
// Degrades silently — on missing/expired Google connection or upstream error
// returns ok=true with events=[].

import { loadGoogleAccessToken } from "../_shared/oauth.ts";
import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, withTimeout } from "../_shared/errors.ts";

interface CalendarEventResp {
  id: string;
  summary: string;
  start_iso: string;
  end_iso: string;
  location?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "GET") return json({ ok: false, error: "GET only" }, 405);

  const userId = await getUserIdFromBearer(req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, error: "auth required" }, 401);

  const tok = await loadGoogleAccessToken({ userId, type: "calendar" });
  if (!tok) {
    return json({ ok: true, events: [], fetched_at: new Date().toISOString() });
  }

  // Look up the user's timezone so day boundaries match local midnight.
  const supa = getServiceClient();
  const { data: userRow } = await supa
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const timezone = (userRow?.timezone as string | undefined) ?? "UTC";

  // Compute today's range in the user's timezone.
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const startLocal = new Date(tzDate);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(tzDate);
  endLocal.setHours(23, 59, 59, 999);

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", startLocal.toISOString());
  url.searchParams.set("timeMax", endLocal.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "15");
  url.searchParams.set("timeZone", timezone);

  try {
    const res = await withTimeout(
      fetch(url.toString(), { headers: { Authorization: `Bearer ${tok.accessToken}` } }),
      8000,
      "calendar.list",
    );
    if (!res.ok) {
      logInfo("calendar-today.http_error", { status: res.status });
      return json({ ok: true, events: [], fetched_at: new Date().toISOString() });
    }
    const data = await res.json();
    const events: CalendarEventResp[] = (data.items ?? []).map((e: Record<string, unknown>) => {
      const start = e.start as { dateTime?: string; date?: string } | undefined;
      const end = e.end as { dateTime?: string; date?: string } | undefined;
      return {
        id: (e.id as string) ?? "",
        summary: (e.summary as string) ?? "(no title)",
        start_iso: start?.dateTime ?? start?.date ?? "",
        end_iso: end?.dateTime ?? end?.date ?? "",
        location: e.location as string | undefined,
      };
    });

    return json({ ok: true, events, fetched_at: new Date().toISOString() });
  } catch (err) {
    logInfo("calendar-today.error", { err: String(err) });
    return json({ ok: true, events: [], fetched_at: new Date().toISOString() });
  }
});
