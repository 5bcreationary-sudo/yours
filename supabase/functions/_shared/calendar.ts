// Google Calendar: today's events in the user's timezone.

import { loadGoogleAccessToken } from "./oauth.ts";
import { withTimeout, logInfo } from "./errors.ts";

export interface CalendarEvent {
  start: string;
  end?: string;
  summary: string;
  location?: string;
  hangoutLink?: string;
}

export async function fetchTodayCalendar(params: {
  userId: string;
  timezone: string;
}): Promise<CalendarEvent[]> {
  const tok = await loadGoogleAccessToken({ userId: params.userId, type: "calendar" });
  if (!tok) return [];

  // Compute timeMin/Max in user TZ — the API accepts an explicit timeZone.
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: params.timezone }));
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
  url.searchParams.set("timeZone", params.timezone);

  try {
    const res = await withTimeout(
      fetch(url.toString(), { headers: { Authorization: `Bearer ${tok.accessToken}` } }),
      8000,
      "calendar.list",
    );
    if (!res.ok) {
      logInfo("calendar.http_error", { status: res.status });
      return [];
    }
    const data = await res.json();
    return (data.items ?? []).map((e: Record<string, unknown>) => {
      const start = (e.start as { dateTime?: string; date?: string } | undefined);
      const end = (e.end as { dateTime?: string; date?: string } | undefined);
      return {
        start: start?.dateTime ?? start?.date ?? "",
        end: end?.dateTime ?? end?.date,
        summary: (e.summary as string) ?? "(no title)",
        location: e.location as string | undefined,
        hangoutLink: e.hangoutLink as string | undefined,
      } satisfies CalendarEvent;
    });
  } catch (err) {
    logInfo("calendar.error", { err: String(err) });
    return [];
  }
}
