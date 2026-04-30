-- Safety-net cron for manually-triggered briefings.
--
-- The main cron (yours-generate-briefings) only fires at each user's
-- delivery_time. When a user clicks "Generate now", trigger-briefing sets the
-- briefing to 'pending' and dispatches generate-morning-briefing via fetch.
-- If that dispatch is dropped (cold start, isolate termination), the briefing
-- sits in 'pending' forever.
--
-- This cron picks up any 'pending' briefing older than 60 seconds and
-- re-dispatches it. Idempotent: the pipeline atomically claims by transitioning
-- pending/failed → generating with generation_started_at = now().

select cron.schedule(
  'yours-pickup-pending',
  '* * * * *',
  $cron$
  with stale_pending as (
    select id, user_id
      from public.briefings
     where status = 'pending'
       and created_at < now() - interval '60 seconds'
  )
  select net.http_post(
    url := current_setting('app.edge_base_url') || '/functions/v1/generate-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'briefing_id', s.id,
      'user_id',     s.user_id
    )
  )
  from stale_pending s;
  $cron$
);
