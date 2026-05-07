// Raw PCM / WAV helpers for seamless audio concatenation.
//
// We synthesize TTS at LINEAR16 24kHz mono and build the final briefing by
// concatenating raw PCM from each turn + a programmatically generated intro
// chime. Everything lives in one sample rate, so we can cleanly stitch
// without MP3 frame-boundary issues.

export const SAMPLE_RATE = 24000;
export const BITS_PER_SAMPLE = 16;
export const CHANNELS = 1;
export const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

/** Build a 44-byte WAV header for mono 16-bit PCM at SAMPLE_RATE. */
export function wavHeader(pcmByteLength: number): Uint8Array {
  const buf = new ArrayBuffer(44);
  const v = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  v.setUint32(4, 36 + pcmByteLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);                                // fmt chunk size
  v.setUint16(20, 1, true);                                 // PCM
  v.setUint16(22, CHANNELS, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE, true); // byte rate
  v.setUint16(32, CHANNELS * BYTES_PER_SAMPLE, true);       // block align
  v.setUint16(34, BITS_PER_SAMPLE, true);
  writeStr(36, "data");
  v.setUint32(40, pcmByteLength, true);
  return new Uint8Array(buf);
}

/** Given a WAV file produced by Google TTS (LINEAR16), return just the PCM
 *  bytes by locating the "data" chunk and skipping its 8-byte preamble. */
export function extractPcm(wav: Uint8Array): Uint8Array {
  // Find ASCII "data" marker (0x64 0x61 0x74 0x61).
  for (let i = 0; i < wav.length - 8; i++) {
    if (wav[i] === 0x64 && wav[i + 1] === 0x61 && wav[i + 2] === 0x74 && wav[i + 3] === 0x61) {
      // Next 4 bytes are the chunk size; data follows.
      return wav.slice(i + 8);
    }
  }
  // Fallback: assume standard 44-byte header.
  return wav.length > 44 ? wav.slice(44) : wav;
}

/** Assemble final WAV bytes from many raw-PCM chunks. */
export function packWav(pcmChunks: Uint8Array[]): Uint8Array {
  const total = pcmChunks.reduce((n, c) => n + c.byteLength, 0);
  const header = wavHeader(total);
  const out = new Uint8Array(header.byteLength + total);
  out.set(header, 0);
  let off = header.byteLength;
  for (const c of pcmChunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

/** Programmatic intro music for the briefing — 8.8 seconds, designed to
 *  fade smoothly into the spoken hook that follows.
 *
 *  Structure:
 *    - 0.0s – 1.6s : opening arpeggio (C maj7, four notes 0.4s apart) builds
 *    - 1.6s – 4.0s : full-bed sustain, gentle pad + slow harmonic wash
 *    - 4.0s – 6.6s : second arpeggio motif (an octave higher, lighter)
 *    - 6.6s – 8.8s : long musical fade-out so the bed gracefully decays just
 *                    before the spoken hook lands. The fade IS the music's
 *                    "exit" — when the speech begins right after, it feels
 *                    like the music has lifted under the voice. */
export function generateIntroPcm(): Uint8Array {
  const totalSeconds = 8.8;
  const totalSamples = Math.floor(SAMPLE_RATE * totalSeconds);
  const pcm = new Int16Array(totalSamples);

  // First arpeggio (C maj7 lower octave): C4 E4 G4 B4
  const arp1 = [261.63, 329.63, 392.0, 493.88];
  // Second arpeggio (one octave up — adds lift): C5 E5 G5
  const arp2 = [523.25, 659.26, 783.99];
  // Sustained pad notes (sub-octave) for warmth across the whole intro
  const padNotes = [130.81, 164.81, 196.0];

  // Fade-out tail length. The audio crossfades to silence over the last
  // FADE_TAIL seconds, so the spoken hook lands cleanly right after.
  const FADE_TAIL = 2.2;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Master envelope: gentle fade-in over the first 0.3s, sustain in the
    // body, smooth fade-out over the last FADE_TAIL seconds.
    const attack = 0.3;
    let env = 1;
    if (t < attack) env = t / attack;
    if (t > totalSeconds - FADE_TAIL) {
      // Use a cosine-shaped fade for a perceptually smooth roll-off
      const tail = (t - (totalSeconds - FADE_TAIL)) / FADE_TAIL;
      env = 0.5 * (1 + Math.cos(Math.PI * tail));
    }

    let sample = 0;

    // First arpeggio motif starting at t=0. Each note 0.4s apart, rings 2.0s.
    for (let n = 0; n < arp1.length; n++) {
      const startT = n * 0.4;
      const noteT = t - startT;
      if (noteT > 0 && noteT < 2.0) {
        const noteEnv = Math.exp(-noteT * 0.9);
        const phase = 2 * Math.PI * arp1[n] * noteT;
        sample += Math.sin(phase) * noteEnv * 0.20;
        sample += Math.sin(phase * 2) * noteEnv * 0.045;
      }
    }

    // Second arpeggio motif (octave up) starting at t=4.0s. A "lift" moment.
    for (let n = 0; n < arp2.length; n++) {
      const startT = 4.0 + n * 0.32;
      const noteT = t - startT;
      if (noteT > 0 && noteT < 1.6) {
        const noteEnv = Math.exp(-noteT * 1.1);
        const phase = 2 * Math.PI * arp2[n] * noteT;
        sample += Math.sin(phase) * noteEnv * 0.12;
        sample += Math.sin(phase * 2) * noteEnv * 0.025;
      }
    }

    // Pad layer (sustained chord) — fades in over 1.2s, holds across the
    // body, naturally lifted by master envelope's tail fade.
    const padStart = 0.2;
    if (t > padStart) {
      const padEnv = Math.min(1, (t - padStart) / 1.2);
      for (const f of padNotes) {
        sample += Math.sin(2 * Math.PI * f * t) * 0.038 * padEnv;
      }
    }

    // Gentle low-frequency "whoosh" sweep for movement across the whole bed
    const sweep = Math.sin(2 * Math.PI * 0.45 * t) * 0.012;
    sample += sweep;

    const clipped = Math.max(-1, Math.min(1, sample * env));
    pcm[i] = Math.round(clipped * 30000);
  }

  const bytes = new Uint8Array(pcm.byteLength);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) view.setInt16(i * 2, pcm[i], true);
  return bytes;
}

