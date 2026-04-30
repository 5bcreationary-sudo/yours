-- Timezone-aware minute-level cron that dispatches the briefing pipeline for
-- every user whose local delivery_time matches the current minute.
--
-- Prerequisites (set once per project; do NOT commit real values):
--   alter database postgres set app.edge_base_url = 'https://<project-ref>.supabase.co';
--   alter database postgres set app.service_role_key = '<service-role-jwt>';

create or replace view public.users_due_now as
select
  u.id,
  u.timezone,
  u.delivery_time,
  (now() at time zone u.timezone)::date as local_date
from public.users u
where u.onboarding_complete = true
  and date_trunc('minute', (now() at time zone u.timezone)::time)
      = date_trunc('minute', u.delivery_time);

-- Cron job: every minute. Two-phase:
--   1. Janitor: reset stale 'generating' rows (>10min) to 'failed' so next tick
--      can retry them within the same local date.
--   2. Claim: for each due user without a ready/generating row for their local
--      date, upsert status='generating' atomically (unique index enforces one
--      attempt per user per date).
--   3. Dispatch: net.http_post to generate-morning-briefing with service-role
--      bearer. pg_net is fire-and-forget; the function is idempotent on the
--      claimed row.
select cron.schedule(
  'yours-generate-briefings',
  '* * * * *',
  $cron$
  with janitor as (
    update public.briefings
       set status = 'failed',
           error  = coalesce(error, 'stalled in generating > 10min')
     where status = 'generating'
       and generation_started_at < now() - interval '10 minutes'
     returning id
  ),
  due as (
    select d.id as user_id, d.local_date
      from public.users_due_now d
      left join public.briefings b
        on b.user_id = d.id
       and b.date    = d.local_date
     where b.id is null
        or b.status = 'failed'
  ),
  claimed as (
    insert into public.briefings (user_id, date, status, generation_started_at)
    select user_id, local_date, 'generating', now()
      from due
    on conflict (user_id, date) do update
      set status = 'generating',
          generation_started_at = now(),
          error = null
      where public.briefings.status in ('pending', 'failed')
    returning id, user_id
  )
  select net.http_post(
    url := current_setting('app.edge_base_url') || '/functions/v1/generate-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'briefing_id', c.id,
      'user_id',     c.user_id
    )
  )
  from claimed c;
  $cron$
);
