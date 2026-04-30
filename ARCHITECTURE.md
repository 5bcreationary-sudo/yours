# Yours — Architecture

One-page data flow and security model. For operational setup, see
[BACKEND.md](BACKEND.md). For what's deferred, see [TODO.md](TODO.md).

---

## Data flow

```
┌──────────────┐     magic link / Google OAuth     ┌──────────────┐
│  Browser     │ ────────────────────────────────▶ │ Supabase     │
│ (Vite SPA)   │                                    │   Auth       │
└──────────────┘ ◀─── session (JWT)                 └──────┬───────┘
       │                                                   │
       │ RLS-gated PostgREST  (users, interests,           │ auth trigger
       │   sources, briefings)                             ▼
       │                                            ┌──────────────┐
       │ Edge fn: get-briefing, google-oauth-cb ──▶ │   Postgres   │
       │                                            │              │
       ▼                                            │  public.*    │
┌──────────────┐                                    │  (RLS on)    │
│   Player     │ ◀── GET /b/:id?t=<jwt>            │              │
│  (no auth)   │    (signed-link path)              │  cron: * * * │
└──────────────┘                                    └──────┬───────┘
                                                           │ net.http_post
                                                           ▼
                                                    ┌──────────────┐
                                                    │ Edge fn:     │
                                                    │ generate-    │
                                                    │ morning-     │
                                                    │ briefing     │
                                                    └──────┬───────┘
                                                           │
                        ┌──────────┬────────────┬──────────┼──────────┬──────────┐
                        ▼          ▼            ▼          ▼          ▼          ▼
                   OpenWeather  Google Cal   Gmail     RSS feeds  Anthropic  Fish Audio
                   (3.0)         REST        REST                 sonnet-4-6 (optional)
```

The pipeline is one-directional: cron dispatches → edge function reads
user context → fans out to external providers → consolidates via the LLM
→ writes `briefing_sections` + updates `briefings` → issues a signed
link → fires SMS (stubbed in v1). The frontend never calls external
providers directly.

---

## Key design decisions

### No per-user cron rows
One `* * * * *` job runs forever. The `users_due_now` view compares
`date_trunc('minute', (now() at time zone users.timezone)::time)` to
`users.delivery_time`. Timezone-correct, zero bookkeeping, survives
user creation/deletion without cron mutations.

### Atomic claim via unique index
`briefings` has `unique (user_id, date)`. The cron CTE upserts to
`status='generating'` *with* an `ON CONFLICT DO UPDATE … WHERE status
IN ('pending','failed')` guard, so a second dispatcher (or a retry
loop) can never double-run a `ready` briefing.

### Janitor in the same CTE
Before claiming new work, the CTE resets any
`status='generating' AND generation_started_at < now()-'10 min'::interval`
rows back to `failed`. Stale edge-function crashes self-heal within one
tick instead of requiring a human.

### Single source of truth for sections
`briefings` does *not* store `sections jsonb`. Sections live in
`briefing_sections` with FK + order column. Rerunning the pipeline does
`DELETE FROM briefing_sections WHERE briefing_id=$1` then `INSERT …` —
idempotent without partial-state concerns.

### Service-role boundary
Edge functions use the service role key to bypass RLS for writes. This
is the *only* path that writes to `briefings`, `briefing_sections`, or
`user_sources.config` (encrypted tokens). Clients only ever UPDATE
their own profile/interests and INSERT RSS sources.

### Signed link instead of public share
Players are accessed at `/b/:id?t=<hs256 jwt>`. The JWT carries
`{briefing_id, user_id, jti, exp=iat+72h, aud:"yours-player"}`. On
verify, `get-briefing` recomputes `sha256(jti)` and compares to
`briefings.token_hash` — if the briefing is regenerated, old tokens
stop working. RLS has a matching policy keyed off
`request.jwt.claims ->> 'briefing_id'`, but the browser currently uses
the edge function as the canonical read path (same function handles
authed + signed paths).

### OAuth token encryption
Google refresh tokens are encrypted with AES-GCM
(`ENCRYPTION_KEY`, 32 bytes base64) before being stored in
`user_sources.config`. Supabase's built-in Postgres encryption at rest
protects against disk theft; app-level AES protects against a
compromised-but-not-root admin. Rotating `ENCRYPTION_KEY` invalidates
all stored refresh tokens — document as a user-facing "reconnect
Google" prompt.

---

## Security model

| Layer | Threat | Mitigation |
|---|---|---|
| Browser → Postgres | User reads other users' data | RLS self-only on every `public.*` table |
| Browser → Edge | Unauthenticated write attempt | `verify_jwt = true` on `google-oauth-callback` |
| SMS link leak | Forwarded link loses all briefings | HS256 JWT scoped to one briefing_id, 72h exp, jti hashed in DB |
| Server compromise | Refresh tokens usable | AES-GCM encrypted with external key (supabase secrets) |
| Pipeline retry | Duplicate SMS / section blow-up | Unique (user_id,date) + idempotent DELETE+INSERT |
| Cron tick missed | User gets no briefing | Janitor reclaims `generating > 10min`, next tick picks up `users_due_now` |
| Google scope change | Gmail access revoked silently | `oauth.ts` refresh fails, that provider is skipped for the run, and the user reconnects in Settings |
| Prompt injection via RSS | LLM emits malicious HTML | Sections are rendered as plain text (React auto-escapes); tool-use JSON validated |

---

## Data model (condensed)

```
auth.users
  └─1:1─▶ public.users (phone_e164, delivery_time, timezone, tone, mode, length, home_address)
            ├─1:1─▶ user_interests (freeform_text, selected_packages, tags)
            ├─1:N─▶ user_sources (type in gmail|calendar|rss, config jsonb, enabled)
            └─1:N─▶ briefings (date unique-per-user, status, token_hash, audio_url)
                      └─1:N─▶ briefing_sections (type, title, summary, card_payload, order)
```

All PKs are uuid v4. Deletes
cascade from `auth.users` → `public.users` → everything else.

---

## Where to extend

- **New section type** (e.g., "sports"): add it to the enum in
  `20260412_010_schema.sql`, extend the Anthropic prompt catalog in
  `_shared/anthropic.ts`, and (if it needs external data) add a fetcher
  to `_shared/`. Pipeline picks it up automatically.
- **New source type**: enum + a fetcher in `_shared/` + a parallel
  `Promise.all` branch in `generate-morning-briefing/index.ts`. RLS is
  already generic.
- **Evening briefing**: duplicate the cron job against a new
  `users_due_now_evening` view and a different prompt template. The
  data model already supports multiple briefings per day (change the
  unique constraint to `(user_id, date, kind)`).
- **Real audio**: replace the naive MP3 concat in `_shared/fish-audio.ts`
  with server-side ffmpeg (bundled as a Deno subprocess or a separate
  worker). See [TODO.md](TODO.md).
