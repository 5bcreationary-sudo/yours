-- Persist real per-section start times (in seconds, from t=0) computed by the
-- TTS pipeline as it stitches voice + intro music + section transitions.
--
-- The player previously approximated section starts by scaling each section's
-- duration_minutes against the total audio duration, which drifted as soon as
-- ambient transition music was inserted between sections. Storing the exact
-- offsets removes the approximation and keeps text-highlight perfectly synced
-- with the narrated audio.
--
-- Format: jsonb array of numbers, e.g. [3.6, 92.4, 178.1, ...]. Length matches
-- sections.length when generation succeeded; null when older briefings predate
-- this column or the Fish (MP3) provider was used (offsets aren't derivable
-- from concatenated MP3s without re-decoding).

alter table public.briefings
  add column if not exists section_offsets jsonb;
