-- =============================================================
-- Radio recordings — auto-captured Morning Devotion broadcasts
-- =============================================================

create table if not exists public.radio_recordings (
  id uuid primary key default gen_random_uuid(),
  program_name text not null default 'Morning Devotion',
  title text not null,
  broadcast_date date not null,
  broadcast_started_at timestamptz,
  broadcast_ended_at timestamptz,
  audio_url text not null,
  storage_path text,
  duration_seconds integer,
  file_size_bytes bigint,
  play_count integer default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  unique (program_name, broadcast_date)
);

create index if not exists idx_radio_pubdate on public.radio_recordings(broadcast_date desc);

alter table public.radio_recordings enable row level security;

drop policy if exists "public_read_published_radio" on public.radio_recordings;
create policy "public_read_published_radio" on public.radio_recordings
  for select to anon, authenticated using (is_published = true);

drop policy if exists "admin_write_radio" on public.radio_recordings;
create policy "admin_write_radio" on public.radio_recordings
  for all to authenticated using (true) with check (true);

-- Storage bucket for the MP3 files
insert into storage.buckets (id, name, public)
values ('radio-recordings', 'radio-recordings', true)
on conflict (id) do nothing;

-- Anyone can read the audio files
drop policy if exists "public_read_radio_audio" on storage.objects;
create policy "public_read_radio_audio" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'radio-recordings');

-- Service role and authenticated admins can write
drop policy if exists "service_write_radio_audio" on storage.objects;
create policy "service_write_radio_audio" on storage.objects
  for insert to authenticated, service_role
  with check (bucket_id = 'radio-recordings');

drop policy if exists "service_update_radio_audio" on storage.objects;
create policy "service_update_radio_audio" on storage.objects
  for update to authenticated, service_role
  using (bucket_id = 'radio-recordings');

-- Atomic increment used by the player + edge function
create or replace function public.increment_radio_play_count(rec_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.radio_recordings
     set play_count = coalesce(play_count, 0) + 1
   where id = rec_id;
$$;

grant execute on function public.increment_radio_play_count(uuid) to anon, authenticated;
