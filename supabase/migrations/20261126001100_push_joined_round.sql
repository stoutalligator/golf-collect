-- "I played too": a friend logs their own round in the same group as yours (their group_id is your round's id, or
-- the group your round already belongs to). When they finish it, tell the other players in the group.
-- Skipped: rounds a scorekeeper entered for someone (scored_by set; they get "keeping score" pushes instead), and
-- group-mates whose round was scored by this same player (the scorekeeper's own group).

create function public.push_joined_round() returns trigger
language plpgsql security definer set search_path = '' as $$
declare course text; who text; m record;
begin
  if new.group_id is null or new.scored_by is not null or new.status <> 'complete' or old.status = 'complete' then
    return new;
  end if;
  select name into course from public.courses where id = new.course_id;
  course := coalesce(course, 'the course');
  who := public.display_name(new.owner_id);
  for m in
    select distinct r.owner_id from public.rounds r
    where (r.id = new.group_id or r.group_id = new.group_id)
      and r.id <> new.id
      and r.owner_id <> new.owner_id
      and (r.scored_by is null or r.scored_by <> new.owner_id)
  loop
    perform public.send_push(m.owner_id, who || ' played with you',
      who || ' added their scores to your round at ' || course || '.', '/round/' || new.id);
  end loop;
  return new;
exception when others then return new;
end;
$$;
create trigger rounds_push_joined after update of status on public.rounds
  for each row execute function public.push_joined_round();
