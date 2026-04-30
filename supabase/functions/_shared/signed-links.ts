// HS256 signed JWTs for public player links: yours.fm/b/<id>?t=<jwt>.
// 72h expiry. Claims: { briefing_id, user_id, iat, exp, jti, aud }.

import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const TOKEN_TTL_SECONDS = 72 * 3600;

async function getSigningKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("BRIEFING_LINK_JWT_SECRET");
  if (!secret) throw new Error("BRIEFING_LINK_JWT_SECRET not set");
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface BriefingLinkClaims {
  briefing_id: string;
  user_id: string;
  iat: number;
  exp: number;
  jti: string;
  aud: "yours-player";
}

export async function signBriefingLink(
  briefingId: string,
  userId: string,
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const key = await getSigningKey();
  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const token = await create(
    { alg: "HS256", typ: "JWT" },
    {
      briefing_id: briefingId,
      user_id: userId,
      iat: now,
      exp,
      jti,
      aud: "yours-player",
    },
    key,
  );
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

export async function verifyBriefingLink(token: string): Promise<BriefingLinkClaims | null> {
  try {
    const key = await getSigningKey();
    const claims = await verify(token, key) as BriefingLinkClaims;
    if (claims.aud !== "yours-player") return null;
    if (!claims.briefing_id || !claims.user_id) return null;
    // djwt already enforces exp
    return claims;
  } catch {
    return null;
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export { getNumericDate };
