// delete-account
//
// Permanently deletes the authenticated user's account and all associated data.
// Uses service_role to delete from auth.users (which cascades to public.users
// via the foreign key). Briefing audio files are also removed from storage.
//
// POST with Authorization: Bearer <user-jwt>
// Returns: { ok: true }

import { getServiceClient, getUserIdFromBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, logError } from "../_shared/errors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const userId = await getUserIdFromBearer(req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, error: "authentication required" }, 401);

  const supa = getServiceClient();

  try {
    // Delete briefing audio files from storage
    const { data: briefings } = await supa
      .from("briefings")
      .select("id, audio_url")
      .eq("user_id", userId);

    if (briefings?.length) {
      const audioPaths = briefings
        .map((b) => b.audio_url)
        .filter(Boolean)
        .map((url: string) => {
          // Extract path from storage URL: .../object/public/briefing-audio/path
          const match = url.match(/briefing-audio\/(.+)$/);
          return match?.[1] ?? null;
        })
        .filter(Boolean) as string[];

      if (audioPaths.length > 0) {
        await supa.storage.from("briefing-audio").remove(audioPaths);
      }
    }

    // Delete all user data (briefing_sections cascade from briefings)
    await supa.from("briefing_sections").delete().in(
      "briefing_id",
      (briefings ?? []).map((b) => b.id),
    );
    await supa.from("briefings").delete().eq("user_id", userId);
    await supa.from("user_sources").delete().eq("user_id", userId);
    await supa.from("user_interests").delete().eq("user_id", userId);
    await supa.from("users").delete().eq("id", userId);

    // Delete the auth user (this is permanent)
    const { error: authErr } = await supa.auth.admin.deleteUser(userId);
    if (authErr) {
      logError("delete_account.auth_delete_failed", { userId, err: authErr.message });
      return json({ ok: false, error: "Failed to delete auth account: " + authErr.message }, 500);
    }

    logInfo("delete_account.success", { userId });
    return json({ ok: true });
  } catch (err) {
    logError("delete_account.failed", { userId, err: String(err) });
    return json({ ok: false, error: String(err) }, 500);
  }
});
