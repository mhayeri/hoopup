-- Avatars storage bucket + ownership policies
--
-- Path convention: avatars/<user_id>/<filename>
-- Reads are public so any client can render <img src="...avatars/<id>/...">.
-- Writes (INSERT/UPDATE/DELETE) are restricted to objects whose first path
-- segment matches auth.uid(), so users can only manage their own avatar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read for avatars (objects table already has RLS enabled by Supabase)

create policy avatars_read_all on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
