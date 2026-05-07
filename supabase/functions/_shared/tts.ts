// TTS provider router — two-host podcast format.
//
// Synthesizes alternating dialogue turns with speaker-appropriate voices,
// bakes SSML <break> pauses between speaker changes, and uploads a single MP3.
//
//   TTS_PROVIDER=google  (default)  -> needs GCP service account or GOOGLE_TTS_API_KEY
//   TTS_PROVIDER=fish               -> needs FISH_AUDIO_API_KEY
//
// Voice mapping:
//   GOOGLE_TTS_VOICE_A / GOOGLE_TTS_VOICE_B  (default Chirp3-HD-Charon / Chirp3-HD-Achernar)
//   FISH_AUDIO_VOICE_ID_A / FISH_AUDIO_VOICE_ID_B

import { getServiceClient } from "./supabase.ts";
import { logInfo, logError } from "./errors.ts";
import { synthesizeWithError as synthFish } from "./fish-audio.ts";
import { synthesizeGoogleTts } from "./google-tts.ts";
import {
  extractPcm,
  generateIntroPcm,
  generateOutroPcm,
  generateSectionTransitionPcm,
  generateStoryTransitionPcm,
  packWav,
  pcmDurationSeconds,
  SECTION_TRANSITION_ROOTS,
  silencePcm,
} from "./audio-wav.ts";

export type TtsProvider = "fish" | "google";

export function currentTtsProvider(): TtsProvider {
  const raw = (Deno.env.get("TTS_PROVIDER") ?? "google").toLowerCase();
  return raw === "fish" ? "fish" : "google";
}

export interface DialogueTurn {
  order: number;
  speaker: "A" | "B";
  text: string;
}

// Legacy single-voice interface for backward compat.
export interface TtsSection {
  order: number;
  text: string;
}

// --- Intro music -------------------------------------------------------
// We synthesize a short warm chord chime in code (see audio-wav.ts) so the
// intro shares the exact same sample rate / encoding as TTS output. This
// avoids MP3 frame-boundary issues that previously caused audio to stop
// after the intro. Roughly 3 seconds.

// --- Per-turn synthesis ------------------------------------------------
function voiceForSpeaker(provider: TtsProvider, speaker: "A" | "B"): string | undefined {
  if (provider === "google") {
    return speaker === "A"
      ? (Deno.env.get("GOOGLE_TTS_VOICE_A") ?? "en-US-Chirp3-HD-Charon")
      : (Deno.env.get("GOOGLE_TTS_VOICE_B") ?? "en-US-Chirp3-HD-Achernar");
  }
  // Fish Audio
  return speaker === "A"
    ? (Deno.env.get("FISH_AUDIO_VOICE_ID_A") ?? Deno.env.get("FISH_AUDIO_VOICE_ID"))
    : Deno.env.get("FISH_AUDIO_VOICE_ID_B");
}

async function synthesizeOne(
  provider: TtsProvider,
  text: string,
  speaker: "A" | "B",
): Promise<{ buf: Uint8Array | null; err: string | null }> {
  const voice = voiceForSpeaker(provider, speaker);
  if (provider === "google") return synthesizeGoogleTts(text, voice);
  return synthFish(text, voice);
}

// --- Parallel batching -------------------------------------------------
// Synthesize turns in batches to balance speed vs API rate limits.
const BATCH_SIZE = 5;

