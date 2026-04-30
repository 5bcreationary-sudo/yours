-- The pending-pickup cron added in 20260425000100 was failing every minute
-- with "unrecognized configuration parameter app.edge_base_url" because
-- Supabase hosted Postgres doesn't allow custom GUCs (same root cause
-- 20260412000060_cron_vault.sql fixed for the main generate-briefings cron).
--
-- This migration unschedules the broken job and reschedules it using the
-- same pattern that works for yours-generate-briefings: hardcoded edge URL
-- + service_role_key fetched from Supabase Vault.

select cron.unschedule('yours-pickup-pending');

select cron.schedule(
  'yours-pickup-pending',
  '* * * * *',
  $cron$
  with stale_pending as (
    select id, user_id
      from public.briefings
     where status = 'pending'
       and created_at < now() - interval '60 seconds'
  ),
  svc as (
    select decrypted_secret as key
      from vault.decrypted_secrets
     where name = 'service_role_key'
     limit 1
  )
  select net.http_post(
    url := 'https://sxapbuldhzmvellmchtj.supabase.co/functions/v1/generate-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select key from svc)
    ),
    body := jsonb_build_object(
      'briefing_id', s.id,
      'user_id',     s.user_id
    )
  )
  from stale_pending s;
  $cron$
);
