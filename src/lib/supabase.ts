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
