insert into storage.buckets (id, name, public)
values ('badge-posts', 'badge-posts', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload badge post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'badge-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Public can view badge post images"
on storage.objects
for select
to public
using (bucket_id = 'badge-posts');

create policy "Users can delete their own badge post images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'badge-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
