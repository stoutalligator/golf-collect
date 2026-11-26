-- Fix: creating or upserting a round failed RLS ("new row violates row-level security policy").
-- INSERT ... ON CONFLICT (and RETURNING) also checks the SELECT policy against the new row. The old policy
-- looked the round up by id via can_view_round(id), which can't see a row that is still being inserted.
-- Check the row's own columns instead; same rule: owner, tagged player, or accepted friend unless private.

drop policy if exists "read visible rounds" on public.rounds;

create policy "read visible rounds" on public.rounds for select to authenticated using (
  owner_id = auth.uid()
  or (visibility = 'friends' and public.are_friends(owner_id, auth.uid()))
  or exists (select 1 from public.round_players p where p.round_id = id and p.profile_id = auth.uid())
);
