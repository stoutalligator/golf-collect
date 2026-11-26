-- Push when a scheduled round moves (date or tee time) or an event is cancelled (deleted), to everyone who's in
-- or invited, except the person who made the change.

create function public.push_event_round_moved() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e record; m record; what text;
begin
  if new.scheduled_on is not distinct from old.scheduled_on and new.tee_time is not distinct from old.tee_time
     and new.course_id = old.course_id then
    return new;
  end if;
  select id, name into e from public.events where id = new.event_id;
  what := to_char(new.scheduled_on, 'Dy Mon FMDD')
          || coalesce(' at ' || to_char(new.tee_time, 'FMHH12:MI AM'), '');
  for m in select profile_id from public.event_members
           where event_id = new.event_id and status <> 'declined' and profile_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  loop
    perform public.send_push(m.profile_id, e.name || ' moved', new.name || ' is now ' || what || '.', '/event/' || e.id);
  end loop;
  return new;
exception when others then return new;
end;
$$;
create trigger event_rounds_push_moved after update on public.event_rounds for each row execute function public.push_event_round_moved();

create function public.push_event_cancelled() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m record;
begin
  for m in select profile_id from public.event_members
           where event_id = old.id and status <> 'declined' and profile_id <> old.organizer_id
  loop
    perform public.send_push(m.profile_id, old.name || ' cancelled', public.display_name(old.organizer_id) || ' cancelled it.', '/events');
  end loop;
  return old;
exception when others then return old;
end;
$$;
create trigger events_push_cancelled before delete on public.events for each row execute function public.push_event_cancelled();
