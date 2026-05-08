// generate-morning-briefing
//
// The main pipeline. Triggered by pg_cron once a user's local delivery_time
// is reached, or manually via `supabase functions invoke` with service_role.
//
// Body: { briefing_id: string, user_id: string, manual?: boolean }
//
// Pipeline (a..g per plan):
//   a. Load user profile, interests, sources
//   b. Weather (OpenWeatherMap)
//   c. Calendar (Google)
//   d. Gmail (Google)
//   e. RSS (all user_sources with type='rss')
//   f. LLM: claude-sonnet-4-6 -> structured sections
//   g. Persist sections, mark briefing ready, issue link, fire SMS+TTS

import { getServiceClient, isServiceRoleBearer } from "../_shared/supabase.ts";
import { json, cors, logInfo, logError } from "../_shared/errors.ts";
import { fetchWeather } from "../_shared/weather.ts";
import { fetchTodayCalendar } from "../_shared/calendar.ts";
import { fetchGmailSummaries } from "../_shared/gmail.ts";
import { fetchRssFeeds } from "../_shared/rss.ts";
import { type AnthropicTool } from "../_shared/anthropic.ts";
import { callLLM } from "../_shared/llm.ts";
import { buildGuidelines } from "../_shared/guidelines.ts";
import { signBriefingLink, sha256Hex } from "../_shared/signed-links.ts";
import { generateAndStoreBriefingAudio } from "../_shared/tts.ts";

const SECTION_TYPES = [
  "weather",
  "traffic",
  "calendar",
  "emails",
  "news",
  "interests",
  "sports",
  "health",
  "entertainment",
] as const;

const SCRIPT_TOOL: AnthropicTool = {
  name: "emit_briefing",
  description:
    "Emit the final structured morning briefing. " +
    "Generate the `dialogue` array FIRST (this is the audio script — the heaviest field, do not undershoot), " +
    "then `sections` (the visual card data, derived from the same content as the dialogue).",
  input_schema: {
    type: "object",
    // dialogue is declared first so streaming generation commits to the long
    // audio script before moving on to the lighter visual sections. Models
    // often ration their output budget across fields in declaration order;
    // putting dialogue last has historically led to ~100s of audio when the
    // target was 8 minutes.
    properties: {
      dialogue: {
        type: "array",
        description:
          "The full audio script as natural back-and-forth dialogue between HOST A and HOST B. " +
          "MUST contain turns from BOTH speakers (a monologue is a failure). " +
          "Cover all sections' content as conversation. Sprinkle `[section_break]` marker turns between major topic shifts. " +
          "Length must hit the word-count target stated in the user message — typically 30–60 turns total.",
        items: {
          type: "object",
          properties: {
            speaker: {
              type: "string",
              enum: ["A", "B"],
              description:
                "HOST A = warm, upbeat, natural — drives the topic introductions and the headline facts. " +
                "HOST B = calm, thoughtful, grounded — supplies context and the why-it-matters angle, " +
                "never excitable, never a yes-person. ALTERNATE between the two.",
            },
            text: {
              type: "string",
              description: "One dialogue turn. 1-3 sentences, natural speech. Most turns under 40 words. Vary length for natural rhythm.",
            },
          },
          required: ["speaker", "text"],
        },
      },
      sections: {
        type: "array",
        description: "Visual card data for the UI. Each section's summary is standalone readable prose.",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: SECTION_TYPES as unknown as string[] },
            title: { type: "string" },
            summary: {
              type: "string",
              description: "Standalone readable prose for the UI card. No bullets, no headers. 1-3 short paragraphs.",
            },
            card_payload: {
              type: "object",
              description: "Rich card data for the UI. Include sources with links when available.",
              properties: {
                items: { type: "array", items: { type: "string" } },
                sources: {
                  type: "array",
                  description: "Source references for this section. Include article titles, URLs, and image URLs when available from RSS data.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Source headline or label" },
                      url: { type: "string", description: "Link to the original article/source" },
                      image_url: { type: "string", description: "Thumbnail or hero image URL from the source, if available" },
                      source_name: { type: "string", description: "Publisher name (e.g. 'CNN', 'TechCrunch')" },
                    },
                    required: ["title"],
                  },
                },
              },
            },
            order: { type: "integer" },
            duration_minutes: { type: "number" },
          },
          required: ["type", "title", "summary", "order", "duration_minutes"],
        },
      },
    },
    required: ["dialogue", "sections"],
  },
};

