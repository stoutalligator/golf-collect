-- Leagues start with no schedule; the organizer adds one-off rounds whenever they're set. Push each new round to
-- everyone who's in or invited, except the person who added it. (At event creation the only member is the
-- organizer, so creating a tournament with its rounds sends nothing.)

create function public.push_event_round_added() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e record; m record; what text;
begin
  select id, name, kind into e from public.events where id = new.event_id;
  if e.kind = 'outing' then return new; end if;
  what := to_char(new.scheduled_on, 'Dy Mon FMDD')
          || coalesce(' at ' || to_char(new.tee_time, 'FMHH12:MI AM'), '')
          || coalesce(' · ' || (select c.name from public.courses c where c.id = new.course_id), '');
  for m in select profile_id from public.event_members
           where event_id = new.event_id and status <> 'declined' and profile_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  loop
    perform public.send_push(m.profile_id, e.name || ': ' || new.name || ' scheduled', what || '.', '/event/' || e.id || '/round/' || new.id);
  end loop;
  return new;
exception when others then return new;
end;
$$;
create trigger event_rounds_push_added after insert on public.event_rounds for each row execute function public.push_event_round_added();
