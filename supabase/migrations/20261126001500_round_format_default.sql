-- A multi-row insert that leaves `format` out of some rows sends null for them (PostgREST fills the union of
-- columns), which the not-null column rejected. Treat a missing format as an individual round.
create function public.default_round_format() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.format := coalesce(new.format, 'individual');
  return new;
end;
$$;
create trigger rounds_default_format before insert or update on public.rounds
  for each row execute function public.default_round_format();
