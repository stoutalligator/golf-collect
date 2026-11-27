-- Live group: when you start a round and tag friends who keep score on their own phones, each tagged friend gets
-- "X teed off with you", which opens Log a Round to join the same group (their own round, group_id = yours).
-- Fires on round_players inserts (players are added once per round, never re-written per hole). Skipped for:
-- rounds being entered for someone else (scored_by set), past rounds logged after the fact, rounds already
-- finished, and friends who already have a round in the group (e.g. the scorekeeper is keeping theirs).

create function public.push_teed_off() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record; course text;
begin
  if new.is_owner or new.profile_id is null then return new; end if;
  select id, owner_id, course_id, status, scored_by, group_id, played_on into r from public.rounds where id = new.round_id;
  if r.id is null or r.status <> 'active' or r.scored_by is not null or r.group_id is null
     or r.played_on < current_date - 1 or new.profile_id = r.owner_id then
    return new;
  end if;
  if exists (select 1 from public.rounds x where x.owner_id = new.profile_id and (x.group_id = r.group_id or x.id = r.group_id)) then
    return new;
  end if;
  select name into course from public.courses where id = r.course_id;
  perform public.send_push(new.profile_id, public.display_name(r.owner_id) || ' teed off with you',
    'At ' || coalesce(course, 'the course') || '. Join to keep your own score and see the group live.',
    '/round/new?join=' || r.id);
  return new;
exception when others then return new;
end;
$$;
create trigger round_players_push_teed_off after insert on public.round_players
  for each row execute function public.push_teed_off();
