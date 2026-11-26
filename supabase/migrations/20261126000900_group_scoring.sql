-- Group scoring: one phone keeps score for the group. Each player still gets their own round (owned by them, so
-- stats, handicap, collectibles and event results work unchanged); the scorekeeper is recorded in `scored_by`.
--
-- Rules
--   * You can create a round for a friend (accepted friendship) with yourself as scorekeeper.
--   * The scorekeeper can edit that round, its players and its scores only while it's active. Once finished it's
--     the owner's alone (they can fix scores, delete it, etc.).
--   * Rounds scored together share a `group_id` so the play screen can show the whole group.

alter table public.rounds
  add column scored_by uuid references public.profiles (id) on delete set null,
  add column group_id uuid;
create index rounds_group_idx on public.rounds (group_id) where group_id is not null;
create index rounds_scored_by_idx on public.rounds (scored_by) where scored_by is not null;

-- Owner, or the scorekeeper of a round that's still in progress.
create function public.can_score_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r and (x.owner_id = auth.uid() or (x.scored_by = auth.uid() and x.status = 'active'))
  );
$$;
grant execute on function public.can_score_round(uuid) to authenticated, service_role;

-- Visibility: the scorekeeper can also see the round.
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
      )
  );
$$;

drop policy if exists "read visible rounds" on public.rounds;
create policy "read visible rounds" on public.rounds for select to authenticated using (
  owner_id = auth.uid()
  or scored_by = auth.uid()
  or (visibility = 'friends' and public.are_friends(owner_id, auth.uid()))
  or exists (select 1 from public.round_players p where p.round_id = id and p.profile_id = auth.uid())
  or public.share_event_round(event_round_id, owner_id, auth.uid())
);

drop policy if exists "create own rounds" on public.rounds;
create policy "create own or a friend's round" on public.rounds for insert to authenticated with check (
  owner_id = auth.uid()
  or (scored_by = auth.uid() and public.are_friends(owner_id, auth.uid()))
);

drop policy if exists "update own rounds" on public.rounds;
create policy "update own or scored rounds" on public.rounds for update to authenticated
  using (owner_id = auth.uid() or (scored_by = auth.uid() and status = 'active'))
  with check (owner_id = auth.uid() or (scored_by = auth.uid() and public.are_friends(owner_id, auth.uid())));

drop policy if exists "delete own rounds" on public.rounds;
create policy "delete own or abandon scored rounds" on public.rounds for delete to authenticated
  using (owner_id = auth.uid() or (scored_by = auth.uid() and status = 'active'));

drop policy if exists "owner manages players" on public.round_players;
create policy "scorer manages players" on public.round_players for all to authenticated
  using (public.can_score_round(round_id)) with check (public.can_score_round(round_id));

drop policy if exists "owner manages scores" on public.hole_scores;
create policy "scorer manages scores" on public.hole_scores for all to authenticated
  using (exists (select 1 from public.round_players p where p.id = round_player_id and public.can_score_round(p.round_id)))
  with check (exists (select 1 from public.round_players p where p.id = round_player_id and public.can_score_round(p.round_id)));

-- Pushes: tell the owner when someone starts keeping their score, and when the round is finished.
create function public.push_scored_round() returns trigger
language plpgsql security definer set search_path = '' as $$
declare course text;
begin
  if new.scored_by is null or new.scored_by = new.owner_id then return new; end if;
  select name into course from public.courses where id = new.course_id;
  course := coalesce(course, 'the course');
  if tg_op = 'INSERT' then
    perform public.send_push(new.owner_id, 'Your round at ' || course,
      public.display_name(new.scored_by) || ' is keeping score for the group.', '/round/' || new.id);
  elsif new.status = 'complete' and old.status <> 'complete' then
    perform public.send_push(new.owner_id, 'Round complete',
      public.display_name(new.scored_by) || ' finished your round at ' || course || '. See what you earned.', '/round/' || new.id);
  end if;
  return new;
exception when others then return new;
end;
$$;
create trigger rounds_push_scored after insert or update of status on public.rounds
  for each row execute function public.push_scored_round();
