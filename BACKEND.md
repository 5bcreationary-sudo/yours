# Yours — Backend Operations Guide

Everything you need to provision, deploy, and troubleshoot the production
backend for yours.fm. For *what* the system does and *why*, see
[ARCHITECTURE.md](ARCHITECTURE.md). For v1.1 work, see [TODO.md](TODO.md).

---

## 1. Pipeline at a glance

```
 pg_cron  * * * * *
    │
    ▼
┌────────────────────────────────────────────────────────────┐
│ CTE in 20260412_050_cron.sql                               │
│   (1) janitor: generating > 10m → failed                   │
│   (2) due:     users_due_now view                          │
│   (3) claimed: atomic upsert briefings → 'generating'      │
│       └─ unique (user_id, date) prevents dupes             │
│   (4) net.http_post → edge fn                              │
└────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────── generate-morning-briefing ───────────────┐
│  load profile + interests + sources (service-role client)  │
│      │                                                      │
│  parallel fetch  ┌── weather  (OpenWeatherMap 3.0)         │
│                  ├── calendar (Google Calendar REST)        │
│                  ├── gmail    (Gmail REST, snippets x10)    │
│                  └── rss      (allSettled, 8s each, top 30) │
│      │                                                      │
│  Anthropic claude-sonnet-4-6 (prompt cache, tool use)      │
│      │    fallback: single summary section on parse fail   │
│      ▼                                                      │
│  DELETE + INSERT briefing_sections  (idempotent rerun)     │
│      │                                                      │
│  briefings → status='ready', duration, completed_at        │
│      │                                                      │
│  issue-briefing-link  → HS256 JWT, sha256(jti) stored      │
│      │                                                      │
│  fire-and-forget:  send-sms  +  fish-audio (if key set)    │
└────────────────────────────────────────────────────────────┘
    │
    ▼
User taps SMS link  →  /b/:id?t=<jwt>  →  get-briefing verifies
                                            HS256 + sha256(jti)==token_hash
```

---

## 2. First-time provisioning

### 2.1 Create the Supabase project

```bash
supabase projects create yours --region us-west-1
supabase link --project-ref <ref>
```

Enable extensions via the dashboard (or the first migration does it):
`pgcrypto`, `pg_cron`, `pg_net`.

### 2.2 Apply migrations

```bash
supabase db reset     # local dev
supabase db push      # remote
```

Files under [supabase/migrations/](supabase/migrations/) run in order:

| File | Purpose |
|---|---|
| `20260412_000_extensions.sql` | pgcrypto, pg_cron, pg_net |
| `20260412_010_schema.sql` | users, interests, sources, briefings, briefing_sections |
| `20260412_020_user_trigger.sql` | auth.users → public.users on insert |
| `20260412_030_rls.sql` | self-only + signed-token policies + mark_listened RPC |
| `20260412_040_storage.sql` | `briefing-audio` private bucket |
| `20260412_050_cron.sql` | `users_due_now` view + dispatcher cron |

### 2.3 Set DB GUCs (one-time)

The cron job needs to know where to POST. Run as the `postgres` role:

```sql
alter database postgres set app.edge_base_url   = 'https://<ref>.supabase.co';
alter database postgres set app.service_role_key = '<service role key>';
```

Verify with `show app.edge_base_url;` in a new session.

### 2.4 Set edge function secrets

```bash
supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  OPENWEATHER_API_KEY=... \
  GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
  GOOGLE_CLIENT_SECRET=... \
  BRIEFING_LINK_JWT_SECRET="$(openssl rand -base64 48)" \
  ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  APP_BASE_URL=https://yours.fm
```

Optional (leave blank for v1):
```bash
supabase secrets set FISH_AUDIO_API_KEY=...
supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+15551234567
```

### 2.5 Deploy functions

```bash
supabase functions deploy generate-morning-briefing --no-verify-jwt
supabase functions deploy get-briefing              --no-verify-jwt
supabase functions deploy issue-briefing-link       --no-verify-jwt
supabase functions deploy google-oauth-callback
supabase functions deploy send-sms                  --no-verify-jwt
```

`--no-verify-jwt` is set on functions that accept service-role bearer or
signed-link tokens; `google-oauth-callback` keeps JWT verification on
because it's called from the authenticated browser.

---

## 3. Per-provider setup

### 3.1 Google OAuth (Gmail + Calendar)

1. **Google Cloud Console** → new project → enable *Gmail API* and
   *Google Calendar API*.
2. **OAuth consent screen** → External → add scopes
   `openid email profile gmail.readonly calendar.readonly`. Submit for
   verification before going to prod (the `gmail.readonly` scope is
   sensitive).
