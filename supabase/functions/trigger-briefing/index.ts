// trigger-briefing
//
// Manual briefing trigger for authenticated users. Finds or creates today's
// briefing row, resets it to pending, then calls the main pipeline with
// service_role auth so the user doesn't need elevated permissions.
//
// POST with Authorization: Bearer <user-jwt>
// Body: {} (empty or omit)
//
// Returns: { ok: true, briefing_id }

import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, logError } from "../_shared/errors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const auth = req.headers.get("Authorization");
  const userId = await getUserIdFromBearer(auth);
  if (!userId) {
    return json({ ok: false, error: "authentication required" }, 401);
  }

  const supa = getServiceClient();

  // Optional: set location if provided in body.
  let body: { location?: { lat: number; lng: number; city: string } } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }
  if (body.location?.lat != null && body.location?.lng != null) {
    await supa
      .from("users")
      .update({ home_address: body.location })
      .eq("id", userId);
    logInfo("trigger.location_set", { userId, city: body.location.city });
  }

  // Use the user's timezone so "today" matches their local date, not UTC.
  const { data: profile } = await supa
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const tz = (profile?.timezone as string) || "America/New_York";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD

  // Check for an existing briefing today.
  const { data: existing } = await supa
    .from("briefings")
    .select("id, status")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  // If one is already generating, don't stack another.
  if (existing?.status === "generating") {
    return json({ ok: false, error: "briefing already generating", briefing_id: existing.id }, 409);
  }

  let briefingId: string;

  if (existing) {
    // Reset the existing row so the pipeline can re-run it.
    const { error: updateErr } = await supa
      .from("briefings")
      .update({
        status: "pending",
        error: null,
        audio_url: null,
        audio_duration_seconds: null,
        generation_started_at: null,
        generation_completed_at: null,
      })
      .eq("id", existing.id);

    if (updateErr) {
      logError("trigger.reset_failed", { userId, err: updateErr.message });
      return json({ ok: false, error: updateErr.message }, 500);
    }

    // Clear old sections so the pipeline writes fresh ones.
    await supa.from("briefing_sections").delete().eq("briefing_id", existing.id);

    briefingId = existing.id;
    logInfo("trigger.reset", { briefingId, userId, prevStatus: existing.status });
  } else {
    // No briefing today — create one.
    const { data: briefing, error: insertErr } = await supa
      .from("briefings")
      .insert({ user_id: userId, date: today, status: "pending" })
      .select("id")
      .single();

    if (insertErr || !briefing) {
      logError("trigger.insert_failed", { userId, err: insertErr?.message });
      return json({ ok: false, error: insertErr?.message ?? "could not create briefing" }, 500);
    }
    briefingId = briefing.id;
    logInfo("trigger.created", { briefingId, userId });
  }

  // Call the main pipeline internally with service_role auth.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const pipelineUrl = `${supabaseUrl}/functions/v1/generate-morning-briefing`;

  // Wrap the pipeline dispatch in EdgeRuntime.waitUntil so Supabase keeps the
  // isolate alive long enough for the request to complete. Without this the
  // isolate may be terminated when we return the Response, killing the
  // dispatch and leaving the briefing stuck in 'pending' until the next cron
  // tick (up to 60s of "loads forever" for the user).
  const dispatchPromise = fetch(pipelineUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ briefing_id: briefingId, user_id: userId, manual: true }),
  }).catch((err) => {
    logError("trigger.pipeline_dispatch_error", { briefingId, err: String(err) });
  });

  // EdgeRuntime is the Supabase-specific globals; fall back to a plain await
  // race if not available (e.g. local Deno).
  const er = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (er?.waitUntil) {
    er.waitUntil(dispatchPromise);
  }

  return json({ ok: true, briefing_id: briefingId });
});
