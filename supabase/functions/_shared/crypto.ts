// AES-GCM symmetric encryption for OAuth refresh/access tokens stored in
// user_sources.config. Uses ENCRYPTION_KEY from env (32-byte base64).

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("ENCRYPTION_KEY");
  if (!raw) throw new Error("ENCRYPTION_KEY env var not set");
  const keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (keyBytes.byteLength !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes (AES-256)");
  }
  return await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext),
  );
  const payload = new Uint8Array(iv.byteLength + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...payload));
}

export async function decrypt(envelope: string): Promise<string> {
  const key = await getKey();
  const payload = Uint8Array.from(atob(envelope), (c) => c.charCodeAt(0));
  const iv = payload.slice(0, 12);
  const cipher = payload.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return textDecoder.decode(plain);
}