3. **Credentials** → OAuth client ID → Web application
   - Authorized redirect URI:
     `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Supabase dashboard** → Authentication → Providers → Google → paste
   client ID + secret, save.
5. Frontend already sends `access_type=offline&prompt=consent` so Google
   returns a refresh_token on first consent. The refresh_token is
   captured in [useAuth.ts](src/hooks/useAuth.ts) on `SIGNED_IN` and
   POSTed to `google-oauth-callback`, which encrypts it with
   `ENCRYPTION_KEY` and stores it as two rows in `user_sources`.

### 3.2 OpenWeatherMap

One Call 3.0 requires the paid subscription (1k req/day free tier). Set
`OPENWEATHER_API_KEY`. Lat/lng pulled from `users.home_address`; falls
back to a TZ→city map in [_shared/weather.ts](supabase/functions/_shared/weather.ts).

### 3.3 Anthropic

Pricing + rate limits at console.anthropic.com. Pipeline caches the
system prompt + catalog via `anthropic-beta: prompt-caching-2024-07-31`
— first call is full price, subsequent calls hit the cache. Model is
pinned to `claude-sonnet-4-6`.

### 3.4 Fish Audio (optional in v1)

Set `FISH_AUDIO_API_KEY` to activate. The pipeline calls TTS per section
in parallel then naive-concatenates the MP3 frames and uploads to the
`briefing-audio` bucket. For v1.1, swap to server-side ffmpeg (see
[TODO.md](TODO.md)).

### 3.5 Twilio (optional in v1)

Requires an A2P 10DLC campaign for US delivery at any scale. When
`TWILIO_ACCOUNT_SID` is set, `send-sms` does a basic-auth POST to
`/2010-04-01/Accounts/{SID}/Messages.json`. When unset, it logs the
intended payload and returns `{ok:true, stubbed:true}` — handy in dev.

---

## 4. Manual pipeline trigger

Two entry points. In both cases the row must already exist in
`briefings` (the cron normally creates it atomically).

### 4.1 via CLI

```bash
# Claim today's briefing for a specific user
psql "$DB_URL" <<SQL
insert into public.briefings (user_id, date, status)
values ('<user_uuid>', current_date, 'generating')
on conflict (user_id, date) do update set status='generating', error=null
returning id;
SQL

supabase functions invoke generate-morning-briefing \
  --no-verify-jwt \
  --body '{"briefing_id":"<briefing_uuid>","user_id":"<user_uuid>","manual":true}'
```

### 4.2 via curl (production)

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/generate-morning-briefing" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "content-type: application/json" \
  -d '{"briefing_id":"<uuid>","user_id":"<uuid>","manual":true}'
```

---

## 5. Reading logs

### 5.1 Cron dispatch

```sql
select jobid, runid, status, return_message, start_time, end_time
from cron.job_run_details
where jobname = 'yours-generate-briefings'
order by start_time desc
limit 20;
```

### 5.2 Edge function HTTP responses (pg_net)

```sql
select id, status_code, content::text, created
from net._http_response
order by created desc
limit 20;
```

### 5.3 Function logs

- Dashboard → Edge Functions → `generate-morning-briefing` → Logs (live tail).
- CLI: `supabase functions logs generate-morning-briefing --tail`.

### 5.4 Pipeline state

```sql
select id, user_id, date, status, error,
       generation_started_at, generation_completed_at
from public.briefings
order by generation_started_at desc nulls last
limit 20;
```

Sections for a briefing:
```sql
select type, title, "order", duration_minutes
from public.briefing_sections
where briefing_id = '<uuid>'
order by "order";
```

---

## 6. Troubleshooting

| Symptom | First thing to check |
|---|---|
| No briefings generated at delivery_time | `select * from users_due_now;` — does the user's timezone match? DB `timezone` must be Postgres tzdata format (e.g. `America/Los_Angeles`). |
| `briefings.status='generating'` stuck | Janitor resets at next cron tick (10 min). Check function logs for the failing await. |
| Anthropic 429s | Retry is 2x exp backoff. If sustained, raise the org's rate limit or stagger `delivery_time` across users. |
| Gmail 401 | Refresh token expired or revoked. User must reconnect in Settings → Sources. |
| OAuth callback returns 401 | Ensure `google-oauth-callback` was deployed *without* `--no-verify-jwt` (it needs the user's bearer). |
| Player shows "unavailable" | Token expired (72h) or `token_hash` mismatch. Regenerate via `issue-briefing-link`. |
| Audio URL 403 | Signed storage URL is 1h — refetch via `get-briefing`. |
| Duplicate briefings in a day | Should be impossible — unique `(user_id, date)` index blocks it. If you see one, check the cron log for conflict errors. |
| RLS denies authed user | Confirm the user's row exists in `public.users` (auth trigger should handle it; if it didn't, the profile load returns null and routes redirect to onboarding). |

---

## 7. Local dev

```bash
supabase start                          # boots local Postgres, Auth, Studio, Inbucket
supabase db reset                       # applies migrations
supabase functions serve --env-file .env.functions   # in a second terminal
cd yours && npm run dev                 # Vite on :5173
```

- Inbucket (email preview) at http://localhost:54324
- Studio at http://localhost:54323
- Functions at http://localhost:54321/functions/v1/*

To test the cron path without waiting for the minute mark, `update
users set delivery_time = (now() at time zone timezone)::time` on a
test account, then wait <60s.
