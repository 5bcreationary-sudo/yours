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

// Demo briefing. Follows the new INTRO_RULE: greeting (turn 0) + teaser (turns 1-2) +
// "It's [day], Welcome to Yours" (turn 3) + [section_break] (turn 4), then weather /
// calendar / news / sign-off with proper [section_break] and [story_break] markers.
// Showcases the new voices: HOST A (Puck — upbeat, energetic) and HOST B (Kore — warm, authoritative).
const DEMO_FIRST_NAME = "Alex";

const DEMO_DIALOGUE: DialogueTurn[] = [
  // Intro: greeting + teaser + welcome + section break
  { order: 0,  speaker: "A", text: `Good morning, ${DEMO_FIRST_NAME}. Here's what's happening today.` },
  { order: 1,  speaker: "A", text: "Weather's turning cool, you've got two calendar blocks today, and there's a wild story in tech that's already dominating the news cycle." },
  { order: 2,  speaker: "A", text: "Let's get into it." },
  { order: 3,  speaker: "A", text: "[warm]It's Thursday, May 8th. Welcome to Yours.[/warm]" },
  { order: 4,  speaker: "A", text: "[section_break]" },

  // Weather section
  { order: 5,  speaker: "A", text: "First up: the weather. What are we looking at?" },
  { order: 6,  speaker: "B", text: "High of sixty-eight today with increasing clouds moving in by afternoon. There's a forty percent chance of showers around four or five o'clock, so if you're heading out for lunch, I'd grab a light jacket just in case." },
  { order: 7,  speaker: "A", text: "Good call. How does the weekend look?" },
  { order: 8,  speaker: "B", text: "Clears up Saturday, actually nice, then we're back to rain on Sunday. So Friday evening should be fine if you've got plans." },
  { order: 9,  speaker: "A", text: "[section_break]" },

  // Calendar section
  { order: 10, speaker: "A", text: "Let's look at your day. You've got some time blocked?" },
  { order: 11, speaker: "B", text: "You've got the product standup at ten o'clock, then back-to-back with the marketing sync at eleven-thirty. After that, your calendar opens up until four, when you've got the exec briefing." },
  { order: 12, speaker: "A", text: "So a solid two hours of breathing room in the afternoon?" },
  { order: 13, speaker: "B", text: "Exactly. That's your window if you need to catch up on emails or anything from yesterday's board prep." },
  { order: 14, speaker: "A", text: "[section_break]" },

  // News section with story breaks
  { order: 15, speaker: "A", text: "Now the big one. There's a major story in AI regulation that's just broken." },
  { order: 16, speaker: "B", text: "The European Union just formalized its AI Safety Act — the first major regulatory framework in the world. Any AI system above a certain capability threshold now needs third-party audits before it can be deployed. This isn't theoretical — it's in effect immediately." },
  { order: 17, speaker: "A", text: "So what does that actually mean for companies building AI right now?" },
  { order: 18, speaker: "B", text: "It means compliance costs just went up substantially. But here's what matters: the U.S. is already drafting its own version. This is likely to become the global standard, not just a European thing." },
  { order: 19, speaker: "A", text: "[story_break]" },

  { order: 20, speaker: "A", text: "What else is happening?" },
  { order: 21, speaker: "B", text: "Markets opened down point-three percent after yesterday's Fed hold. The central bank kept rates steady again, which is the third meeting in a row with no changes. Most analysts expect they'll start cutting by summer." },
  { order: 22, speaker: "A", text: "So we're in a holding pattern?" },
  { order: 23, speaker: "B", text: "For now, yeah. The Fed's message is clear — inflation is cooling but not fast enough to risk more rate cuts. That's the consensus until we see the next inflation report." },
  { order: 24, speaker: "A", text: "[section_break]" },

  // Sign-off
  { order: 25, speaker: "A", text: `That's your morning, ${DEMO_FIRST_NAME}. Get some good work done today. This has been Yours.` },
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
