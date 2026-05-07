// share-briefing
//
// Lets the authenticated owner of a briefing mint a 30-day signed link that
// points at the public sign-up gate (/listen/:id?t=<jwt>).
//
// POST with Authorization: Bearer <user-jwt>
// Body: { briefing_id: string, section_index?: number }
// Returns: { ok, url, token, expires_at }
//
// When `section_index` is provided and valid (0 ≤ n < section count), the
// returned URL carries `&s=<n>` so the Player can deep-link to that section.
// The JWT itself does NOT encode the section — it's a UI hint, not auth scope.

import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, logError } from "../_shared/errors.ts";
import { signBriefingLink, sha256Hex } from "../_shared/signed-links.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const userId = await getUserIdFromBearer(req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, error: "auth required" }, 401);

  let body: { briefing_id?: string; section_index?: number };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  if (!body.briefing_id) return json({ ok: false, error: "missing briefing_id" }, 400);

  const supa = getServiceClient();
  const { data: briefing, error } = await supa
    .from("briefings")
    .select("id, user_id, status")
    .eq("id", body.briefing_id)
    .maybeSingle();
  if (error) return json({ ok: false, error: error.message }, 500);
  if (!briefing) return json({ ok: false, error: "briefing not found" }, 404);
  if (briefing.user_id !== userId) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  if (briefing.status !== "ready") {
    return json({ ok: false, error: "briefing not ready yet" }, 400);
  }

  // Validate section_index against actual section count when provided.
  let validSectionIndex: number | null = null;
  if (typeof body.section_index === "number" && Number.isInteger(body.section_index) && body.section_index >= 0) {
    const { count } = await supa
      .from("briefing_sections")
      .select("id", { count: "exact", head: true })
      .eq("briefing_id", briefing.id);
    if (count != null && body.section_index < count) {
      validSectionIndex = body.section_index;
    }
  }

  try {
    const { token, jti, expiresAt } = await signBriefingLink(briefing.id, briefing.user_id);
    const tokenHash = await sha256Hex(jti);
    await supa.from("briefings").update({ token_hash: tokenHash }).eq("id", briefing.id);

    const baseUrl = Deno.env.get("APP_BASE_URL") ?? "https://yours.fm";
    const sectionSuffix = validSectionIndex !== null ? `&s=${validSectionIndex}` : "";
    const url = `${baseUrl}/listen/${briefing.id}?t=${token}${sectionSuffix}`;

    logInfo("share.minted", { briefingId: briefing.id, userId, sectionIndex: validSectionIndex });
    return json({ ok: true, url, token, expires_at: expiresAt.toISOString() });
  } catch (err) {
    logError("share.failed", { briefingId: briefing.id, err: String(err) });
    return json({ ok: false, error: String(err) }, 500);
  }
});