/** Subtle "whoosh" between two consecutive news stories within the same
 *  section. Much shorter and lighter than `generateSectionTransitionPcm`
 *  — this is sound design, not a music sting.
 *
 *  ~0.55s sweep using filtered noise + a brief low-freq airy tone. Triggered
 *  by the LLM emitting a [story_break] marker between stories. Falls under
 *  the same overall section, so section_offsets are not affected. */
export function generateStoryTransitionPcm(): Uint8Array {
  const totalSeconds = 0.55;
  const totalSamples = Math.floor(SAMPLE_RATE * totalSeconds);
  const pcm = new Int16Array(totalSamples);

  // Pseudo-random "noise" via a simple LCG seeded with 0 — deterministic so
  // every story break sounds the same (a recognizable cue).
  let lcg = 1;
  const rand = () => { lcg = (lcg * 1103515245 + 12345) & 0x7fffffff; return (lcg / 0x7fffffff) * 2 - 1; };

  // Single-pole low-pass IIR for the noise (so it sounds like air, not buzz)
  let lp = 0;
  const lpAlpha = 0.05;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Bell-shaped envelope that swells and falls
    const env = Math.sin(Math.PI * (t / totalSeconds));

    // Filtered noise bed
    const noise = rand();
    lp = lp + lpAlpha * (noise - lp);

    // Slow airy tone underneath (sweeps from ~80Hz to ~140Hz then back)
    const sweepHz = 80 + 60 * Math.sin(Math.PI * (t / totalSeconds));
    const tone = Math.sin(2 * Math.PI * sweepHz * t);

    const sample = (lp * 0.18 + tone * 0.06) * env;
    const clipped = Math.max(-1, Math.min(1, sample));
    pcm[i] = Math.round(clipped * 22000);
  }

  const bytes = new Uint8Array(pcm.byteLength);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) view.setInt16(i * 2, pcm[i], true);
  return bytes;
}

/** Generate a short "outro" tail — fades the chord out over 1.5s.
 *  Keeps an outro presence without making the briefing feel cold. */
