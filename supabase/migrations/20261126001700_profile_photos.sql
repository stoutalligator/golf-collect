-- Profile photos. Public bucket (avatars show to friends, in feeds and on scorecards); each user writes only to
-- their own folder: avatars/<user id>/<file>.jpg. profiles.avatar_url (already in the schema) holds the public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars: list own folder" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- A profile photo must be a file in that user's own folder of this bucket (no arbitrary outside URLs).
alter table public.profiles add constraint profiles_avatar_url_check
  check (avatar_url is null or avatar_url ~ ('/storage/v1/object/public/avatars/' || id::text || '/[A-Za-z0-9_.-]+$'));
