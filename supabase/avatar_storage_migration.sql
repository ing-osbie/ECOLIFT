-- ============================================================================
-- Migration: avatar_storage_migration.sql
-- Description: Creates the 'avatars' storage bucket in Supabase and configures
--              Row-Level Security (RLS) policies for public read and user-owned
--              uploads, updates, and deletes.
-- ============================================================================

-- 1. Create the 'avatars' bucket if it doesn't already exist (and ensure it is public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = coalesce(storage.buckets.file_size_limit, 5242880),
  allowed_mime_types = coalesce(storage.buckets.allowed_mime_types, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- 2. Allow anyone (public and authenticated) to view avatar photos
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects
for select
using (bucket_id = 'avatars');

-- 3. Allow authenticated users to upload their own avatar photos (organized by user ID folder)
drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to update/overwrite their own avatar photos
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Allow authenticated users to delete their own avatar photos
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
