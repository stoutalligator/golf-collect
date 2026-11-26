-- Course index columns: the app downloads a lightweight course list (no holes/tees) at startup and loads full
-- scorecards on demand, so par and hole count live on the course row. Filled by `npm run db:import-courses`.

alter table public.courses
  add column if not exists par smallint,
  add column if not exists hole_count smallint;

update public.courses c
   set par = h.par, hole_count = h.n
  from (select course_id, sum(par)::smallint as par, count(*)::smallint as n from public.course_holes group by course_id) h
 where h.course_id = c.id;

create index if not exists courses_region_idx on public.courses (region);