export function generateOutroPcm(): Uint8Array {
  const totalSeconds = 1.8;
  const totalSamples = Math.floor(SAMPLE_RATE * totalSeconds);
  const pcm = new Int16Array(totalSamples);
  const padNotes = [130.81, 164.81, 196.0, 246.94]; // C major 7 low

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.max(0, 1 - t / totalSeconds);
    let sample = 0;
    for (const f of padNotes) {
      sample += Math.sin(2 * Math.PI * f * t) * 0.06;
    }
    const clipped = Math.max(-1, Math.min(1, sample * env));
    pcm[i] = Math.round(clipped * 28000);
  }
  const bytes = new Uint8Array(pcm.byteLength);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) view.setInt16(i * 2, pcm[i], true);
  return bytes;
}

/** Generate a short, subtle ambient stinger for between sections (~1.8s).
 *  A two-note resolved cadence (fifth → root) over a soft pad. Lower amplitude
 *  than the intro chime so it reads as a transition cue, not a fanfare.
 *
 *  rootHz selects the root note; pass a different value per section to give
 *  each transition its own color. Suggested cycle: C4 (261.63), D4 (293.66),
 *  E4 (329.63), F4 (349.23), G4 (392.0). */
export function generateSectionTransitionPcm(rootHz = 261.63): Uint8Array {
  const totalSeconds = 1.8;
  const totalSamples = Math.floor(SAMPLE_RATE * totalSeconds);
  const pcm = new Int16Array(totalSamples);

  // Two-note motion: the fifth of the chord moves to the root mid-stinger.
  const fifthHz = rootHz * 1.5; // perfect fifth above root
  const firstNoteEnd = 0.85;    // fifth rings, then root takes over
  // A soft pad an octave below the root keeps the floor warm.
  const padHz = rootHz * 0.5;
  const subPadHz = rootHz * 0.75; // a fourth above the deep pad — fills the chord

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Master envelope: quick attack, gentle release at the tail.
    const attack = 0.06;
    const release = 0.7;
    let env = 1;
    if (t < attack) env = t / attack;
    if (t > totalSeconds - release) env = Math.max(0, (totalSeconds - t) / release);

    let sample = 0;

    // First note (fifth) — rings for 0.85s with its own decay.
    if (t < firstNoteEnd + 0.4) {
      const noteEnv = Math.exp(-Math.max(0, t) * 1.6);
      const phase = 2 * Math.PI * fifthHz * t;
      sample += Math.sin(phase) * noteEnv * 0.16;
      sample += Math.sin(phase * 2) * noteEnv * 0.04; // gentle 2nd harmonic
    }

    // Second note (root) — enters at firstNoteEnd, rings to the end.
    if (t > firstNoteEnd) {
      const noteT = t - firstNoteEnd;
      const noteEnv = Math.exp(-noteT * 1.2);
      const phase = 2 * Math.PI * rootHz * noteT;
      sample += Math.sin(phase) * noteEnv * 0.18;
      sample += Math.sin(phase * 2) * noteEnv * 0.05;
    }

    // Soft pad — sustained chord underneath, fades in over the first 0.4s.
    const padFade = Math.min(1, t / 0.4);
    sample += Math.sin(2 * Math.PI * padHz * t) * 0.035 * padFade;
    sample += Math.sin(2 * Math.PI * subPadHz * t) * 0.025 * padFade;

    // Scale, clip, quantize. ~0.5x intro amplitude — subtle by design.
    const clipped = Math.max(-1, Math.min(1, sample * env));
    pcm[i] = Math.round(clipped * 24000);
  }

  // Copy Int16Array → little-endian Uint8Array bytes.
  const bytes = new Uint8Array(pcm.byteLength);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) view.setInt16(i * 2, pcm[i], true);
  return bytes;
}

/** Cycle of root frequencies for section transitions (C, D, E, F, G major). */
export const SECTION_TRANSITION_ROOTS = [261.63, 293.66, 329.63, 349.23, 392.0];

/** Generate N seconds of silence (PCM mono 16-bit) for pauses. */
export function silencePcm(seconds: number): Uint8Array {
  const samples = Math.floor(SAMPLE_RATE * seconds);
  return new Uint8Array(samples * BYTES_PER_SAMPLE); // zeros
}

/** Seconds in a PCM byte buffer (mono 16-bit at SAMPLE_RATE). */
export function pcmDurationSeconds(bytes: number): number {
  return bytes / (SAMPLE_RATE * BYTES_PER_SAMPLE);
}
