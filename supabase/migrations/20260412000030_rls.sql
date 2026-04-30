-- RLS: users own their data. Writes to briefings/briefing_sections go through
-- service_role (edge functions). Service role bypasses RLS by default.

alter table public.users             enable row level security;
alter table public.user_interests    enable row level security;
alter table public.user_sources      enable row level security;
alter table public.briefings         enable row level security;
alter table public.briefing_sections enable row level security;

-- users: self only. Inserts are handled by the auth trigger.
create policy users_self_select on public.users
  for select using (auth.uid() = id);
create policy users_self_update on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy users_no_direct_insert on public.users
  for insert with check (false);

-- user_interests / user_sources: self, full CRUD.
create policy user_interests_self on public.user_interests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_sources_self on public.user_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- briefings: authed owner SELECT.
create policy briefings_self_select on public.briefings
  for select using (auth.uid() = user_id);

-- briefings: signed-token SELECT. Belt-and-suspenders — the edge get-briefing
-- function is canonical and uses service_role, but if a caller presents a
-- custom JWT with briefing_id claim this allows PostgREST read-through.
create policy briefings_token_select on public.briefings
  for select using (
    id::text = coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'briefing_id',
      ''
    )
  );

-- briefing_sections: mirrors parent briefing access.
create policy briefing_sections_self_select on public.briefing_sections
  for select using (
    exists (
      select 1 from public.briefings b
      where b.id = briefing_sections.briefing_id
        and b.user_id = auth.uid()
    )
  );

create policy briefing_sections_token_select on public.briefing_sections
  for select using (
    briefing_id::text = coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'briefing_id',
      ''
    )
  );

-- Mark listened_at without needing update policy on whole briefings row.
create or replace function public.mark_briefing_listened(p_briefing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.briefings
     set listened_at = now()
   where id = p_briefing_id
     and (auth.uid() = user_id
          or id::text = coalesce(
               current_setting('request.jwt.claims', true)::jsonb ->> 'briefing_id',
               ''));
$$;

grant execute on function public.mark_briefing_listened(uuid) to anon, authenticated;
