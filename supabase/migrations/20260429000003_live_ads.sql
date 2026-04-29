-- =============================================================
-- Live announcement popups (sitewide)
-- =============================================================
-- Rows here drive the popup that appears on blogs / programs / home /
-- etc. while a stream is going. Admin can configure copy + style + which
-- routes to show on. If no rows match, the popup uses a built-in default.

create table if not exists public.live_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'We''re Live Now!',
  body text not null default 'Join our live broadcast — tap to watch with the community.',
  image_url text,
  cta_label text not null default 'Watch Live',
  cta_url text not null default '/live',
  show_on_routes text[] default array['/', '/blog', '/programs', '/media', '/about']::text[],
  display_style text not null default 'corner' check (display_style in ('corner','banner','modal','toast')),
  cooldown_minutes integer not null default 30,
  auto_hide_seconds integer default 0,
  is_active boolean default true,
  stream_id uuid references public.live_streams(id) on delete set null,
  priority integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_live_ads_active on public.live_ads(is_active, priority desc);

alter table public.live_ads enable row level security;

drop policy if exists "public_read_active_ads" on public.live_ads;
create policy "public_read_active_ads" on public.live_ads
  for select to anon, authenticated using (is_active = true);

drop policy if exists "admin_write_ads" on public.live_ads;
create policy "admin_write_ads" on public.live_ads
  for all to authenticated using (true) with check (true);
