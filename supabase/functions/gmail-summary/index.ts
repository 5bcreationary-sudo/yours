// gmail-summary
//
// Returns up to 5 important / unread primary-inbox messages from the past 24h
// for the authenticated user. Used by the AppHome "Inbox highlights" card.
//
// GET with Authorization: Bearer <user-jwt>
// Returns: { ok, items: [{ from, subject, snippet, received_at }], fetched_at }
//
// Degrades silently — on missing/expired Google connection or upstream error
// returns ok=true with items=[] so the UI shows an empty state instead of an
// error toast.

import { loadGoogleAccessToken } from "../_shared/oauth.ts";
import { getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, withTimeout } from "../_shared/errors.ts";

interface GmailHighlight {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  received_at: string;
}

const LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "GET") return json({ ok: false, error: "GET only" }, 405);

  const userId = await getUserIdFromBearer(req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, error: "auth required" }, 401);

  const tok = await loadGoogleAccessToken({ userId, type: "gmail" });
  if (!tok) {
    return json({ ok: true, items: [], fetched_at: new Date().toISOString() });
  }

  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", "(is:important OR is:starred) newer_than:1d category:primary");
  listUrl.searchParams.set("maxResults", String(LIMIT));

  const headers = { Authorization: `Bearer ${tok.accessToken}` };
  try {
    const list = await withTimeout(fetch(listUrl.toString(), { headers }), 8000, "gmail.list");
    if (!list.ok) {
      logInfo("gmail-summary.list_error", { status: list.status });
      return json({ ok: true, items: [], fetched_at: new Date().toISOString() });
    }
    const { messages } = (await list.json()) as { messages?: Array<{ id: string }> };
    if (!messages?.length) {
      return json({ ok: true, items: [], fetched_at: new Date().toISOString() });
    }

    const details = await Promise.allSettled(
      messages.slice(0, LIMIT).map(async (m): Promise<GmailHighlight | null> => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`);
        url.searchParams.set("format", "metadata");
        url.searchParams.append("metadataHeaders", "From");
        url.searchParams.append("metadataHeaders", "Subject");
        url.searchParams.append("metadataHeaders", "Date");
        const r = await withTimeout(fetch(url.toString(), { headers }), 5000, "gmail.get");
        if (!r.ok) return null;
        const d = await r.json();
        const hdrs = (d.payload?.headers ?? []) as Array<{ name: string; value: string }>;
        const from = hdrs.find((h) => h.name === "From")?.value ?? "";
        const subject = hdrs.find((h) => h.name === "Subject")?.value ?? "";
        const dateHeader = hdrs.find((h) => h.name === "Date")?.value ?? "";
        // internalDate is ms-since-epoch as a string; falls back to Date header.
        const internalMs = typeof d.internalDate === "string" ? Number(d.internalDate) : NaN;
        const receivedAt = Number.isFinite(internalMs)
          ? new Date(internalMs).toISOString()
          : dateHeader
            ? new Date(dateHeader).toISOString()
            : new Date().toISOString();
        return {
          id: m.id,
          from,
          subject,
          snippet: (d.snippet as string) ?? "",
          received_at: receivedAt,
        };
      }),
    );

    const items = details
      .filter((d): d is PromiseFulfilledResult<GmailHighlight | null> => d.status === "fulfilled")
      .map((d) => d.value)
      .filter((v): v is GmailHighlight => !!v);

    return json({ ok: true, items, fetched_at: new Date().toISOString() });
  } catch (err) {
    logInfo("gmail-summary.error", { err: String(err) });
    return json({ ok: true, items: [], fetched_at: new Date().toISOString() });
  }
});
