// Google Cloud Text-to-Speech with SSML support.
//
// Converts inline emotion/pause markers from LLM dialogue into SSML tags
// before sending to Google TTS. This makes the voices sound more natural
// and expressive — pauses, emphasis, pace changes.
//
// Default voices: en-US-Studio-O (male, Host A), en-US-Studio-Q (female, Host B).
// Override with GOOGLE_TTS_VOICE_A / GOOGLE_TTS_VOICE_B env vars.
//
// Auth: prefers GCP service account (same secrets as Vertex AI) for TTS,
// falls back to GOOGLE_TTS_API_KEY / GOOGLE_CLOUD_API_KEY.

import { withTimeout, logError } from "./errors.ts";
import { getGcpAccessToken } from "./gcp-auth.ts";

const API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// --- SSML conversion ---------------------------------------------------
// Converts inline markers like [pause], [excited]...[/excited] into
// Google Cloud TTS SSML tags. Unknown markers are stripped.

function textToSsml(text: string): string {
  let ssml = text;

  // Pauses — varying lengths for natural rhythm
  ssml = ssml.replace(/\[pause:long\]/gi, '<break time="600ms"/>');
  ssml = ssml.replace(/\[pause:short\]/gi, '<break time="150ms"/>');
  ssml = ssml.replace(/\[pause\]/gi, '<break time="350ms"/>');
  // Long breath — extended audible reset between heavy topics
  ssml = ssml.replace(/\[long\s+breath\]/gi, '<break time="900ms"/>');

  // Emotion wrappers — prosody adjustments. Each open tag must close.
  // Aliases: [enthusiastic]≈hotter [excited]; [calm]≈[thoughtful]; [warm]=mellow.
  ssml = ssml.replace(/\[enthusiastic\]/gi, '<prosody rate="1.10" pitch="+3st">');
  ssml = ssml.replace(/\[\/enthusiastic\]/gi, "</prosody>");

  ssml = ssml.replace(/\[excited\]/gi, '<prosody rate="1.08" pitch="+2st">');
  ssml = ssml.replace(/\[\/excited\]/gi, "</prosody>");

  ssml = ssml.replace(/\[calm\]/gi, '<prosody rate="0.92" pitch="-1st">');
  ssml = ssml.replace(/\[\/calm\]/gi, "</prosody>");

  ssml = ssml.replace(/\[thoughtful\]/gi, '<prosody rate="0.92" pitch="-1st">');
  ssml = ssml.replace(/\[\/thoughtful\]/gi, "</prosody>");

  ssml = ssml.replace(/\[warm\]/gi, '<prosody rate="0.96" pitch="-1st" volume="-1dB">');
  ssml = ssml.replace(/\[\/warm\]/gi, "</prosody>");

  ssml = ssml.replace(/\[surprised\]/gi, '<prosody rate="1.05" pitch="+4st">');
  ssml = ssml.replace(/\[\/surprised\]/gi, "</prosody>");

  ssml = ssml.replace(/\[confused\]/gi, '<prosody rate="0.90" pitch="+1st">');
  ssml = ssml.replace(/\[\/confused\]/gi, "</prosody>");

  ssml = ssml.replace(/\[serious\]/gi, '<prosody rate="0.95" pitch="-2st" volume="+1dB">');
  ssml = ssml.replace(/\[\/serious\]/gi, "</prosody>");

  ssml = ssml.replace(/\[amused\]/gi, '<prosody rate="1.05" pitch="+1st">');
  ssml = ssml.replace(/\[\/amused\]/gi, "</prosody>");

  ssml = ssml.replace(/\[softer\]/gi, '<prosody volume="-4dB">');
  ssml = ssml.replace(/\[\/softer\]/gi, "</prosody>");

  ssml = ssml.replace(/\[louder\]/gi, '<prosody volume="+3dB">');
  ssml = ssml.replace(/\[\/louder\]/gi, "</prosody>");

  ssml = ssml.replace(/\[fast\]/gi, '<prosody rate="1.15">');
  ssml = ssml.replace(/\[\/fast\]/gi, "</prosody>");

  ssml = ssml.replace(/\[slow\]/gi, '<prosody rate="0.85">');
  ssml = ssml.replace(/\[\/slow\]/gi, "</prosody>");

  ssml = ssml.replace(/\[emphasis\]/gi, '<emphasis level="strong">');
  ssml = ssml.replace(/\[\/emphasis\]/gi, "</emphasis>");

  // Standalone reaction beats — short pauses where a host would naturally react.
  // Google TTS can't actually laugh, so [laughing] reads as a brief "got tickled"
  // beat, same as the existing [laugh] alias.
  ssml = ssml.replace(/\[sigh\]/gi, '<break time="300ms"/>');
  ssml = ssml.replace(/\[laughing\]/gi, '<break time="350ms"/>');
  ssml = ssml.replace(/\[laugh\]/gi, '<break time="250ms"/>');
  ssml = ssml.replace(/\[hmm\]/gi, '<break time="400ms"/>');

  // Strip any remaining unknown markers [whatever] or [two words] — relaxed
  // regex so multi-word tags we don't recognize are still removed cleanly.
  ssml = ssml.replace(/\[\/?[\w\s]+(?::\w+)?\]/g, "");

  // Wrap in <speak> root
  return `<speak>${ssml}</speak>`;
}

