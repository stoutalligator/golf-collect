-- Any real course can be played on a simulator. A sim round now points at either a sim course or a real course
-- (course_id, with an optional tee for yardages). Sim rounds still never earn real-course credit: the app only
-- counts kind = 'course' toward visits, collectibles, records and real-course achievements.
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.rounds'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%sim_course_id%';
  if c is not null then execute format('alter table public.rounds drop constraint %I', c); end if;
end $$;

alter table public.rounds add constraint rounds_course_ref_check check (
  (kind = 'course' and course_id is not null and sim_course_id is null)
  or (kind = 'sim' and ((sim_course_id is not null and course_id is null and tee_id is null)
                      or (course_id is not null and sim_course_id is null)))
);
