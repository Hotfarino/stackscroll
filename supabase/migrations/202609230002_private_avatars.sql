begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_select_own" on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.stackscroll_user_id())
  );
create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.stackscroll_user_id())
  );
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.stackscroll_user_id())
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.stackscroll_user_id())
  );
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.stackscroll_user_id())
  );

commit;
