// Google OAuth refresh helpers. Edge-side: exchange a stored refresh_token
// for a fresh access_token when the cached one is near expiry.

import { decrypt, encrypt } from "./crypto.ts";
import { getServiceClient } from "./supabase.ts";
import { logInfo } from "./errors.ts";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google client credentials not set");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

// Load a Google-type user_source and return a usable access_token. Refreshes
// + re-encrypts + persists if the cached token has expired (or within 60s).
export async function loadGoogleAccessToken(params: {
  userId: string;
  type: "gmail" | "calendar";
}): Promise<{ accessToken: string; scopes: string } | null> {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from("user_sources")
    .select("id, config, enabled")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) return null;
  const cfg = (data.config ?? {}) as Record<string, unknown>;
  const refreshEnc = cfg.refresh_token_enc as string | undefined;
  if (!refreshEnc) return null;

  const expiresAt = cfg.expires_at ? new Date(cfg.expires_at as string).getTime() : 0;
  const accessEnc = cfg.access_token_enc as string | undefined;
  const scopes = (cfg.scopes as string) ?? "";

  if (accessEnc && expiresAt - Date.now() > 60_000) {
    const cached = await decrypt(accessEnc);
    return { accessToken: cached, scopes };
  }

  // Refresh
  const refreshToken = await decrypt(refreshEnc);
  try {
    const fresh = await refreshGoogleAccessToken(refreshToken);
    const newAccessEnc = await encrypt(fresh.access_token);
    const newExpiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
    await supa
      .from("user_sources")
      .update({
        config: {
          ...cfg,
          access_token_enc: newAccessEnc,
          expires_at: newExpiresAt,
          scopes: fresh.scope ?? scopes,
        },
      })
      .eq("id", data.id);
    return { accessToken: fresh.access_token, scopes: fresh.scope ?? scopes };
  } catch (err) {
    logInfo("oauth.refresh_failed", { userId: params.userId, type: params.type, err: String(err) });
    return null;
  }
}
