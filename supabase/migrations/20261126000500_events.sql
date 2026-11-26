-- Leagues, tournaments and scheduled rounds ("events").
--   events          one league season, tournament, or scheduled round (outing); format is config (jsonb)
--   event_members   who's in it (organizer / player) and their invite status
--   event_rounds    the schedule: date, course, tee, holes
--   event_matches   match play pairings per event round
--   rounds.event_round_id links a player's own logged round to an event round
-- Visibility: only members (and the organizer) see an event, its schedule and its members. Members of an event
-- can see each other's rounds that are linked to it, even if they aren't friends.

create type public.event_kind as enum ('league', 'tournament', 'outing');
create type public.event_member_status as enum ('invited', 'joined', 'declined');
create type public.event_role as enum ('organizer', 'player');

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  kind          public.event_kind not null,
  name          text not null check (char_length(name) between 1 and 60),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  format        jsonb not null,
  join_code     text not null unique check (join_code ~ '^[A-Z2-9]{6}$'),
  starts_on     date not null,
  ends_on       date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.event_members (
  event_id    uuid not null references public.events (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  role        public.event_role not null default 'player',
  status      public.event_member_status not null default 'invited',
  invited_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index event_members_profile_idx on public.event_members (profile_id);

create table public.event_rounds (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  seq           smallint not null,
  name          text not null check (char_length(name) between 1 and 40),
  course_id     text not null references public.courses (id),
  tee_id        text,
  scheduled_on  date not null,
  tee_time      time,
  holes         text not null default 'all' check (holes in ('all', 'front', 'back')),
  created_at    timestamptz not null default now(),
  unique (event_id, seq),
  foreign key (course_id, tee_id) references public.course_tees (course_id, id)
);
create index event_rounds_event_idx on public.event_rounds (event_id, scheduled_on);

create table public.event_matches (
  id              uuid primary key default gen_random_uuid(),
  event_round_id  uuid not null references public.event_rounds (id) on delete cascade,
  player_a        uuid not null references public.profiles (id) on delete cascade,
  player_b        uuid not null references public.profiles (id) on delete cascade,
  check (player_a <> player_b)
);
create index event_matches_round_idx on public.event_matches (event_round_id);

alter table public.rounds add column event_round_id uuid references public.event_rounds (id) on delete set null;
create index rounds_event_round_idx on public.rounds (event_round_id) where event_round_id is not null;

-- ── Helpers ────────────────────────────────────────────────────────────────

create function public.is_event_member(e uuid, who uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.event_members m where m.event_id = e and m.profile_id = who and m.status <> 'declined')
      or exists (select 1 from public.events x where x.id = e and x.organizer_id = who);
$$;

create function public.is_event_organizer(e uuid, who uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.events x where x.id = e and x.organizer_id = who);
$$;

/** True when both people are (non-declined) members of the event that this event round belongs to. */
create function public.share_event_round(er uuid, a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select er is not null and exists (
    select 1 from public.event_rounds r
    where r.id = er and public.is_event_member(r.event_id, a) and public.is_event_member(r.event_id, b)
  );
$$;

-- Join with a code: the only way to find an event you're not in. Returns the event id.
create function public.join_event(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare e uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into e from public.events where join_code = upper(trim(code));
  if e is null then raise exception 'No event with that code'; end if;
  insert into public.event_members (event_id, profile_id, role, status)
  values (e, auth.uid(), 'player', 'joined')
  on conflict (event_id, profile_id) do update set status = 'joined';
  return e;
end;
$$;

-- The organizer is always a joined member of their own event.
create function public.add_organizer_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.event_members (event_id, profile_id, role, status)
  values (new.id, new.organizer_id, 'organizer', 'joined')
  on conflict (event_id, profile_id) do update set role = 'organizer', status = 'joined';
  return new;
end;
$$;
create trigger events_add_organizer after insert on public.events
  for each row execute function public.add_organizer_member();

create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();

-- Rounds: members of the same event can see each other's linked rounds.
create or replace function public.can_view_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r
      and (
        x.owner_id = auth.uid()
        or exists (select 1 from public.round_players p where p.round_id = x.id and p.profile_id = auth.uid())
        or (x.visibility = 'friends' and public.are_friends(x.owner_id, auth.uid()))
        or public.share_event_round(x.event_round_id, x.owner_id, auth.uid())
      )
  );
$$;

drop policy if exists "read visible rounds" on public.rounds;
create policy "read visible rounds" on public.rounds for select to authenticated using (
  owner_id = auth.uid()
  or (visibility = 'friends' and public.are_friends(owner_id, auth.uid()))
  or exists (select 1 from public.round_players p where p.round_id = id and p.profile_id = auth.uid())
  or public.share_event_round(event_round_id, owner_id, auth.uid())
);

-- A round can only be linked to an event round the owner is a member of.
create function public.check_round_event_link() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.event_round_id is not null and not exists (
    select 1 from public.event_rounds r where r.id = new.event_round_id and public.is_event_member(r.event_id, new.owner_id)
  ) then
    raise exception 'You are not in this event';
  end if;
  return new;
end;
$$;
create trigger rounds_check_event_link before insert or update of event_round_id on public.rounds
  for each row execute function public.check_round_event_link();

-- ── Row-level security ─────────────────────────────────────────────────────

alter table public.events        enable row level security;
alter table public.event_members enable row level security;
alter table public.event_rounds  enable row level security;
alter table public.event_matches enable row level security;

create policy "members read events" on public.events for select to authenticated
  using (organizer_id = auth.uid() or public.is_event_member(id, auth.uid())
         or exists (select 1 from public.event_members m where m.event_id = id and m.profile_id = auth.uid()));
create policy "create own events" on public.events for insert to authenticated with check (organizer_id = auth.uid());
create policy "organizer updates event" on public.events for update to authenticated using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "organizer deletes event" on public.events for delete to authenticated using (organizer_id = auth.uid());

-- Invited people (even if they haven't accepted) can see the member list so they know who's playing.
create policy "members read members" on public.event_members for select to authenticated
  using (public.is_event_member(event_id, auth.uid()) or profile_id = auth.uid());
create policy "organizer invites" on public.event_members for insert to authenticated
  with check (public.is_event_organizer(event_id, auth.uid()) and role = 'player');
create policy "respond to own invite" on public.event_members for update to authenticated
  using (profile_id = auth.uid() or public.is_event_organizer(event_id, auth.uid()))
  with check (profile_id = auth.uid() or public.is_event_organizer(event_id, auth.uid()));
create policy "leave or remove" on public.event_members for delete to authenticated
  using ((profile_id = auth.uid() and role <> 'organizer') or (public.is_event_organizer(event_id, auth.uid()) and role <> 'organizer'));

create policy "members read schedule" on public.event_rounds for select to authenticated
  using (public.is_event_member(event_id, auth.uid())
         or exists (select 1 from public.event_members m where m.event_id = event_rounds.event_id and m.profile_id = auth.uid()));
create policy "organizer edits schedule" on public.event_rounds for all to authenticated
  using (public.is_event_organizer(event_id, auth.uid())) with check (public.is_event_organizer(event_id, auth.uid()));

create policy "members read matches" on public.event_matches for select to authenticated
  using (exists (select 1 from public.event_rounds r where r.id = event_round_id and public.is_event_member(r.event_id, auth.uid())));
create policy "organizer edits matches" on public.event_matches for all to authenticated
  using (exists (select 1 from public.event_rounds r where r.id = event_round_id and public.is_event_organizer(r.event_id, auth.uid())))
  with check (exists (select 1 from public.event_rounds r where r.id = event_round_id and public.is_event_organizer(r.event_id, auth.uid())));

grant select, insert, update, delete on public.events, public.event_members, public.event_rounds, public.event_matches to authenticated;
grant all on public.events, public.event_members, public.event_rounds, public.event_matches to service_role;
grant execute on function public.join_event(text) to authenticated;
grant execute on function public.is_event_member(uuid, uuid), public.is_event_organizer(uuid, uuid), public.share_event_round(uuid, uuid, uuid)
  to authenticated, service_role;
