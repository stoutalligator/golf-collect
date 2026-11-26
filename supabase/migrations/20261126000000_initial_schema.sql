-- Greens Keeper — initial schema (draft v0.1, 2026-11-26).
-- Design notes: docs/plan/database.md. Run in the Supabase SQL editor or with `supabase db push`.
--
-- Principles
--   * Course facts are reference data: readable by everyone, written only by the import script (service role).
--   * The only user data we store is what people enter: profiles, friendships, rounds + hole scores,
--     reactions, comments, wishlist. Stats, tiers, collectibles and badges are derived from rounds in the app.
--   * Row-level security on every table. Friends can see each other's rounds unless a round is private.

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
create type public.course_access as enum ('public', 'municipal', 'semi-private', 'private');
create type public.verification_status as enum ('official', 'cross-checked', 'single-source');
create type public.round_kind as enum ('course', 'sim');
create type public.round_status as enum ('active', 'complete');
create type public.round_visibility as enum ('friends', 'private');
create type public.fairway_result as enum ('hit', 'left', 'right', 'short');
create type public.friendship_status as enum ('pending', 'accepted');

-- ─────────────────────────────────────────────────────────────────────────────
-- Reference data: courses (researched; see .claude/skills/course-research)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.courses (
  id                  text primary key,                       -- slug, e.g. 'keney-park'
  name                text not null,
  city                text not null,
  state               char(2) not null,
  county              text,
  region              text not null,                          -- art region id (regions.json)
  biome               text,
  biome_source        jsonb,                                  -- { name, url, note }
  access              public.course_access not null,
  lat                 double precision not null,
  lng                 double precision not null,
  website             text,
  architect           text,
  year_opened         smallint,
  description         text not null,                          -- generated from facts, never copied
  verification_status public.verification_status not null,
  verification_notes  text[] not null default '{}',
  checked_on          date not null,
  tags                text[] not null default '{}',           -- e.g. 'national-park'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index courses_state_idx on public.courses (state);
create index courses_name_search_idx on public.courses using gin (to_tsvector('simple', name || ' ' || city));

create table public.course_holes (
  course_id text not null references public.courses (id) on delete cascade,
  number    smallint not null check (number between 1 and 18),
  par       smallint not null check (par between 3 and 6),
  handicap  smallint not null check (handicap between 1 and 18),   -- men's stroke index
  primary key (course_id, number)
);

create table public.course_tees (
  course_id      text not null references public.courses (id) on delete cascade,
  id             text not null,                                -- 'blue', stable within a course
  name           text not null,
  par            smallint not null,
  total_yards    integer not null,
  hole_yardages  integer[] check (hole_yardages is null or array_length(hole_yardages, 1) = 18),
  rating_men     numeric(4,1),
  slope_men      smallint,
  rating_women   numeric(4,1),
  slope_women    smallint,
  sort_order     smallint not null default 0,                  -- longest first
  primary key (course_id, id)
);

create table public.course_sources (
  id         bigint generated always as identity primary key,
  course_id  text not null references public.courses (id) on delete cascade,
  name       text not null,
  url        text not null,
  license    text,
  checked_on date not null
);
create index course_sources_course_idx on public.course_sources (course_id);

-- Fictional / platform simulator courses (separate track; never earn real-course credit).
create table public.sim_courses (
  id        text primary key,
  name      text not null,
  platform  text,
  holes     jsonb not null              -- [{ number, par, handicap }] × 18
);

-- ─────────────────────────────────────────────────────────────────────────────
-- People
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name    text not null check (char_length(display_name) between 1 and 40),
  tagline         text check (char_length(tagline) <= 80),
  avatar_url      text,
  home_state      char(2),
  home_course_id  text references public.courses (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Create a profile row when someone signs up (display name from the auth metadata or email).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Golfer'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- One row per pair. requester sends, addressee accepts.
create table public.friendships (
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        public.friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
-- Block a second row for the same pair in the other direction.
create unique index friendships_pair_idx on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Rounds
-- ─────────────────────────────────────────────────────────────────────────────
create table public.rounds (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  kind           public.round_kind not null,
  course_id      text references public.courses (id),
  sim_course_id  text references public.sim_courses (id),
  tee_id         text,
  played_on      date not null,
  status         public.round_status not null default 'active',
  hole_numbers   smallint[] not null check (array_length(hole_numbers, 1) between 1 and 18),
  visibility     public.round_visibility not null default 'friends',
  competition_id uuid,                                        -- leagues later
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz,
  check ((kind = 'course' and course_id is not null and sim_course_id is null)
      or (kind = 'sim' and sim_course_id is not null and course_id is null)),
  foreign key (course_id, tee_id) references public.course_tees (course_id, id)
);
create index rounds_owner_idx on public.rounds (owner_id, played_on desc);
create index rounds_course_idx on public.rounds (course_id) where course_id is not null;

-- Who played. The owner is always a row; friends are tagged by profile, others by guest name.
create table public.round_players (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references public.rounds (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete set null,
  guest_name  text check (char_length(guest_name) <= 40),
  is_owner    boolean not null default false,
  check (profile_id is not null or guest_name is not null),
  unique (round_id, profile_id)
);
create index round_players_profile_idx on public.round_players (profile_id);

-- Only strokes is required; every other stat is null when not entered (never 0 by default).
create table public.hole_scores (
  round_player_id  uuid not null references public.round_players (id) on delete cascade,
  hole_number      smallint not null check (hole_number between 1 and 18),
  strokes          smallint not null check (strokes between 1 and 20),
  putts            smallint check (putts between 0 and 10),
  fairway          public.fairway_result,
  gir              boolean,                                   -- explicit override; else derived
  penalties        smallint check (penalties between 0 and 10),
  chips            smallint check (chips between 0 and 10),
  sand_shots       smallint check (sand_shots between 0 and 10),
  primary key (round_player_id, hole_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Social
-- ─────────────────────────────────────────────────────────────────────────────
create table public.reactions (
  round_id   uuid not null references public.rounds (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  emoji      text not null check (emoji in ('👏', '🔥', '⛳', '😂')),
  created_at timestamptz not null default now(),
  primary key (round_id, user_id)                            -- one reaction per person per round
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index comments_round_idx on public.comments (round_id, created_at);

create table public.wishlist (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  course_id  text not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Visibility helper: can the current user see this round?
-- ─────────────────────────────────────────────────────────────────────────────
create function public.can_view_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rounds x
    where x.id = r
      and (
        x.owner_id = auth.uid()
        or exists (select 1 from public.round_players p where p.round_id = x.id and p.profile_id = auth.uid())
        or (x.visibility = 'friends' and public.are_friends(x.owner_id, auth.uid()))
      )
  );
$$;

create function public.owns_round(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rounds x where x.id = r and x.owner_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.courses         enable row level security;
alter table public.course_holes    enable row level security;
alter table public.course_tees     enable row level security;
alter table public.course_sources  enable row level security;
alter table public.sim_courses     enable row level security;
alter table public.profiles        enable row level security;
alter table public.friendships     enable row level security;
alter table public.rounds          enable row level security;
alter table public.round_players   enable row level security;
alter table public.hole_scores     enable row level security;
alter table public.reactions       enable row level security;
alter table public.comments        enable row level security;
alter table public.wishlist        enable row level security;

-- Reference data: anyone can read; no insert/update/delete policies (service role bypasses RLS).
create policy "courses are public"        on public.courses        for select using (true);
create policy "course holes are public"   on public.course_holes   for select using (true);
create policy "course tees are public"    on public.course_tees    for select using (true);
create policy "course sources are public" on public.course_sources for select using (true);
create policy "sim courses are public"    on public.sim_courses    for select using (true);

-- Profiles: signed-in users can find each other; you edit only yourself.
create policy "profiles readable when signed in" on public.profiles for select to authenticated using (true);
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Friendships: visible to both people; you send requests as yourself; the addressee accepts; either removes.
create policy "see own friendships" on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy "send friend request" on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy "accept friend request" on public.friendships for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy "remove friendship" on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Rounds: owner has full control; friends and tagged players can read.
create policy "read visible rounds" on public.rounds for select to authenticated using (public.can_view_round(id));
create policy "create own rounds" on public.rounds for insert to authenticated with check (owner_id = auth.uid());
create policy "update own rounds" on public.rounds for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own rounds" on public.rounds for delete to authenticated using (owner_id = auth.uid());

create policy "read players of visible rounds" on public.round_players for select to authenticated using (public.can_view_round(round_id));
create policy "owner manages players" on public.round_players for all to authenticated
  using (public.owns_round(round_id)) with check (public.owns_round(round_id));

create policy "read scores of visible rounds" on public.hole_scores for select to authenticated
  using (exists (select 1 from public.round_players p where p.id = round_player_id and public.can_view_round(p.round_id)));
create policy "owner manages scores" on public.hole_scores for all to authenticated
  using (exists (select 1 from public.round_players p where p.id = round_player_id and public.owns_round(p.round_id)))
  with check (exists (select 1 from public.round_players p where p.id = round_player_id and public.owns_round(p.round_id)));

-- Reactions & comments: on rounds you can see, as yourself.
create policy "read reactions" on public.reactions for select to authenticated using (public.can_view_round(round_id));
create policy "react as yourself" on public.reactions for insert to authenticated with check (user_id = auth.uid() and public.can_view_round(round_id));
create policy "change own reaction" on public.reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "remove own reaction" on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy "read comments" on public.comments for select to authenticated using (public.can_view_round(round_id));
create policy "comment as yourself" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.can_view_round(round_id));
create policy "edit own comment" on public.comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own or on own round" on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.owns_round(round_id));

create policy "own wishlist" on public.wishlist for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at bookkeeping
-- ─────────────────────────────────────────────────────────────────────────────
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger courses_touch  before update on public.courses  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger rounds_touch   before update on public.rounds   for each row execute function public.touch_updated_at();
