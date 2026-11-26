-- 9-hole courses: hole yardages may cover 9 holes, and each tee records whether its course rating is for the
-- real holes (9) or for playing the nine twice (18). The app plays a 9-hole course as 9, or 18 by going around twice.

alter table public.course_tees drop constraint if exists course_tees_hole_yardages_check;
alter table public.course_tees add constraint course_tees_hole_yardages_check
  check (hole_yardages is null or array_length(hole_yardages, 1) in (9, 18));

alter table public.course_tees add column if not exists rated_holes smallint not null default 18 check (rated_holes in (9, 18));
