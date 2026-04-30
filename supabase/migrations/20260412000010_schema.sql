-- Core Yours schema.
-- briefing_sections is the source of truth for sections; briefings has no embedded array.

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone_e164 text,
  timezone text not null default 'America/Los_Angeles',
  delivery_time time not null default '07:00',
  preferred_length_minutes int not null default 8
    check (preferred_length_minutes in (3, 8, 12)),
  tone text not null default 'upbeat'
    check (tone in ('upbeat', 'calm', 'professional')),
  briefing_mode text not null default 'morning'
    check (briefing_mode in ('morning', 'commute', 'executive')),
  onboarding_complete boolean not null default false,
  evening_preference boolean not null default false,
  home_address jsonb,
  work_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index users_delivery_time_idx on public.users (delivery_time);

create table public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  freeform_text text,
  selected_packages text[] not null default '{}',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create unique index user_interests_user_id_key on public.user_interests (user_id);

create table public.user_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('gmail', 'calendar', 'rss')),
  -- gmail/calendar: { provider:'google', refresh_token_enc, access_token_enc, expires_at, scopes }
  -- rss:            { url, name, preset_id? }
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index user_sources_user_id_idx on public.user_sources (user_id);
create index user_sources_type_idx on public.user_sources (user_id, type);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'ready', 'failed')),
  listened_at timestamptz,
  audio_url text,
  audio_duration_seconds int,
  token_hash text,
  error text,
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  created_at timestamptz not null default now()
);
-- One briefing per user per local date. Cron relies on this for idempotent claiming.
create unique index briefings_user_date_key on public.briefings (user_id, date);

create table public.briefing_sections (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  type text not null check (type in (
    'weather','traffic','calendar','emails','news',
    'interests','sports','health','entertainment'
  )),
  title text not null,
  summary text not null,
  card_payload jsonb,
  "order" int not null,
  duration_minutes numeric(4,1) not null default 0
);
create index briefing_sections_briefing_idx on public.briefing_sections (briefing_id, "order");

-- Touch updated_at on mutation.
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.tg_set_updated_at();

create trigger user_interests_set_updated_at
before update on public.user_interests
for each row execute function public.tg_set_updated_at();
