// google-oauth-callback
//
// Supabase's Google OAuth flow does not persist provider_refresh_token. The
// browser captures it from the session (only present on first consent when
// access_type=offline&prompt=consent) and POSTs it here. We encrypt and store
// in user_sources so the pipeline can read Gmail/Calendar on the user's
// behalf in the morning.
//
// Bearer (user's supabase access token) required. verify_jwt=true in config.
//
// Body: {
//   provider_refresh_token: string,
//   provider_token?: string,
//   expires_in?: number,      // seconds; default 3600
//   scopes?: string           // space-separated
// }

import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { encrypt } from "../_shared/crypto.ts";
import { json, cors, logInfo } from "../_shared/errors.ts";

interface Body {
  provider_refresh_token: string;
  provider_token?: string;
  expires_in?: number;
  scopes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const userId = await getUserIdFromBearer(req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, error: "auth required" }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  if (!body.provider_refresh_token) {
    return json({ ok: false, error: "missing provider_refresh_token" }, 400);
  }

  const refreshEnc = await encrypt(body.provider_refresh_token);
  const accessEnc = body.provider_token ? await encrypt(body.provider_token) : null;
  const expiresAt = new Date(Date.now() + (body.expires_in ?? 3600) * 1000).toISOString();
  const scopes = body.scopes ?? "";

  const supa = getServiceClient();

  // Upsert both gmail and calendar rows if the scope was granted.
  const wantsGmail = scopes.includes("gmail.readonly") || scopes.includes("gmail.metadata");
  const wantsCal   = scopes.includes("calendar.readonly") || scopes.includes("calendar");

  const rows: Array<{ user_id: string; type: "gmail" | "calendar"; config: unknown; enabled: boolean }> = [];
  const cfg = {
    provider: "google",
    refresh_token_enc: refreshEnc,
    access_token_enc: accessEnc,
    expires_at: expiresAt,
    scopes,
  };
  if (wantsGmail) rows.push({ user_id: userId, type: "gmail", config: cfg, enabled: true });
  if (wantsCal)   rows.push({ user_id: userId, type: "calendar", config: cfg, enabled: true });

  if (rows.length === 0) {
    return json({ ok: true, warning: "no google scope in payload; nothing stored" });
  }

  for (const row of rows) {
    // Manual upsert — user_sources has no natural unique for (user_id, type),
    // so we delete-then-insert to avoid duplicates.
    await supa.from("user_sources").delete().eq("user_id", userId).eq("type", row.type);
    const ins = await supa.from("user_sources").insert(row);
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
  }

  logInfo("google.tokens_stored", { userId, wantsGmail, wantsCal });
  return json({ ok: true, stored: rows.map((r) => r.type) });
});
