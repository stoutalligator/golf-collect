-- Table privileges for Supabase's API roles.
-- Newer Supabase projects don't auto-grant tables created via SQL to the Data API roles, so grant explicitly.
-- Row-level security (initial schema) still decides which rows each user can see or change; these grants only
-- decide which tables a role may touch at all.

-- Reference data: readable by everyone (signed in or not). No write grants: only the import script writes.
grant select on public.courses, public.course_holes, public.course_tees, public.course_sources, public.sim_courses
  to anon, authenticated;

-- User data: signed-in users only, filtered by RLS.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.friendships, public.rounds, public.round_players, public.hole_scores,
  public.reactions, public.comments, public.wishlist
  to authenticated;

-- The service role (local import/admin scripts) bypasses RLS and gets full access.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role, authenticated;

-- Helper functions used inside RLS policies.
grant execute on function public.are_friends(uuid, uuid), public.can_view_round(uuid), public.owns_round(uuid)
  to anon, authenticated, service_role;
