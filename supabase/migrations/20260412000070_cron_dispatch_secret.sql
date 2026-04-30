-- The prior cron job (060) authenticated with the service role key stored in
-- vault. That turned out to be brittle: Supabase auto-injects
-- SUPABASE_SERVICE_ROLE_KEY into edge function environments, and a manually
-- pasted legacy JWT won't necessarily match the auto-injected current key.
-- Result: cron fired, function returned 401 "service role required".
--
-- This migration replaces the cron job to send a dispatch secret we control
-- (stored in vault as 'cron_dispatch_secret', also set as the
-- CRON_DISPATCH_SECRET edge function secret). The edge function accepts
-- either the dispatch secret or the service role key.

select cron.unschedule('yours-generate-briefings');

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
  ),
  svc as (
    select decrypted_secret as key
      from vault.decrypted_secrets
     where name = 'cron_dispatch_secret'
     limit 1
  )
  select net.http_post(
    url := 'https://sxapbuldhzmvellmchtj.supabase.co/functions/v1/generate-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select key from svc)
    ),
    body := jsonb_build_object(
      'briefing_id', c.id,
      'user_id',     c.user_id
    )
  )
  from claimed c;
  $cron$
);
