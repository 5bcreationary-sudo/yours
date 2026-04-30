-- Add briefing_style column: 'straightforward' or 'conversational'
-- Controls how much personality/banter the two-host podcast script has.
alter table public.users
  add column briefing_style text not null default 'conversational'
  check (briefing_style in ('straightforward', 'conversational'));
