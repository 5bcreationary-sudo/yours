# Yours — v1.1 Roadmap

Stuff intentionally deferred from v1 to ship faster. Ordered roughly by
user impact.

## Audio

- [ ] **Real audio pipeline.** v1 does a naive MP3-frame concat in
  [_shared/fish-audio.ts](supabase/functions/_shared/fish-audio.ts) —
  fine for a single voice at one sample rate, brittle otherwise.
  Replace with server-side ffmpeg (Deno subprocess or a dedicated
  worker) to support transitions, normalization, and multi-voice.
- [ ] **Voice selection.** Expose Fish Audio voice IDs in Settings →
  Audio. Store on `users.voice_id`. v1 hardcodes a default.
- [ ] **Background music bed.** Per-tone beds (upbeat/calm/professional)
  mixed under narration.
- [ ] **Resume playback.** Persist `listened_at` + `position_seconds` so
  users can resume across devices.

## SMS / delivery

- [ ] **Twilio A2P 10DLC.** Register a brand + campaign (Messaging
  Service SID). Enable `send-sms` in prod by setting
  `TWILIO_ACCOUNT_SID` etc. Stub is ready.
- [ ] **Delivery receipts.** Record Twilio status callbacks to
  `briefings.delivery_status`. Retry on `undelivered`.
- [ ] **Link shortening.** 72h JWT tokens are long (~180 chars). Use a
  `/l/:slug` redirect table so the SMS fits comfortably under 160.
- [ ] **Opt-out handling.** STOP/HELP keywords → set
  `users.sms_opt_out=true`; skip delivery.

## Content

- [ ] **Traffic section.** Google Routes API for `home_address` →
  `work_address` drive-time estimate.
- [ ] **Commute mode variants.** Different prompt template when
  `briefing_mode='commute'` — more narrative, fewer bullets.
- [ ] **Evening wind-down briefing.** Frontend already asks the
  preference. Backend: duplicate the cron against a new
  `users_due_now_evening` view + `evening_delivery_time` column + a
  distinct prompt template. Change unique constraint to
  `(user_id, date, kind)`.
- [ ] **Sports section.** Pull from ESPN public feeds per
  `users.favorite_teams`.
- [ ] **Health section.** Apple Health/Google Fit OAuth for yesterday's
  sleep + steps.

## Personalization

- [ ] **Feedback loop on sections.** Thumbs up/down per section;
  downweight section types the user consistently skips. Store in
  `briefing_section_feedback`.
- [ ] **Learned interests.** Periodically re-derive `user_interests.tags`
  from aggregated feedback + listened-through ratios.
- [ ] **Private podcast RSS export.** Each user gets a personal feed URL
  (signed by user_id) that Overcast/Pocket Casts can subscribe to. One
  entry per daily briefing, enclosure pointing to the signed audio URL.

## Accounts + onboarding

- [ ] **Google app verification.** `gmail.readonly` is a sensitive scope
  and requires submission for production. Until approved, fall back to
  `gmail.metadata` (subject lines only).
- [ ] **"Reconnect Google" action.** Settings button that forces the
  OAuth flow again with `prompt=consent` — useful when the refresh
  token was rotated or the user changed Google password.
- [ ] **Address autocomplete.** Settings → Profile: Google Places for
  home/work. v1 stores `home_address` as a nullable jsonb blob with
  `{lat,lng}`; UI doesn't surface it yet.
- [ ] **Account deletion.** Button in Settings → Profile is a stub.
  Implement as an edge function that calls `supabase.auth.admin
  .deleteUser()` (cascades to `public.users` and below).

## Reliability

- [ ] **Dead-letter queue.** `briefings.status='failed'` should retry
  once automatically (e.g., at `delivery_time + 30min`) before giving
  up. Today we wait for the next day.
- [ ] **Per-source circuit breaker.** If an RSS feed has 3+ consecutive
  failures, auto-disable + email the user.
- [ ] **Observability.** Ship function logs to a structured sink
  (Axiom / Datadog). Today we grep Supabase logs.
- [ ] **Types drift check.** Add a CI job that runs
  `supabase gen types typescript --project-id <ref>` and diffs against
  the hand-authored [src/types/database.ts](src/types/database.ts).

## Frontend polish (stays out of v1's "no visual changes" scope)

- [ ] **Player audio scrubber.** v1 has a play/pause + speed toggle
  only. Add a waveform/timeline and chapter markers per section.
- [ ] **Share sheet.** The Share button in the player is wired to
  nothing. v1.1: `navigator.share` with the signed link (respecting
  the 72h expiry warning).
- [ ] **DeepCast.** The AppHome "DeepCast" tile links to `/b/demo`
  which renders a 404-ish state. Build the feature: user types a
  topic, pipeline generates a one-off custom episode.

## Infrastructure

- [ ] **Separate staging project.** Mirror migrations + secrets. Today
  there's only prod + local.
- [ ] **Migration safety.** Adopt `supabase migration new` + review in
  CI. Today we hand-write filenames.
- [ ] **Rate limit the manual trigger.** `invokeGenerateBriefing` is
  exposed to authed users via `supabase.functions.invoke`. Harden
  before making it a user-facing "Generate now" button.
