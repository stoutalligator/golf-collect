-- Fix: deleting an account failed when that person was tagged on someone else's round.
-- round_players.profile_id is ON DELETE SET NULL, but a check requires profile_id or guest_name, so the
-- delete was rejected. Before a profile is deleted, turn its tags on other people's rounds into guest
-- names: the round still says who played, and the deleted account's data is gone.
-- Owner rows are included: Postgres may null them before the cascade deletes the person's own rounds.
-- (Rounds the person owned are deleted with them, as before.)

create or replace function public.keep_tags_as_guests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.round_players
     set guest_name = old.display_name
   where profile_id = old.id;
  return old;
end;
$$;

drop trigger if exists profiles_keep_tags_as_guests on public.profiles;
create trigger profiles_keep_tags_as_guests before delete on public.profiles
  for each row execute function public.keep_tags_as_guests();
