import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ───────────────────────────────────────────────────────────

export interface SocialMediaPost {
  id?: string
  title: string
  description: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook'
  url: string
  thumbnail: string
  date: string
  created_at?: string
}

export interface UpcomingEvent {
  id?: string
  title: string
  description: string
  date: string
  time: string
  location: string
  flier_url?: string
  is_active: boolean
  created_at?: string
}

export interface Program {
  id?: string
  title: string
  description: string
  schedule: string
  location: string
  icon: string
  created_at?: string
}

export interface NewMember {
  id?: string
  full_name: string
  phone: string
  email: string
  location: string
  created_at?: string
  subscribed_newsletter: boolean
}

export interface BlogPost {
  id?: string
  title: string
  content: string
  excerpt: string
  media_url?: string
  media_type?: 'image' | 'video' | 'audio' | 'text'
  author_name: string
  tags?: string[]
  is_published: boolean
  like_count: number
  created_at?: string
  updated_at?: string
}

export interface BlogComment {
  id?: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  admin_reply?: string
  replied_at?: string
  created_at?: string
}

export interface BlogLike {
  id?: string
  post_id: string
  user_fingerprint: string
  created_at?: string
}

export interface MediaAsset {
  id?: string
  title: string
  description?: string
  file_url: string
  file_type: 'image' | 'video' | 'audio' | 'document' | 'flyer' | 'program'
  file_size?: number
  tags?: string[]
  is_archived: boolean
  created_at?: string
}

// ─── Live Streaming ──────────────────────────────────────────────────

export type SocialPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok'
export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'failed'
export type ReactionKind = 'heart' | 'fire' | 'clap' | 'amen' | 'pray'

export interface SocialConnection {
  id?: string
  admin_user_id: string
  platform: SocialPlatform
  account_name?: string
  account_id?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  rtmp_url?: string
  stream_key?: string
  is_manual?: boolean
  meta?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface LiveStream {
  id?: string
  admin_user_id?: string
  title: string
  description?: string
  thumbnail_url?: string
  status: StreamStatus
  stream_type: 'video' | 'audio'
  scheduled_for?: string
  started_at?: string
  ended_at?: string
  ingest_provider?: string
  ingest_live_input_id?: string
  ingest_rtmp_url?: string
  ingest_stream_key?: string
  ingest_whip_url?: string
  playback_url?: string
  recording_url?: string
  recording_duration_seconds?: number
  viewer_count?: number
  peak_viewers?: number
  like_count?: number
  share_count?: number
  platforms?: SocialPlatform[]
  meta?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface StreamDestination {
  id?: string
  stream_id: string
  platform: SocialPlatform
  status: 'pending' | 'live' | 'ended' | 'failed' | 'disabled'
  external_broadcast_id?: string
  watch_url?: string
  rtmp_url?: string
  stream_key?: string
  cf_output_id?: string
  error_message?: string
  created_at?: string
}

export interface LiveChatMessage {
  id?: string
  stream_id: string
  user_fingerprint: string
  display_name: string
  message: string
  is_admin?: boolean
  is_pinned?: boolean
  is_deleted?: boolean
  created_at?: string
}

export interface LiveReaction {
  id?: string
  stream_id: string
  user_fingerprint: string
  kind: ReactionKind
  created_at?: string
}

export interface RadioRecording {
  id?: string
  program_name: string
  title: string
  broadcast_date: string
  broadcast_started_at?: string
  broadcast_ended_at?: string
  audio_url: string
  storage_path?: string
  duration_seconds?: number
  file_size_bytes?: number
  play_count?: number
  is_published?: boolean
  created_at?: string
}

export interface LiveAd {
  id?: string
  title: string
  body: string
  image_url?: string
  cta_label: string
  cta_url: string
  show_on_routes?: string[]
  display_style: 'corner' | 'banner' | 'modal' | 'toast'
  cooldown_minutes: number
  auto_hide_seconds?: number
  is_active?: boolean
  stream_id?: string
  priority?: number
  created_at?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

const FP_KEY = 'ry_fingerprint'
const NAME_KEY = 'ry_display_name'

export function getOrCreateFingerprint(): string {
  if (typeof window === 'undefined') return 'server'
  let fp = window.localStorage.getItem(FP_KEY)
  if (!fp) {
    fp = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36))
    window.localStorage.setItem(FP_KEY, fp)
  }
  return fp
}

export function getDisplayName(): string {
  if (typeof window === 'undefined') return 'Guest'
  return window.localStorage.getItem(NAME_KEY) || ''
}

export function setDisplayName(name: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(NAME_KEY, name.slice(0, 40))
  }
}
