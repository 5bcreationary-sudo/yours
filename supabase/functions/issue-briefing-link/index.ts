// issue-briefing-link
//
// Mint a signed 72h JWT link for a briefing. Called internally by the
// pipeline and (optionally) by a Settings "Copy share link" action for
// the owner. Service-role only in v1.
//
// Body: { briefing_id: string }
// Returns: { token, url, expires_at }

import { getServiceClient, isServiceRoleBearer } from "../_shared/supabase.ts";
import { json, cors } from "../_shared/errors.ts";
import { signBriefingLink, sha256Hex } from "../_shared/signed-links.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  if (!isServiceRoleBearer(req.headers.get("Authorization"))) {
    return json({ ok: false, error: "service role required" }, 401);
  }

  let body: { briefing_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  if (!body.briefing_id) return json({ ok: false, error: "missing briefing_id" }, 400);

  const supa = getServiceClient();
  const { data: briefing, error } = await supa
    .from("briefings")
    .select("id, user_id")
    .eq("id", body.briefing_id)
    .maybeSingle();
  if (error) return json({ ok: false, error: error.message }, 500);
  if (!briefing) return json({ ok: false, error: "not found" }, 404);

  const { token, jti, expiresAt } = await signBriefingLink(briefing.id, briefing.user_id);
  const tokenHash = await sha256Hex(jti);
  await supa.from("briefings").update({ token_hash: tokenHash }).eq("id", briefing.id);

  const baseUrl = Deno.env.get("APP_BASE_URL") ?? "https://yours.fm";
  return json({
    ok: true,
    token,
    url: `${baseUrl}/b/${briefing.id}?t=${token}`,
    expires_at: expiresAt.toISOString(),
  });
});
