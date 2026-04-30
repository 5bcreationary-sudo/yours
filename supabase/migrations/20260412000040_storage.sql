-- Private bucket for briefing MP3s. Access only via short-lived signed URLs
-- minted by the get-briefing edge function. Objects are keyed {user_id}/{briefing_id}.mp3.

insert into storage.buckets (id, name, public)
values ('briefing-audio', 'briefing-audio', false)
on conflict (id) do nothing;

-- Owner read (for the authed dashboard use case; public link path uses signed URLs).
create policy "briefing-audio owner read"
on storage.objects for select
using (
  bucket_id = 'briefing-audio'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Writes are service_role only (no explicit policy; service_role bypasses RLS).