async function synthesizeAll(
  provider: TtsProvider,
  turns: DialogueTurn[],
): Promise<Array<{ buf: Uint8Array | null; err: string | null }>> {
  const results: Array<{ buf: Uint8Array | null; err: string | null }> = new Array(turns.length);

  for (let i = 0; i < turns.length; i += BATCH_SIZE) {
    const batch = turns.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((t) => synthesizeOne(provider, t.text, t.speaker)),
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

// --- Pure assembly (no storage / DB writes) ---------------------------
// Synthesizes the dialogue, splices intro music + section/story transitions
// + outro, and returns the merged audio bytes. Used by the prod pipeline
// (generateAndStoreBriefingAudio) and by the demo synthesis function. Does
// NOT touch storage or the database — caller is responsible for that.
export interface AssembledBriefingAudio {
  bytes: Uint8Array;
  ext: "wav" | "mp3";
  contentType: "audio/wav" | "audio/mpeg";
  durationSeconds: number;
  /** Per-section start times in seconds. Only meaningful for the Google
   *  (raw PCM) path; null when provider=fish since MP3 byte concat doesn't
   *  preserve sample-accurate offsets. */
  sectionOffsets: number[] | null;
  provider: TtsProvider;
}

export async function assembleBriefingAudio(params: {
  dialogue: DialogueTurn[];
}): Promise<AssembledBriefingAudio> {
  const provider = currentTtsProvider();
  logInfo("tts.provider", { provider, turns: params.dialogue.length });

  // Presence check for provider credentials (service account or API key).
  if (provider === "google" && !Deno.env.get("SERVICE_ACCOUNT_JSON_B64") && !Deno.env.get("SERVICE_ACCOUNT_JSON") && !Deno.env.get("GCP_CLIENT_EMAIL") && !Deno.env.get("GOOGLE_TTS_API_KEY") && !Deno.env.get("GOOGLE_CLOUD_API_KEY")) {
    throw new Error("TTS_PROVIDER=google but neither GCP service account nor GOOGLE_TTS_API_KEY set");
  }
  if (provider === "fish" && !Deno.env.get("FISH_AUDIO_API_KEY")) {
    throw new Error("TTS_PROVIDER=fish but FISH_AUDIO_API_KEY not set");
  }

  const ordered = [...params.dialogue].sort((a, b) => a.order - b.order);

  // Walk the dialogue and split it into a "flow" — a parallel list of three
  // step kinds:
  //   - "speech"      : a real spoken turn (synthesized via TTS)
  //   - "section"     : [section_break] marker — full ambient stinger between
  //                     major segments (weather → personal → news → wrap)
  //   - "story"       : [story_break] marker — lighter whoosh between
  //                     individual stories within the news roundup
  // Markers are filtered out of speechTurns so the batch synthesizer never
  // sees them.
  const SECTION_BREAK_TEXT = "[section_break]";
  const STORY_BREAK_TEXT = "[story_break]";
  type Flow =
    | { kind: "speech"; speechIdx: number }
    | { kind: "section" }
    | { kind: "story" };
  const flow: Flow[] = [];
  const speechTurns: DialogueTurn[] = [];
  for (const turn of ordered) {
    const t = turn.text.trim();
    if (t === SECTION_BREAK_TEXT) {
      flow.push({ kind: "section" });
    } else if (t === STORY_BREAK_TEXT) {
      flow.push({ kind: "story" });
    } else {
      flow.push({ kind: "speech", speechIdx: speechTurns.length });
      speechTurns.push(turn);
    }
  }

  // Bake inter-speaker pauses into each speech turn's text BEFORE synthesis,
  // so the TTS voice itself produces the gap (avoids stitching silent MP3s
  // that some voices read aloud as "dot dot dot").
  const preparedTurns = speechTurns.map((turn, i) => {
    const nextTurn = speechTurns[i + 1];
    if (nextTurn && nextTurn.speaker !== turn.speaker) {
      return { ...turn, text: turn.text + ' <break time="400ms"/>' };
    }
    return turn;
  });

  // Synthesize all speech turns in parallel batches. Google returns each chunk
  // as a self-contained WAV (LINEAR16) — we strip headers to get raw PCM so we
  // can cleanly stitch with the intro / transitions / outro.
  const synthResults = await synthesizeAll(provider, preparedTurns);

  const pcmChunks: Uint8Array[] = [];
  let firstErr: string | null = null;
  let introBytes = 0;
  let outroBytes = 0;

  // Track cumulative PCM bytes so we can record exact section start times.
  // Only meaningful for the Google (raw PCM) path; left null for Fish.
  let cumulativeBytes = 0;
  const sectionOffsetsSec: number[] = [];
  const pushChunk = (buf: Uint8Array) => {
    pcmChunks.push(buf);
    cumulativeBytes += buf.byteLength;
  };
  const recordSectionStart = () => {
    sectionOffsetsSec.push(pcmDurationSeconds(cumulativeBytes));
  };

  // Prepend music intro unless explicitly disabled. Generated programmatically
  // at the same sample rate as TTS output (24kHz mono), so no encoding mismatch.
  const disableIntro = (Deno.env.get("DISABLE_INTRO_MUSIC") ?? "false").toLowerCase() === "true";
  if (!disableIntro) {
    const intro = generateIntroPcm();
    pushChunk(intro);
    // Small gap between intro music and first voice
    pushChunk(silencePcm(0.4));
    introBytes = intro.byteLength;
    logInfo("tts.intro_generated", { seconds: pcmDurationSeconds(introBytes).toFixed(2) });
  }

  // Section 0 starts immediately after the intro/gap — record its start.
  recordSectionStart();

  // Walk the flow and assemble.
  //   - "section" step → full ambient stinger (1.8s) + flanking silence,
  //     records a new section_offset.
  //   - "story" step → much lighter whoosh (0.55s) with minimal silence,
  //     does NOT record a section_offset (it's intra-section sound design).
  //   - "speech" step → synthesized PCM (Google) or MP3 bytes (Fish).
  let nextTransitionIndex = 0;
  let storyTransitionsTotal = 0;
  for (const step of flow) {
    if (step.kind === "section") {
      // Subtle ambient stinger between major sections — different root note
      // each time so consecutive transitions don't sound identical.
      const rootHz = SECTION_TRANSITION_ROOTS[nextTransitionIndex % SECTION_TRANSITION_ROOTS.length];
      nextTransitionIndex++;
      pushChunk(silencePcm(0.25));
      pushChunk(generateSectionTransitionPcm(rootHz));
      pushChunk(silencePcm(0.35));
      // After the stinger + flanking silence, the next section's speech starts.
      recordSectionStart();
      continue;
    }
    if (step.kind === "story") {
      // Much lighter whoosh between stories within the news roundup. No
      // section_offset recorded — these are intra-section transitions.
      pushChunk(silencePcm(0.12));
      pushChunk(generateStoryTransitionPcm());
      pushChunk(silencePcm(0.18));
      storyTransitionsTotal++;
      continue;
    }
    const result = synthResults[step.speechIdx];
    if (!result?.buf) {
      if (!firstErr && result?.err) firstErr = result.err;
      continue;
    }
    if (provider === "google") {
      pushChunk(extractPcm(result.buf));
    } else {
      pushChunk(result.buf);
    }
  }

  if (pcmChunks.length === 0) {
    logError("tts.all_turns_failed", { provider, firstErr });
    throw new Error(`${provider} tts: ${firstErr ?? "no audio produced"}`);
  }

  // Append a short outro tail (fades the chord out) for closure.
  if (!disableIntro) {
    pushChunk(silencePcm(0.3));
    const outro = generateOutroPcm();
    pushChunk(outro);
    outroBytes = outro.byteLength;
  }

  // Wrap everything in a single WAV header (only the Google path; Fish
  // already produces a fully-formed MP3 per turn, so we byte-concat those).
  const merged = provider === "google"
    ? packWav(pcmChunks)
    : (() => {
        const total = pcmChunks.reduce((n, c) => n + c.byteLength, 0);
        const buf = new Uint8Array(total);
        let off = 0;
        for (const c of pcmChunks) {
          buf.set(c, off);
          off += c.byteLength;
        }
        return buf;
      })();

  const ext: "wav" | "mp3" = provider === "google" ? "wav" : "mp3";
  const contentType: "audio/wav" | "audio/mpeg" = provider === "google" ? "audio/wav" : "audio/mpeg";

  // Accurate duration for WAV: total PCM bytes / (sample_rate * bytes_per_sample).
  // Fallback for Fish MP3: estimate from word count.
  let durationSeconds: number;
  if (provider === "google") {
    const totalPcm = pcmChunks.reduce((n, c) => n + c.byteLength, 0);
    durationSeconds = Math.max(30, Math.round(pcmDurationSeconds(totalPcm)));
  } else {
    const wordCount = ordered.reduce((n, t) => n + t.text.split(/\s+/).length, 0);
    const speakerChanges = ordered.filter((t, i) => i > 0 && t.speaker !== ordered[i - 1].speaker).length;
    durationSeconds = Math.max(30, Math.round((wordCount / 130) * 60 + speakerChanges * 0.3));
  }

  // section_offsets is only accurate for the Google (raw PCM) path. For Fish
  // (concatenated MP3s) we can't easily derive offsets, so leave it null and
  // the player falls back to scaling section.duration_minutes.
  const sectionOffsetsForRow = provider === "google" ? sectionOffsetsSec : null;

  logInfo("tts.assembled", {
    provider,
    turns: ordered.length,
    speechTurns: preparedTurns.length,
    chunks: pcmChunks.length,
    bytes: merged.byteLength,
    durationSeconds,
    introBytes,
    outroBytes,
    sectionTransitions: nextTransitionIndex,
    storyTransitions: storyTransitionsTotal,
    sectionStarts: sectionOffsetsSec.length,
    ext,
  });

  return {
    bytes: merged,
    ext,
    contentType,
    durationSeconds,
    sectionOffsets: sectionOffsetsForRow,
    provider,
  };
}

// --- Main pipeline -----------------------------------------------------
// Wrapper around assembleBriefingAudio that uploads the bytes to Supabase
// storage and updates the briefings row. This is the entry point used by
// the production generate-morning-briefing flow.
export async function generateAndStoreBriefingAudio(params: {
  userId: string;
  briefingId: string;
  dialogue: DialogueTurn[];
}): Promise<boolean> {
  const assembled = await assembleBriefingAudio({ dialogue: params.dialogue });
  const supa = getServiceClient();

  const path = `${params.userId}/${params.briefingId}.${assembled.ext}`;
  const up = await supa.storage.from("briefing-audio").upload(path, assembled.bytes, {
    contentType: assembled.contentType,
    upsert: true,
  });
  if (up.error) {
    logError("tts.storage_upload_error", { err: up.error.message });
    throw new Error(`storage upload: ${up.error.message}`);
  }

  await supa
    .from("briefings")
    .update({
      audio_url: path,
      audio_duration_seconds: assembled.durationSeconds,
      section_offsets: assembled.sectionOffsets,
    })
    .eq("id", params.briefingId);

  logInfo("tts.complete", {
    provider: assembled.provider,
    bytes: assembled.bytes.byteLength,
    durationSeconds: assembled.durationSeconds,
    ext: assembled.ext,
  });

  return true;
}
