// One-off demo synthesis. Renders the hard-coded dialogue below through the
// production TTS pipeline (Google Cloud TTS Studio voices, music intro, section
// transitions, outro) and returns the WAV bytes inline. Used to populate
// public/demo.wav for the marketing landing-page sample player.
//
// Why a separate function: the prod pipeline persists every render to storage
// and writes a briefings row. The demo is rendered once, downloaded locally,
// and committed as a static asset — there's no DB record to write.
//
// Auth: standard JWT verification — call with the project anon key. Burns
// TTS quota (one call per request, ~250 words across two voices), so consider
// rate-limiting or deleting this function after the demo is captured.

import { assembleBriefingAudio, type DialogueTurn } from "../_shared/tts.ts";
import { cors, json, logError } from "../_shared/errors.ts";

// 2-minute demo dialogue. Follows the new INTRO_RULE: greeting + 2-3 sentence
// summary + smooth transition into the first content section, then weather /
// calendar / news / sign-off with [section_break] and [story_break] markers
// the audio pipeline already understands.
const DEMO_FIRST_NAME = "Sam";

const DEMO_DIALOGUE: DialogueTurn[] = [
  { order: 0,  speaker: "A", text: `Good morning, ${DEMO_FIRST_NAME}. Here's what's happening today.` },
  { order: 1,  speaker: "A", text: "It's seventy-three and partly cloudy, you've got a packed afternoon, and the markets are watching the Fed closely after yesterday's announcement. Let's start with the weather." },
  { order: 2,  speaker: "A", text: "[section_break]" },
  { order: 3,  speaker: "A", text: "Today, a high of seventy-eight and a low of fifty-nine, with afternoon showers possible after three." },
  { order: 4,  speaker: "B", text: "If you're walking out for lunch, I'd grab a layer. The temperature drop comes fast once the clouds roll in." },
  { order: 5,  speaker: "A", text: "[section_break]" },
  { order: 6,  speaker: "A", text: "On to the day ahead. Three meetings back-to-back from one to four — the product review with Sarah at two, then the budget sync at three. Dinner with Mike at seven." },
  { order: 7,  speaker: "B", text: "Worth flagging — Sarah's deck for Friday's exec sync needs your sign-off by end of day. That's the one thing I'd front-load." },
  { order: 8,  speaker: "A", text: "[section_break]" },
  { order: 9,  speaker: "A", text: "Onto the headlines. The Federal Reserve held rates steady at four and a half percent. Chair Powell said inflation is coming down, but not fast enough to justify a cut yet." },
  { order: 10, speaker: "B", text: "That's the third meeting in a row without a move. Markets opened slightly lower on the news." },
  { order: 11, speaker: "A", text: "[story_break]" },
  { order: 12, speaker: "A", text: "In tech, the EU formally passed its AI Safety Act today. Third-party audits are now required for any model above a set capability threshold. The rule kicks in over the next eighteen months." },
  { order: 13, speaker: "B", text: "For most listeners, this is the framework everyone else ends up copying. The U.S. is already drafting its version." },
  { order: 14, speaker: "A", text: "[section_break]" },
  { order: 15, speaker: "A", text: `Alright, ${DEMO_FIRST_NAME}, that's your morning. Have a good one. This has been Yours.` },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ ok: false, error: "POST or GET only" }, 405);
  }

  try {
    const assembled = await assembleBriefingAudio({ dialogue: DEMO_DIALOGUE });
    // Cast through ArrayBuffer-backed view so the TS lib doesn't reject the
    // Uint8Array<ArrayBufferLike> as a BodyInit. Same bytes either way.
    const body = new Uint8Array(assembled.bytes);
    return new Response(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "content-type": assembled.contentType,
        "content-length": String(body.byteLength),
        "x-duration-seconds": String(assembled.durationSeconds),
        "x-section-offsets": JSON.stringify(assembled.sectionOffsets ?? []),
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logError("synthesize_demo_audio.failed", { err: msg });
    return json({ ok: false, error: msg }, 500);
  }
});
