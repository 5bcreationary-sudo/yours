-- Allow users to insert their own row in public.users.
-- The auth trigger normally creates the row, but if it ever fails or the row
-- is deleted manually, the user should be able to recover by writing their
-- own row. The check still requires id == auth.uid(), so users can only
-- create their own profile.

drop policy if exists users_no_direct_insert on public.users;

create policy users_self_insert on public.users
  for insert with check (auth.uid() = id);
