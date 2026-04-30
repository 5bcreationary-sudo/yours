// send-sms
//
// Twilio dispatcher. v1: stubbed unless TWILIO_* env vars are set — in that
// case the function logs intended payload and returns ok:true, stubbed:true
// so the pipeline never blocks. v1.1 flips to real sends once A2P 10DLC is
// provisioned.
//
// Body: { user_id, briefing_id, link? }
// The pipeline passes link; if absent we mint a fresh signed one.

import { getServiceClient, isServiceRoleBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, logError } from "../_shared/errors.ts";
import { sha256Hex, signBriefingLink } from "../_shared/signed-links.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  if (!isServiceRoleBearer(req.headers.get("Authorization"))) {
    return json({ ok: false, error: "service role required" }, 401);
  }

  let body: { user_id?: string; briefing_id?: string; link?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  if (!body.user_id || !body.briefing_id) {
    return json({ ok: false, error: "missing ids" }, 400);
  }

  const supa = getServiceClient();
  const { data: user } = await supa
    .from("users")
    .select("phone_e164, full_name")
    .eq("id", body.user_id)
    .maybeSingle();
  if (!user?.phone_e164) {
    logInfo("sms.no_phone", { user_id: body.user_id });
    return json({ ok: true, stubbed: true, reason: "no phone" });
  }

  let link = body.link;
  if (!link) {
    const { token, jti } = await signBriefingLink(body.briefing_id, body.user_id);
    const tokenHash = await sha256Hex(jti);
    await supa.from("briefings").update({ token_hash: tokenHash }).eq("id", body.briefing_id);
    link = `${Deno.env.get("APP_BASE_URL") ?? "https://yours.fm"}/b/${body.briefing_id}?t=${token}`;
  }

  const greeting = user.full_name ? `Good morning, ${user.full_name.split(" ")[0]}` : "Good morning";
  const message = `${greeting} — your Yours briefing is ready. ${link}`;

  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const tok = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!sid || !tok || !from) {
    logInfo("sms.stubbed", { to: user.phone_e164, message });
    return json({ ok: true, stubbed: true, message });
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const basic = btoa(`${sid}:${tok}`);
  const form = new URLSearchParams({ From: from, To: user.phone_e164, Body: message });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    if (!res.ok) {
      const errTxt = await res.text();
      logError("sms.twilio_error", { status: res.status, errTxt });
      return json({ ok: false, error: `twilio ${res.status}` }, 502);
    }
    const data = await res.json();
    logInfo("sms.sent", { sid: data.sid, to: user.phone_e164 });
    return json({ ok: true, sid: data.sid });
  } catch (err) {
    logError("sms.exception", { err: String(err) });
    return json({ ok: false, error: String(err) }, 500);
  }
});
