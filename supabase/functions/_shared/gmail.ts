// Gmail: fetch the last ~24h of unread primary-inbox messages and return a
// lightweight [{from, subject, snippet}] array for the LLM.

import { loadGoogleAccessToken } from "./oauth.ts";
import { withTimeout, logInfo } from "./errors.ts";

export interface GmailSnippet {
  from: string;
  subject: string;
  snippet: string;
}

export async function fetchGmailSummaries(userId: string, limit = 10): Promise<GmailSnippet[]> {
  const tok = await loadGoogleAccessToken({ userId, type: "gmail" });
  if (!tok) return [];

  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", "newer_than:1d is:unread category:primary");
  listUrl.searchParams.set("maxResults", String(limit));

  const headers = { Authorization: `Bearer ${tok.accessToken}` };
  try {
    const list = await withTimeout(fetch(listUrl.toString(), { headers }), 8000, "gmail.list");
    if (!list.ok) {
      logInfo("gmail.list_error", { status: list.status });
      return [];
    }
    const { messages } = await list.json();
    if (!messages?.length) return [];

    const details = await Promise.allSettled(
      (messages as Array<{ id: string }>).map(async (m) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`);
        url.searchParams.set("format", "metadata");
        url.searchParams.set("metadataHeaders", "From");
        url.searchParams.set("metadataHeaders", "Subject");
        const r = await withTimeout(fetch(url.toString(), { headers }), 5000, "gmail.get");
        if (!r.ok) return null;
        const d = await r.json();
        const hdrs = (d.payload?.headers ?? []) as Array<{ name: string; value: string }>;
        const from = hdrs.find((h) => h.name === "From")?.value ?? "";
        const subject = hdrs.find((h) => h.name === "Subject")?.value ?? "";
        return { from, subject, snippet: d.snippet ?? "" } satisfies GmailSnippet;
      }),
    );
    return details
      .filter((d): d is PromiseFulfilledResult<GmailSnippet | null> => d.status === "fulfilled")
      .map((d) => d.value)
      .filter((v): v is GmailSnippet => !!v);
  } catch (err) {
    logInfo("gmail.error", { err: String(err) });
    return [];
  }
}
