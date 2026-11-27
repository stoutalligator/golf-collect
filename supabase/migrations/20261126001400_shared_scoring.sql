-- Shared scoring while playing. Rules:
--   * While a round is in progress, anyone playing it can enter or fix its hole scores: its owner, its scorekeeper,
--     players tagged on it (scramble teammates), and anyone with a round in the same group (friends who joined
--     live, the other teams in a multi-team scramble).
--   * Once it's finished, only the owner can change it.
--   * Every hole records who entered it last (hole_scores.entered_by), so the card can show "entered by Mike".
-- Managing a round's players (tagging, the owner slot) stays with the owner and scorekeeper only.

-- Is the signed-in player in this round group (they own a round whose group key matches)?
create function public.in_round_group(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rounds y where y.owner_id = auth.uid() and coalesce(y.group_id, y.id) = gid);
$$;
grant execute on function public.in_round_group(uuid) to authenticated, service_role;

-- Owner or scorekeeper (the old can_score_round): manages the round's players.
create function public.can_manage_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r and (x.owner_id = auth.uid() or (x.scored_by = auth.uid() and x.status = 'active'))
  );
$$;
grant execute on function public.can_manage_round(uuid) to authenticated, service_role;

-- Who can write hole scores: the owner always; while active, everyone playing it.
create or replace function public.can_score_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r and (
      x.owner_id = auth.uid()
      or (x.status = 'active' and (
        x.scored_by = auth.uid()
        or exists (select 1 from public.round_players p where p.round_id = x.id and p.profile_id = auth.uid())
        or public.in_round_group(coalesce(x.group_id, x.id))
      ))
    )
  );
$$;

drop policy if exists "scorer manages players" on public.round_players;
create policy "owner or scorekeeper manages players" on public.round_players for all to authenticated
  using (public.can_manage_round(round_id)) with check (public.can_manage_round(round_id));
-- ("scorer manages scores" on hole_scores already uses can_score_round, which now covers everyone playing.)

-- Group members must be able to see each other's rounds to score them (e.g. a scramble opponent who isn't your
-- friend). `in_round_group` is security definer so the rounds policy can use it without recursing into itself.

create or replace function public.can_view_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r
      and (
        x.owner_id = auth.uid()
        or x.scored_by = auth.uid()
        or exists (select 1 from public.round_players p where p.round_id = x.id and p.profile_id = auth.uid())
        or (x.visibility = 'friends' and public.are_friends(x.owner_id, auth.uid()))
        or public.share_event_round(x.event_round_id, x.owner_id, auth.uid())
        or public.in_round_group(coalesce(x.group_id, x.id))
      )
  );
$$;
-- The rounds policy checks the row's own columns (an upsert's new row isn't visible to a lookup by id yet).
drop policy if exists "read visible rounds" on public.rounds;
create policy "read visible rounds" on public.rounds for select to authenticated using (
  owner_id = auth.uid()
  or scored_by = auth.uid()
  or (visibility = 'friends' and public.are_friends(owner_id, auth.uid()))
  or exists (select 1 from public.round_players p where p.round_id = id and p.profile_id = auth.uid())
  or public.share_event_round(event_round_id, owner_id, auth.uid())
  or public.in_round_group(coalesce(group_id, id))
);

-- Who entered each hole.
alter table public.hole_scores add column entered_by uuid references public.profiles (id) on delete set null;
create function public.stamp_hole_entry() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and (tg_op = 'INSERT' or new.strokes is distinct from old.strokes) then
    new.entered_by := auth.uid();
  end if;
  return new;
end;
$$;
create trigger hole_scores_stamp before insert or update on public.hole_scores
  for each row execute function public.stamp_hole_entry();

-- Scramble pushes: everyone tagged on a team card hears about it and can open that card. Individual rounds keep
-- the "join with your own round" flow.
create or replace function public.push_teed_off() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record; course text; starter uuid;
begin
  if new.is_owner or new.profile_id is null then return new; end if;
  select id, owner_id, course_id, status, scored_by, group_id, played_on, format into r from public.rounds where id = new.round_id;
  if r.id is null or r.status <> 'active' or r.played_on < current_date - 1 or new.profile_id = r.owner_id then
    return new;
  end if;
  select name into course from public.courses where id = r.course_id;
  if r.format = 'scramble' then
    starter := coalesce(r.scored_by, r.owner_id);
    if new.profile_id = starter then return new; end if;
    perform public.send_push(new.profile_id, public.display_name(starter) || ' started a scramble with you',
      'At ' || coalesce(course, 'the course') || '. Open your team''s card to enter scores.', '/round/play/' || r.id);
    return new;
  end if;
  if r.scored_by is not null or r.group_id is null then return new; end if;
  if exists (select 1 from public.rounds x where x.owner_id = new.profile_id and (x.group_id = r.group_id or x.id = r.group_id)) then
    return new;
  end if;
  perform public.send_push(new.profile_id, public.display_name(r.owner_id) || ' teed off with you',
    'At ' || coalesce(course, 'the course') || '. Join to keep your own score and see the group live.',
    '/round/new?join=' || r.id);
  return new;
exception when others then return new;
end;
$$;
