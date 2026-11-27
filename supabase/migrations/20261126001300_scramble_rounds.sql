-- Scramble rounds: one team score per hole, logged by one player with teammates tagged. They show in the feed and
-- on scorecards but never count toward handicap, stats, collectibles or badges (the app skips them, like sim
-- rounds are kept apart). Teammates are tagged players, not group members, so the live-group pushes skip them.

alter table public.rounds add column format text not null default 'individual'
  check (format in ('individual', 'scramble'));

-- "X teed off with you" is for friends keeping their own score; a scramble team plays on one card.
create or replace function public.push_teed_off() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record; course text;
begin
  if new.is_owner or new.profile_id is null then return new; end if;
  select id, owner_id, course_id, status, scored_by, group_id, played_on, format into r from public.rounds where id = new.round_id;
  if r.id is null or r.status <> 'active' or r.scored_by is not null or r.group_id is null or r.format = 'scramble'
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