interface Body {
  briefing_id: string;
  user_id: string;
  manual?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  // Service-role or user bearer — we only accept service-role in practice.
  const auth = req.headers.get("Authorization");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!isServiceRoleBearer(auth)) {
    return json({ ok: false, error: "service role required" }, 401);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  const { briefing_id, user_id } = body;
  if (!briefing_id || !user_id) return json({ ok: false, error: "missing ids" }, 400);

  logInfo("pipeline.start", { briefing_id, user_id });
  const supa = getServiceClient();

  try {
    const startRes = await supa
      .from("briefings")
      .update({
        status: "generating",
        error: null,
        generation_started_at: new Date().toISOString(),
        generation_completed_at: null,
      })
      .eq("id", briefing_id)
      .eq("user_id", user_id)
      .select("id")
      .maybeSingle();
    if (startRes.error) {
      throw new Error(`briefing_claim_failed: ${startRes.error.message}`);
    }
    if (!startRes.data) {
      throw new Error("briefing_not_found");
    }

    // --- (a) Load profile, interests, enabled sources --------------------
    const [profileRes, interestsRes, sourcesRes] = await Promise.all([
      supa.from("users").select("*").eq("id", user_id).maybeSingle(),
      supa.from("user_interests").select("*").eq("user_id", user_id).maybeSingle(),
      supa.from("user_sources").select("id, type, config, enabled").eq("user_id", user_id).eq("enabled", true),
    ]);
    if (profileRes.error || !profileRes.data) {
      throw new Error(`profile_not_found: ${profileRes.error?.message ?? ""}`);
    }
    const profile = profileRes.data;
    const interests = interestsRes.data;
    const sources = sourcesRes.data ?? [];

    const rssFeeds = sources
      .filter((s) => s.type === "rss")
      .map((s) => {
        const cfg = (s.config ?? {}) as { url?: string; name?: string };
        return { url: cfg.url ?? "", name: cfg.name };
      })
      .filter((f) => !!f.url);

    const hasGmail = sources.some((s) => s.type === "gmail");
    const hasCal   = sources.some((s) => s.type === "calendar");

    // --- (b..e) Fetch data sources in parallel ---------------------------
    const [weather, calendar, emails, rss] = await Promise.all([
      fetchWeather({ timezone: profile.timezone, homeAddress: profile.home_address }),
      hasCal   ? fetchTodayCalendar({ userId: user_id, timezone: profile.timezone }) : Promise.resolve([]),
      hasGmail ? fetchGmailSummaries(user_id, 10) : Promise.resolve([]),
      fetchRssFeeds(rssFeeds),
    ]);
    logInfo("pipeline.sources", {
      weather: !!weather,
      calendarEvents: calendar.length,
      emails: emails.length,
      rssItems: rss.length,
    });

    // --- (f) Compose prompt and call LLM --------------------------------
    const guidelines = buildGuidelines(
      {
        full_name: profile.full_name,
        tone: profile.tone,
        briefing_mode: profile.briefing_mode,
        briefing_style: profile.briefing_style ?? "conversational",
        preferred_length_minutes: profile.preferred_length_minutes,
        evening_preference: profile.evening_preference,
      },
      {
        freeform_text: interests?.freeform_text ?? null,
        tags: interests?.tags ?? null,
      },
    );

    const sectionTypesNote =
      `Allowed section types (use the enum value in the \`type\` field): ` +
      SECTION_TYPES.join(", ") +
      `. Typical briefings contain 4–7 sections, but drop sections whose source data is empty.`;

    const systemBlocks = [
      { type: "text" as const, text: guidelines.system, cache_control: { type: "ephemeral" as const } },
      { type: "text" as const, text: sectionTypesNote, cache_control: { type: "ephemeral" as const } },
    ];

    // Pre-format the date strings the spoken intro template needs. The LLM
    // substitutes these verbatim into the Good morning, {name}. … It's
    // {weekday}, {month_day}. opener defined in guidelines.INTRO_TEMPLATE.
    const nowInTz = new Date();
    const weekday = nowInTz.toLocaleDateString("en-US", { timeZone: profile.timezone, weekday: "long" });
    const monthDay = nowInTz.toLocaleDateString("en-US", { timeZone: profile.timezone, month: "long", day: "numeric" });
    const firstName = (profile.full_name ?? "").split(" ")[0] || "";

    const userPayload = {
      user: {
        name: profile.full_name ?? "there",
        first_name: firstName,
        timezone: profile.timezone,
        local_date: nowInTz.toLocaleDateString("en-US", { timeZone: profile.timezone }),
        weekday,
        month_day: monthDay,
        briefing_mode: profile.briefing_mode,
        evening: profile.evening_preference === true,
      },
      target_words: guidelines.targetWords,
      interests: {
        freeform_text: interests?.freeform_text ?? "",
        selected_packages: interests?.selected_packages ?? [],
        tags: interests?.tags ?? [],
      },
      connected_sources: {
        gmail: hasGmail,
        calendar: hasCal,
        rss: rssFeeds.length > 0,
        weather: !!weather,
        no_rss_data: rss.length === 0,
      },
      data: {
        weather,
        calendar: hasCal ? calendar : "not_connected",
        emails: hasGmail ? emails : "not_connected",
        rss_items: rss.map((r) => ({ title: r.title, source: r.source, summary: r.summary, link: r.link })),
      },
    };

    const { toolInput } = await callLLM({
      system: systemBlocks,
      user:
        `Generate today's briefing for this user.\n\n` +
        `LISTENER FIRST NAME: ${firstName || "(empty)"}\n\n` +
        `STRUCTURE (in order — follow OPENING INTRO rules in the system prompt exactly):\n` +
        `1. INTRO (turns 0–2)\n` +
        `   - Turn 0 (A, verbatim): "Good morning, ${firstName || "everyone"}. Here's what's happening today."\n` +
        `   - Turns 1–2: 2–3 sentence teaser of the top 2–3 stories + smooth transition sentence.\n` +
        `   - Do NOT write "Welcome to Yours." — the server appends "It's ${weekday}, ${monthDay}. Welcome to Yours." after your turn 2.\n` +
        `   - Do NOT insert [section_break] between the intro and first content section.\n` +
        `2. WEATHER (one-sentence commute angle ONLY if conditions are bad)\n` +
        `3. PERSONAL — email priorities + calendar look-ahead (the differentiator; spend real time here)\n` +
        `4. NEWS ROUNDUP — 4–6 stories, each in the facts → context → why-it-matters arc.\n` +
        `   IMPORTANT: If rss_items is empty or has fewer than 2 items, generate a NEWS ROUNDUP\n` +
        `   from your general knowledge of current events this week. Do NOT skip news.\n` +
        `5. FEEL-GOOD WRAP — one real positive item (skip only if truly nothing positive in the data)\n` +
        `6. SIGN-OFF — final turn includes "This has been Yours."\n\n` +
        `BANNED PHRASES (failure if used): "wow that's huge", "wow that's amazing", "that's incredible", "tell me more", "how cool is that", "that's wild", "no way", "I love that"\n\n` +
        `DATA:\n` +
        JSON.stringify(userPayload, null, 2),
      tool: SCRIPT_TOOL,
      maxTokens: 16384,
    });

    let sections: Array<{
      type: string;
      title: string;
      summary: string;
      card_payload?: { items?: string[] };
      order: number;
      duration_minutes: number;
    }> = [];
    if (toolInput && Array.isArray((toolInput as { sections?: unknown[] }).sections)) {
      sections = (toolInput as { sections: typeof sections }).sections;
    }

    // Extract dialogue turns for two-host audio synthesis.
    let dialogue: Array<{ speaker: string; text: string }> = [];
    if (toolInput && Array.isArray((toolInput as { dialogue?: unknown[] }).dialogue)) {
      dialogue = (toolInput as { dialogue: typeof dialogue }).dialogue.filter(
        (d) => d?.speaker && d?.text?.trim(),
      );
    }

    // ============== INTRO WIRING ==============
    // Structure: LLM writes turns 0–2 per INTRO_RULE (greeting + teaser + transition).
    // Server then:
    //   1. Strips date sentences only from turns index 3+ (prevents body hallucinations;
    //      preserves any date the LLM correctly placed in the intro).
    //   2. Normalizes turn 0 to the exact greeting text (server-authoritative).
    //   3. Injects "It’s {weekday}, {monthDay}. Welcome to Yours." + [section_break]
    //      after the intro (after position 2), so the audio always plays:
    //        "Good morning, {name}. Here’s what’s happening today."
    //        [teaser sentences]
    //        "It’s Day, Month. Welcome to Yours."
    //        [music sting]
    //        [first content section]

    // 1. Strip date sentences from body turns only (index >= 3).
    const DATE_SENTENCE_RE =
      /\bIt(?:’|’|’)?s\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\.?/gi;
    dialogue = dialogue.map((d, i) => {
      if (i < 3) return d; // preserve intro turns 0–2 as written
      return {
        ...d,
        text: d.text.replace(DATE_SENTENCE_RE, "").replace(/\s{2,}/g, " ").trim(),
      };
    }).filter((d) => d.text.length > 0);

    // 2. Normalize turn 0 to the exact greeting (server-authoritative, matches
    //    the visual recap card text on the player).
    const exactGreeting = firstName
      ? `Good morning, ${firstName}. Here’s what’s happening today.`
      : "Good morning. Here’s what’s happening today.";
    if (dialogue[0]) {
      dialogue[0] = { speaker: "A" as const, text: exactGreeting };
    } else {
      dialogue.unshift({ speaker: "A" as const, text: exactGreeting });
    }

    // 3. Inject date/welcome + section_break AFTER the intro (after position 2).
    //    Server owns the date string so it’s always accurate.
    dialogue.splice(3, 0,
      {
        speaker: "A" as const,
        text: `[warm]It’s ${weekday}, ${monthDay}. Welcome to Yours.[/warm]`,
      },
      { speaker: "A" as const, text: "[section_break]" },
    );

    // Diagnostics on what the model produced — surfaces in pipeline logs so
    // we can spot issues like "all turns from speaker A" or "way under
    // target word count". We do NOT post-process or re-shape the dialogue:
    // alternating speaker labels artificially fragments coherent content
    // into "random sentences" and ends up sounding worse than a monologue.
    const speakerSet = new Set(
      dialogue.filter((d) => d.text.trim() !== "[section_break]").map((d) => d.speaker),
    );
    const wordCount = dialogue
      .filter((d) => d.text.trim() !== "[section_break]")
      .reduce((n, d) => n + d.text.split(/\s+/).filter(Boolean).length, 0);
    const breakCount = dialogue.filter((d) => d.text.trim() === "[section_break]").length;
    logInfo("pipeline.dialogue", {
      turns: dialogue.length,
      speakers: Array.from(speakerSet),
      breaks: breakCount,
      wordCount,
      targetWords: guidelines.targetWords,
      undershoot: wordCount < guidelines.targetWords.min,
    });

    // Filler guard — drop sections whose summary is just motivational padding
    // with no real data behind it. The guidelines forbid this, but models
    // occasionally leak through.
    const FILLER_RE = /\b(?:no (?:new |specific |particular )?(?:updates|information|data)|remember to (?:take|prioritize)|encourage you to explore|you(?:'| ha)?ve got this|make it a great day|sparks? joy|celebrate the small victories|fresh opportunity to learn)\b/i;
    sections = sections.filter((s) => {
      if (!s?.summary) return false;
      if (FILLER_RE.test(s.summary) && s.summary.length < 400) {
        logInfo("pipeline.dropped_filler", { title: s.title });
        return false;
      }
      return true;
    });
    // Re-number ordering after drops.
    sections = sections
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s, i) => ({ ...s, order: i + 1 }));

    if (sections.length === 0) {
      // Fallback: single summary section so the pipeline never hard-fails.
      sections = [
        {
          type: "interests",
          title: "Your Briefing",
          summary:
            `Good morning${profile.full_name ? `, ${profile.full_name}` : ""}. ` +
            `Your personalized briefing could not be fully generated today, but we'll be back tomorrow.`,
          order: 1,
          duration_minutes: 0.5,
        },
      ];
    }

    // --- (g) Persist sections + finalize briefing -----------------------
    // Idempotent: clear any prior sections for this briefing (retries).
    await supa.from("briefing_sections").delete().eq("briefing_id", briefing_id);

    const rows = sections.map((s, i) => ({
      briefing_id,
      type: (SECTION_TYPES as readonly string[]).includes(s.type) ? s.type : "interests",
      title: s.title?.slice(0, 120) ?? "Section",
      summary: s.summary ?? "",
      card_payload: s.card_payload ?? null,
      order: Number.isFinite(s.order) ? s.order : i + 1,
      duration_minutes: Number.isFinite(s.duration_minutes) ? s.duration_minutes : 1,
    }));
    const insertRes = await supa.from("briefing_sections").insert(rows);
    if (insertRes.error) throw new Error(`insert_sections: ${insertRes.error.message}`);

    const totalMinutes = rows.reduce((n, r) => n + (r.duration_minutes ?? 0), 0);

    // Mint signed link.
    const { token, jti, expiresAt } = await signBriefingLink(briefing_id, user_id);
    const tokenHash = await sha256Hex(jti);

    const baseUrl = Deno.env.get("APP_BASE_URL") ?? "https://yours.fm";
    const link = `${baseUrl}/b/${briefing_id}?t=${token}`;

    // Run TTS BEFORE marking the briefing ready so the player never sees a
    // ready briefing without audio. If TTS fails, mark as failed below — the
    // player polls for `status: ready` and surfaces an error otherwise.
    let ttsOk = false;
    let ttsErr: string | null = null;
    try {
      // Use dialogue turns for two-voice audio; fall back to section
      // summaries as single-voice narration if dialogue is empty.
      const ttsDialogue = dialogue.length > 0
        ? dialogue.map((d, i) => ({
            order: i,
            speaker: d.speaker as "A" | "B",
            text: d.text,
          }))
        : rows.map((r) => ({ order: r.order, speaker: "A" as const, text: r.summary }));

      ttsOk = await generateAndStoreBriefingAudio({
        userId: user_id,
        briefingId: briefing_id,
        dialogue: ttsDialogue,
      });
    } catch (err) {
      ttsErr = err instanceof Error ? err.message : String(err);
      logError("pipeline.tts_error", { err: ttsErr });
    }

    if (!ttsOk) {
      // TTS failed — mark briefing failed so the player surfaces an error
      // state instead of staying stuck in 'generating'.
      await supa
        .from("briefings")
        .update({
          status: "failed",
          error: `tts: ${ttsErr ?? "returned false (no api key?)"}`,
          generation_completed_at: new Date().toISOString(),
        })
        .eq("id", briefing_id);
      throw new Error(`tts_failed: ${ttsErr ?? "unknown"}`);
    }

    // Only mark ready once audio is uploaded (tts.ts has already set audio_url).
    await supa
      .from("briefings")
      .update({
        status: "ready",
        generation_completed_at: new Date().toISOString(),
        error: null,
        token_hash: tokenHash,
      })
      .eq("id", briefing_id);

    // SMS still fire-and-forget (send-sms is its own function, non-critical).
    try {
      const smsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`;
      fetch(smsUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${service}`,
        },
        body: JSON.stringify({ user_id, briefing_id, link }),
      }).catch((err) => logError("pipeline.sms_dispatch_error", { err: String(err) }));
    } catch (err) {
      logError("pipeline.sms_dispatch_error", { err: String(err) });
    }

    logInfo("pipeline.done", {
      briefing_id,
      user_id,
      section_count: rows.length,
      duration_minutes: totalMinutes,
      link_expires_at: expiresAt.toISOString(),
    });

    return json({
      ok: true,
      briefing_id,
      section_count: rows.length,
      duration_minutes: totalMinutes,
      link,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logError("pipeline.failed", { briefing_id, user_id, err: msg });
    await supa
      .from("briefings")
      .update({ status: "failed", error: msg })
      .eq("id", briefing_id);
    return json({ ok: false, error: msg }, 500);
  }
});
