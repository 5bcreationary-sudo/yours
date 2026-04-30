// get-briefing
//
// Unified read for the player. Two access paths:
//   1. Signed-token visitor (from SMS link):   ?id=<uuid>&t=<jwt>
//   2. Authed owner (dashboard/app history):   Authorization: Bearer <user jwt>
//
// Returns:
//   { briefing, sections, audio_signed_url? }
//
// If status !== 'ready' we return 404 so the UI can show a retry state.

import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo } from "../_shared/errors.ts";
import { sha256Hex, verifyBriefingLink } from "../_shared/signed-links.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "GET") return json({ ok: false, error: "GET only" }, 405);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("t");
  if (!id) return json({ ok: false, error: "missing id" }, 400);

  let authorizedUserId: string | null = null;
  let viaToken = false;

  if (token) {
    const claims = await verifyBriefingLink(token);
    if (!claims || claims.briefing_id !== id) {
      return json({ ok: false, error: "invalid or expired token" }, 401);
    }
    authorizedUserId = claims.user_id;
    viaToken = true;
  } else {
    const uid = await getUserIdFromBearer(req.headers.get("Authorization"));
    if (!uid) return json({ ok: false, error: "auth required" }, 401);
    authorizedUserId = uid;
  }

  const supa = getServiceClient();
  const { data: briefing, error } = await supa
    .from("briefings")
    .select("id, user_id, date, status, listened_at, audio_url, audio_duration_seconds, section_offsets, token_hash, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return json({ ok: false, error: error.message }, 500);
  if (!briefing) return json({ ok: false, error: "not found" }, 404);

  if (viaToken) {
    const claims = await verifyBriefingLink(token!);
    if (!claims) return json({ ok: false, error: "invalid or expired token" }, 401);
    const tokenHash = await sha256Hex(claims.jti);
    if (
      briefing.user_id !== claims.user_id ||
      briefing.id !== claims.briefing_id ||
      !briefing.token_hash ||
      briefing.token_hash !== tokenHash
    ) {
      return json({ ok: false, error: "invalid or expired token" }, 401);
    }
  } else if (briefing.user_id !== authorizedUserId) {
    // Authed path must match ownership.
    return json({ ok: false, error: "forbidden" }, 403);
  }
  if (briefing.status !== "ready") {
    return json({ ok: false, error: "not ready", status: briefing.status }, 404);
  }

  const { data: sections } = await supa
    .from("briefing_sections")
    .select("id, briefing_id, type, title, summary, card_payload, order, duration_minutes")
    .eq("briefing_id", id)
    .order("order", { ascending: true });

  let audioSignedUrl: string | null = null;
  if (briefing.audio_url) {
    const signed = await supa.storage
      .from("briefing-audio")
      .createSignedUrl(briefing.audio_url, 60 * 60);
    audioSignedUrl = signed.data?.signedUrl ?? null;
  }

  logInfo("get-briefing.ok", { id, viaToken, sections: sections?.length ?? 0 });

  return json({
    ok: true,
    briefing: {
      id: briefing.id,
      user_id: briefing.user_id,
      date: briefing.date,
      status: briefing.status,
      listened_at: briefing.listened_at,
      audio_url: briefing.audio_url,
      audio_duration_seconds: briefing.audio_duration_seconds,
      section_offsets: briefing.section_offsets ?? null,
      created_at: briefing.created_at,
    },
    sections: sections ?? [],
    audio_signed_url: audioSignedUrl,
  });
});
