-- Public picture storage for Trivia Party questions. Run once in the Supabase SQL Editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trivia-images', 'trivia-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Anyone using the app can upload pictures (no login). Public bucket = anyone can view by link. No deletes/overwrites.
drop policy if exists "trivia images upload" on storage.objects;
create policy "trivia images upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'trivia-images');
