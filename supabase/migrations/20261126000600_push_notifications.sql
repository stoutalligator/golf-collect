-- Push notifications. Devices register Expo push tokens; database triggers send pushes through Expo's push
-- service (https://exp.host) with pg_net, so no separate server or Edge Function is needed.
-- A push is best-effort: any failure is swallowed so it can never block the write that caused it.

create extension if not exists pg_net with schema extensions;

create table public.push_tokens (
  token       text primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  platform    text not null check (platform in ('ios', 'android')),
  updated_at  timestamptz not null default now()
);
create index push_tokens_profile_idx on public.push_tokens (profile_id);

alter table public.push_tokens enable row level security;
create policy "own push tokens" on public.push_tokens for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, update, delete on public.push_tokens to authenticated;
grant all on public.push_tokens to service_role;

-- Send one notification to every device of a user. `url` is an app route the app opens on tap.
create function public.send_push(recipient uuid, title text, body text, url text) returns void
language plpgsql security definer set search_path = '' as $$
declare msgs jsonb;
begin
  select jsonb_agg(jsonb_build_object('to', t.token, 'title', title, 'body', body, 'sound', 'default', 'data', jsonb_build_object('url', url)))
    into msgs
    from public.push_tokens t where t.profile_id = recipient;
  if msgs is null then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := msgs,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  raise warning 'send_push failed: %', sqlerrm;
end;
$$;
revoke all on function public.send_push(uuid, text, text, text) from public, anon, authenticated;

create function public.display_name(who uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select display_name from public.profiles where id = who), 'Someone');
$$;

-- ── Triggers ───────────────────────────────────────────────────────────────

create function public.push_friendship() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.send_push(new.addressee_id, 'Friend request', public.display_name(new.requester_id) || ' wants to be friends on Greens Keeper.', '/friends');
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
    perform public.send_push(new.requester_id, 'Friend request accepted', public.display_name(new.addressee_id) || ' accepted your friend request.', '/player/' || new.addressee_id);
  end if;
  return new;
exception when others then return new;
end;
$$;
create trigger friendships_push after insert or update on public.friendships for each row execute function public.push_friendship();

create function public.push_event_member() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e record;
begin
  select id, name, organizer_id, kind into e from public.events where id = new.event_id;
  if new.role = 'organizer' then return new; end if;
  if new.status = 'invited' and (tg_op = 'INSERT' or old.status <> 'invited') then
    perform public.send_push(new.profile_id, 'You’re invited',
      public.display_name(coalesce(new.invited_by, e.organizer_id)) || ' invited you to ' || e.name || '.', '/event/' || e.id);
  elsif new.status = 'joined' and (tg_op = 'INSERT' or old.status <> 'joined') and new.profile_id <> e.organizer_id then
    perform public.send_push(e.organizer_id, e.name, public.display_name(new.profile_id) || ' is in.', '/event/' || e.id);
  end if;
  return new;
exception when others then return new;
end;
$$;
create trigger event_members_push after insert or update on public.event_members for each row execute function public.push_event_member();

create function public.push_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner uuid;
begin
  select owner_id into owner from public.rounds where id = new.round_id;
  if owner is not null and owner <> new.user_id then
    perform public.send_push(owner, public.display_name(new.user_id) || ' commented on your round', left(new.body, 140), '/round/' || new.round_id);
  end if;
  return new;
exception when others then return new;
end;
$$;
create trigger comments_push after insert on public.comments for each row execute function public.push_comment();

create function public.push_reaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner uuid;
begin
  select owner_id into owner from public.rounds where id = new.round_id;
  if owner is not null and owner <> new.user_id then
    perform public.send_push(owner, 'Greens Keeper', public.display_name(new.user_id) || ' reacted ' || new.emoji || ' to your round.', '/round/' || new.round_id);
  end if;
  return new;
exception when others then return new;
end;
$$;
create trigger reactions_push after insert on public.reactions for each row execute function public.push_reaction();