// Check if text contains any SSML markers or raw SSML tags. Single-word
// detection is enough — if hasMarkers returns false but text still has a
// stray "[long breath]", textToSsml's strip pass will scrub it before send.
function hasMarkers(text: string): boolean {
  return /\[\/?(?:pause|enthusiastic|excited|calm|thoughtful|warm|surprised|confused|serious|amused|softer|louder|fast|slow|emphasis|sigh|laugh|laughing|hmm|long\s+breath)(?::\w+)?\]/i.test(text) ||
    /<break\b/i.test(text);
}

export async function synthesizeGoogleTts(
  text: string,
  voiceName?: string,
): Promise<{ buf: Uint8Array | null; err: string | null }> {
  // Prefer service account auth; fall back to API key.
  const apiKey = Deno.env.get("GOOGLE_TTS_API_KEY") ?? Deno.env.get("GOOGLE_CLOUD_API_KEY");
  let accessToken: string | null = null;
  try {
    accessToken = await getGcpAccessToken();
  } catch {
    // No service account configured — fall back to API key.
  }
  if (!accessToken && !apiKey) return { buf: null, err: "Neither GCP service account nor GOOGLE_TTS_API_KEY set" };

  voiceName = voiceName ?? Deno.env.get("GOOGLE_TTS_VOICE") ?? "en-US-Journey-D";
  const languageCode = voiceName.split("-").slice(0, 2).join("-");
  // Journey voices sound most natural at 0.95x; Chirp3-HD at 1.0x.
  const defaultRate = voiceName.includes("Journey") ? "0.95" : "1.0";
  const speakingRate = Number(Deno.env.get("GOOGLE_TTS_SPEAKING_RATE") ?? defaultRate);

  // Use SSML if the text contains markers; plain text otherwise.
  // If the text is already wrapped in <speak>, use it as-is.
  const alreadySSML = text.trimStart().startsWith("<speak>");
  const useSSML = alreadySSML || hasMarkers(text);
  const input = useSSML
    ? { ssml: alreadySSML ? text : textToSsml(text) }
    : { text };

  const body = {
    input,
    voice: { languageCode, name: voiceName },
    audioConfig: {
      // LINEAR16 at 24kHz mono — all turns share this encoding so we can
      // stitch raw PCM without MP3 frame-alignment issues. The final
      // briefing is wrapped in a single WAV header in tts.ts.
      audioEncoding: "LINEAR16" as const,
      sampleRateHertz: 24000,
      speakingRate: Number.isFinite(speakingRate) ? speakingRate : 1.0,
      effectsProfileId: ["headphone-class-device"],
    },
  };

  try {
    const fetchUrl = accessToken ? API_URL : `${API_URL}?key=${apiKey}`;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;

    const res = await withTimeout(
      fetch(fetchUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
      60_000,
      "google-tts",
    );
    if (!res.ok) {
      const errText = await res.text();
      logError("google_tts.http_error", { status: res.status, body: errText });
      return { buf: null, err: `http ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = (await res.json()) as { audioContent?: string };
    if (!data.audioContent) {
      return { buf: null, err: "google tts: no audioContent in response" };
    }
    return { buf: decodeBase64(data.audioContent), err: null };
  } catch (err) {
    logError("google_tts.exception", { err: String(err) });
    return { buf: null, err: String(err) };
  }
}
