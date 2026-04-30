// Gemini wrapper via Vertex AI. Uses a GCP service account (JWT → access token)
// instead of an API key. This lets us use the $300 free-trial credits.
//
// Falls back to GEMINI_API_KEY (AI Studio) if the GCP secrets are not set.

import { retry, withTimeout, logError, logInfo } from "./errors.ts";
import { getGcpAccessToken, getServiceAccountCreds, hasGcpCredentials } from "./gcp-auth.ts";

// --- Schema conversion ----------------------------------------------------

// JSON Schema -> Gemini responseSchema. Gemini accepts a subset of OpenAPI 3.0
// types; strip fields it rejects (cache_control, $schema, additionalProperties).
function toGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "additionalProperties" || k === "$schema") continue;
    if (k === "type" && typeof v === "string") {
      out.type = v.toUpperCase();
      continue;
    }
    if (k === "properties" && v && typeof v === "object") {
      const props: Record<string, unknown> = {};
      for (const [pk, pv] of Object.entries(v as Record<string, unknown>)) {
        props[pk] = toGeminiSchema(pv as Record<string, unknown>);
      }
      out.properties = props;
      continue;
    }
    if (k === "items" && v && typeof v === "object") {
      out.items = toGeminiSchema(v as Record<string, unknown>);
      continue;
    }
    out[k] = v;
  }
  return out;
}

// --- Main entry -----------------------------------------------------------

export async function callGemini(opts: {
  systemText: string;
  user: string;
  toolSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<{ toolInput?: Record<string, unknown> }> {
  const useVertexAI = hasGcpCredentials();

  // Fallback to AI Studio API key if no service account.
  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_STUDIO_KEY");
  if (!useVertexAI && !apiKey) {
    throw new Error("Neither GCP service account (SERVICE_ACCOUNT_JSON) nor GEMINI_API_KEY is set");
  }

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
  logInfo("gemini.config", { useVertexAI, model });

  const body = {
    systemInstruction: { parts: [{ text: opts.systemText }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(opts.toolSchema),
      maxOutputTokens: opts.maxTokens ?? 8192,
      temperature: 0.7,
    },
  };

  let url: string;
  let headers: Record<string, string>;

  if (useVertexAI) {
    const creds = getServiceAccountCreds();
    const projectId = Deno.env.get("GCP_PROJECT_ID") || creds.projectId;
    const location = Deno.env.get("GCP_LOCATION") ?? "us-central1";
    url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    const token = await getGcpAccessToken();
    headers = { "content-type": "application/json", authorization: `Bearer ${token}` };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    headers = { "content-type": "application/json" };
  }

  const res = await retry(
    async () => {
      // 120s — was 45s, but a long-form dialogue (~1700 words) routinely
      // takes 60–90s through Gemini 2.5 Flash. The 45s ceiling was failing
      // briefings on the same day they were generated.
      const r = await withTimeout(
        fetch(url, { method: "POST", headers, body: JSON.stringify(body) }),
        120_000,
        "gemini",
      );
      if (r.status === 429 || (r.status >= 500 && r.status < 600)) {
        throw new Error(`retryable ${r.status}: ${await r.text()}`);
      }
      if (!r.ok) {
        const text = await r.text();
        logError("gemini.non_retryable", { status: r.status, text });
        throw new Error(`gemini ${r.status}: ${text}`);
      }
      return r;
    },
    { tries: 3, baseMs: 800, shouldRetry: (e) => String(e).includes("retryable") },
  );

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    logError("gemini.empty_response", { data });
    return { toolInput: undefined };
  }
  try {
    const parsed = JSON.parse(text);
    return { toolInput: parsed as Record<string, unknown> };
  } catch (err) {
    logError("gemini.parse_failed", { err: String(err), text: text.slice(0, 500) });
    return { toolInput: undefined };
  }
}
