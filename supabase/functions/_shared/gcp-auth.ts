// Shared GCP service account auth for Vertex AI + Cloud TTS.
//
// Signs a JWT with the service account private key, exchanges it for an
// access token via Google's OAuth2 endpoint, and caches the token until
// 5 minutes before expiry.
//
// Credentials resolved in order:
//   1. SERVICE_ACCOUNT_JSON — the entire service account JSON (one secret)
//   2. GCP_PRIVATE_KEY_B64  — base64-encoded PEM key (+ GCP_CLIENT_EMAIL)
//   3. GCP_PRIVATE_KEY      — raw PEM key (+ GCP_CLIENT_EMAIL)

interface ServiceAccountCreds {
  clientEmail: string;
  privateKey: string;
  projectId: string;
}

let resolvedCreds: ServiceAccountCreds | null = null;

/** Parse and cache service account credentials from env. */
export function getServiceAccountCreds(): ServiceAccountCreds {
  if (resolvedCreds) return resolvedCreds;

  // Option 1a: Base64-encoded JSON (safest — no shell escaping issues).
  const b64Json = Deno.env.get("SERVICE_ACCOUNT_JSON_B64");
  if (b64Json) {
    const sa = JSON.parse(atob(b64Json));
    resolvedCreds = {
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
      projectId: sa.project_id,
    };
    return resolvedCreds;
  }

  // Option 1b: Raw JSON blob.
  const jsonStr = Deno.env.get("SERVICE_ACCOUNT_JSON");
  if (jsonStr) {
    const sa = JSON.parse(jsonStr);
    resolvedCreds = {
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
      projectId: sa.project_id,
    };
    return resolvedCreds;
  }

  // Option 2: Separate secrets.
  const clientEmail = Deno.env.get("GCP_CLIENT_EMAIL");
  const b64 = Deno.env.get("GCP_PRIVATE_KEY_B64");
  const raw = Deno.env.get("GCP_PRIVATE_KEY");
  const privateKey = b64 ? atob(b64) : raw ? raw.replace(/\\n/g, "\n") : null;
  const projectId = Deno.env.get("GCP_PROJECT_ID") ?? "";

  if (!clientEmail || !privateKey) {
    throw new Error(
      "GCP credentials not found. Set SERVICE_ACCOUNT_JSON or GCP_CLIENT_EMAIL + GCP_PRIVATE_KEY",
    );
  }

  resolvedCreds = { clientEmail, privateKey, projectId };
  return resolvedCreds;
}

/** Returns true if any GCP service account credentials are configured. */
export function hasGcpCredentials(): boolean {
  return !!(
    Deno.env.get("SERVICE_ACCOUNT_JSON_B64") ||
    Deno.env.get("SERVICE_ACCOUNT_JSON") ||
    (Deno.env.get("GCP_CLIENT_EMAIL") &&
      (Deno.env.get("GCP_PRIVATE_KEY") || Deno.env.get("GCP_PRIVATE_KEY_B64")))
  );
}

// --- Crypto helpers -------------------------------------------------------

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64url(input: Uint8Array | string): string {
  const str =
    typeof input === "string"
      ? btoa(input)
      : btoa(String.fromCharCode(...input));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- Token exchange -------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Returns a GCP access token using the service account credentials. */
export async function getGcpAccessToken(): Promise<string> {
  const creds = getServiceAccountCreds();

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    return cachedToken.token;
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    }),
  );

  const key = await importPrivateKey(creds.privateKey);
  const sigInput = new TextEncoder().encode(`${header}.${payload}`);
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, sigInput);
  const signature = base64url(new Uint8Array(sigBuf));
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GCP token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  };
  return cachedToken.token;
}
