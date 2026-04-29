-- =============================================================
-- Live Streaming infrastructure
-- =============================================================

-- 1. social_connections — admin OAuth tokens + manual stream keys
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('youtube','facebook','instagram','tiktok')),
  account_name text,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  rtmp_url text,
  stream_key text,
  is_manual boolean default false,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (admin_user_id, platform)
);

create index if not exists idx_social_conn_user on public.social_connections(admin_user_id);

alter table public.social_connections enable row level security;

drop policy if exists "admin_read_own_conn" on public.social_connections;
create policy "admin_read_own_conn" on public.social_connections
  for select to authenticated
  using (admin_user_id = auth.uid());

drop policy if exists "admin_write_own_conn" on public.social_connections;
create policy "admin_write_own_conn" on public.social_connections
  for all to authenticated
  using (admin_user_id = auth.uid())
  with check (admin_user_id = auth.uid());

-- 2. live_streams — every broadcast (scheduled, live, ended)
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  thumbnail_url text,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','failed')),
  stream_type text not null default 'video' check (stream_type in ('video','audio')),
  scheduled_for timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  ingest_provider text default 'cloudflare',
  ingest_live_input_id text,
  ingest_rtmp_url text,
  ingest_stream_key text,
  ingest_whip_url text,
  playback_url text,
  recording_url text,
  recording_duration_seconds integer,
  viewer_count integer default 0,
  peak_viewers integer default 0,
  like_count integer default 0,
  share_count integer default 0,
  platforms text[] default array[]::text[],
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_live_streams_status on public.live_streams(status);
create index if not exists idx_live_streams_started on public.live_streams(started_at desc);

alter table public.live_streams enable row level security;

drop policy if exists "public_read_live_or_ended" on public.live_streams;
create policy "public_read_live_or_ended" on public.live_streams
  for select to anon, authenticated
  using (status in ('live','ended','scheduled'));

drop policy if exists "admin_write_streams" on public.live_streams;
create policy "admin_write_streams" on public.live_streams
  for all to authenticated
  using (true)
  with check (true);

-- 3. stream_destinations — per-platform fan-out targets per stream
create table if not exists public.stream_destinations (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  platform text not null,
  status text not null default 'pending' check (status in ('pending','live','ended','failed','disabled')),
  external_broadcast_id text,
  watch_url text,
  rtmp_url text,
  stream_key text,
  cf_output_id text,
  error_message text,
  created_at timestamptz default now()
);

create index if not exists idx_dest_stream on public.stream_destinations(stream_id);

alter table public.stream_destinations enable row level security;

drop policy if exists "public_read_destinations" on public.stream_destinations;
create policy "public_read_destinations" on public.stream_destinations
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_destinations" on public.stream_destinations;
create policy "admin_write_destinations" on public.stream_destinations
  for all to authenticated using (true) with check (true);

-- 4. live_chat_messages — viewer chat during the stream
create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_fingerprint text not null,
  display_name text not null,
  message text not null check (length(message) between 1 and 500),
  is_admin boolean default false,
  is_pinned boolean default false,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_chat_stream_time on public.live_chat_messages(stream_id, created_at);

alter table public.live_chat_messages enable row level security;

drop policy if exists "public_read_chat" on public.live_chat_messages;
create policy "public_read_chat" on public.live_chat_messages
  for select to anon, authenticated using (is_deleted = false);

drop policy if exists "public_post_chat" on public.live_chat_messages;
create policy "public_post_chat" on public.live_chat_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "admin_moderate_chat" on public.live_chat_messages;
create policy "admin_moderate_chat" on public.live_chat_messages
  for update to authenticated using (true) with check (true);

-- 5. live_reactions — heart/fire/clap reactions during the stream
create table if not exists public.live_reactions (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_fingerprint text not null,
  kind text not null check (kind in ('heart','fire','clap','amen','pray')),
  created_at timestamptz default now()
);

create index if not exists idx_react_stream on public.live_reactions(stream_id, created_at);

alter table public.live_reactions enable row level security;

drop policy if exists "public_react" on public.live_reactions;
create policy "public_react" on public.live_reactions
  for insert to anon, authenticated with check (true);

drop policy if exists "public_read_react" on public.live_reactions;
create policy "public_read_react" on public.live_reactions
  for select to anon, authenticated using (true);

-- 6. Realtime publication
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='live_streams') then
    alter publication supabase_realtime add table public.live_streams;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='live_chat_messages') then
    alter publication supabase_realtime add table public.live_chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='live_reactions') then
    alter publication supabase_realtime add table public.live_reactions;
  end if;
end $$;
