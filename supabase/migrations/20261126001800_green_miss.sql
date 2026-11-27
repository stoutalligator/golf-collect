-- Approach results: where the ball finished relative to the green ('hit' = green in regulation, or the miss
-- direction), and 'long' as a fairway miss (through the fairway). The app keeps hole_scores.gir in step
-- (gir = green = 'hit') so older builds that only read gir still show it.
alter type public.fairway_result add value if not exists 'long';

create type public.green_result as enum ('hit', 'left', 'right', 'short', 'long');
alter table public.hole_scores add column green public.green_result;
