-- Extensions needed by the Yours backend.
-- pgcrypto: gen_random_uuid()
-- pg_cron:  minute-level scheduler for the briefing pipeline
-- pg_net:   async HTTP from SQL (cron -> edge function dispatch)

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron" with schema extensions;
create extension if not exists "pg_net" with schema extensions;
