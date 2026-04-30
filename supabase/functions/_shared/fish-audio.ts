// Fish Audio TTS. v1 stays dormant unless FISH_AUDIO_API_KEY is set — the
// pipeline fires this but ignores failures so text-led v1 works without keys.
//
// API reference: https://docs.fish.audio/api-reference
// We call POST /v1/tts which returns MP3 bytes. One call per section; we
// concatenate on the server by streaming sequentially to one storage object.
//
// v1.1 replaces the naive concat with proper ffmpeg-based concatenation
// (silence gaps between sections, loudness normalization, chapter metadata).

import { getServiceClient } from "./supabase.ts";
import { withTimeout, logInfo, logError } from "./errors.ts";

const FISH_URL = "https://api.fish.audio/v1/tts";

export interface TtsSection {
  order: number;
  text: string;
}

// Generate MP3 for a single text blob. Returns { buf, err }.
export async function synthesizeWithError(
  text: string,
  referenceVoiceId?: string,
): Promise<{ buf: Uint8Array | null; err: string | null }> {
  const apiKey = Deno.env.get("FISH_AUDIO_API_KEY");
  if (!apiKey) return { buf: null, err: "FISH_AUDIO_API_KEY not set" };

  try {
    const res = await withTimeout(
      fetch(FISH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text,
          format: "mp3",
          reference_id: referenceVoiceId ?? Deno.env.get("FISH_AUDIO_VOICE_ID") ?? undefined,
          latency: "balanced",
          mp3_bitrate: 128,
        }),
      }),
      60_000,
      "fish-audio",
    );
    if (!res.ok) {
      const body = await res.text();
      logError("fish.http_error", { status: res.status, body });
      return { buf: null, err: `http ${res.status}: ${body.slice(0, 200)}` };
    }
    return { buf: new Uint8Array(await res.arrayBuffer()), err: null };
  } catch (err) {
    logError("fish.exception", { err: String(err) });
    return { buf: null, err: String(err) };
  }
}

// End-to-end: synth each section, concat, upload to storage, write audio_url.
// Returns true on success, false if stubbed/failed (caller logs).
export async function generateAndStoreBriefingAudio(params: {
  userId: string;
  briefingId: string;
  sections: TtsSection[];
}): Promise<boolean> {
  if (!Deno.env.get("FISH_AUDIO_API_KEY")) {
    logInfo("fish.stubbed", { reason: "no_api_key" });
    return false;
  }

  const supa = getServiceClient();
  const ordered = [...params.sections].sort((a, b) => a.order - b.order);

  const chunks: Uint8Array[] = [];
  let firstErr: string | null = null;
  for (const s of ordered) {
    const { buf, err } = await synthesizeWithError(s.text);
    if (buf) chunks.push(buf);
    else if (!firstErr && err) firstErr = err;
  }
  if (chunks.length === 0) {
    logError("fish.all_sections_failed", { firstErr });
    throw new Error(`fish audio: ${firstErr ?? "no audio produced"}`);
  }

  // Naive MP3 concatenation (works acceptably; v1.1 uses ffmpeg).
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.byteLength;
  }

  const path = `${params.userId}/${params.briefingId}.mp3`;
  const up = await supa.storage.from("briefing-audio").upload(path, merged, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (up.error) {
    logError("fish.storage_upload_error", { err: up.error.message });
    throw new Error(`storage upload: ${up.error.message}`);
  }

  // Approximate duration: ~150 words/min → text length heuristic
  const wordCount = ordered.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
  const durationSeconds = Math.max(30, Math.round((wordCount / 150) * 60));

  await supa
    .from("briefings")
    .update({ audio_url: path, audio_duration_seconds: durationSeconds })
    .eq("id", params.briefingId);

  return true;
}
