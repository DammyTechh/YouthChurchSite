import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Search, BookOpen, Play,
  Image as ImageIcon, FileText, Headphones, Link as LinkIcon,
  Copy, Check, TrendingUp, Clock, X
} from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import UpcomingLiveStreams from '../components/UpcomingLiveStreams';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { label: string; icon: React.ReactNode; bg: string; fg: string }> = {
  image: { label: 'Image',   icon: <ImageIcon className="w-3 h-3" />,  bg: 'bg-blue-50',   fg: 'text-blue-700'   },
  video: { label: 'Video',   icon: <Play className="w-3 h-3" />,        bg: 'bg-purple-50', fg: 'text-purple-700' },
  audio: { label: 'Audio',   icon: <Headphones className="w-3 h-3" />, bg: 'bg-green-50',  fg: 'text-green-700'  },
  text:  { label: 'Article', icon: <FileText className="w-3 h-3" />,   bg: 'bg-[#F5EDD9]', fg: 'text-[#8B6914]'  },
  link:  { label: 'Link',    icon: <LinkIcon className="w-3 h-3" />,    bg: 'bg-orange-50', fg: 'text-orange-700' },
  flyer: { label: 'Flyer',   icon: <ImageIcon className="w-3 h-3" />,  bg: 'bg-pink-50',   fg: 'text-pink-700'   },
};

const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Inline share popover on the card ────────────────────────────────────────

const CardShareMenu = ({ post, onClose }: { post: BlogPost; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const url = `https://ruggedyouth.com/blog/${post.id}`;
  const enc = encodeURIComponent(url);
  const txt = encodeURIComponent(post.title);

  const options = [
    { label: 'WhatsApp',    icon: '💬', href: `https://wa.me/?text=${txt}%20${enc}` },
    { label: 'Facebook',    icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: 'Twitter / X', icon: '🐦', href: `https://twitter.com/intent/tweet?text=${txt}&url=${enc}` },
    { label: 'Instagram',   icon: '📸', href: 'https://www.instagram.com/ruggedyouth_4christ' },
  ];

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1800);
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 z-50 w-52 bg-white
      border border-[#EEEAE4] rounded-2xl shadow-2xl shadow-black/15 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-xs font-bold text-[#A8A6A0] uppercase tracking-widest">Share to</p>
        <button onClick={onClose} className="text-[#A8A6A0] hover:text-[#1A1A2E]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {options.map(o => (
        <a key={o.label} href={o.href} target="_blank" rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A2E]
            hover:bg-[#F8F7F4] transition-colors">
          <span>{o.icon}</span> {o.label}
        </a>
      ))}
      <div className="h-px bg-[#EEEAE4] mx-4" />
      <button onClick={copy}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm
          text-[#1A1A2E] hover:bg-[#F8F7F4] transition-colors">
        {copied
          ? <><Check className="w-4 h-4 text-green-500" /> Copied!</>
          : <><Copy className="w-4 h-4 text-[#A8A6A0]" /> Copy link</>
        }
      </button>
    </div>
  );
};

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = ({
  post, liked, onLike,
}: {
  post: BlogPost;
  liked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const cfg = TYPE_CFG[post.media_type || 'text'];

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node))
        setShareOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [shareOpen]);

  return (
    <div className="group bg-white rounded-2xl border border-[#EEEAE4] overflow-visible
      hover:border-[#C9A84C]/40 hover:shadow-xl hover:shadow-[#C9A84C]/8
      hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* ── Media thumbnail ── */}
      {post.media_url && (post.media_type === 'image' || post.media_type === 'flyer') && (
        <Link to={`/blog/${post.id}`} className="block overflow-hidden rounded-t-2xl">
          <img src={post.media_url} alt={post.title}
            className={`w-full h-52 group-hover:scale-105 transition-transform duration-500 ${
              post.media_type === 'flyer' ? 'object-contain bg-[#F0EEE9]' : 'object-cover'
            }`} />
        </Link>
      )}

      {post.media_url && post.media_type === 'video' && (
        <Link to={`/blog/${post.id}`}
          className="block h-52 bg-[#0F0E1A] rounded-t-2xl relative overflow-hidden">
          <video src={post.media_url} className="w-full h-full object-cover opacity-50" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/25
              border-2 border-[#C9A84C]/60 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-[#C9A84C] ml-0.5" />
            </div>
          </div>
        </Link>
      )}

      {post.media_url && post.media_type === 'audio' && (
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-3 p-3.5 bg-green-50
            border border-green-200 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-green-500/15 border border-green-400/30
              flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-green-600" />
            </div>
            <audio src={post.media_url} controls className="flex-1 h-8" />
          </div>
        </div>
      )}

      {post.media_url && post.media_type === 'link' && (
        <div className="px-5 pt-5 pb-2">
          <a href={post.media_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 bg-[#F8F7F4]
              border border-[#EEEAE4] rounded-xl hover:border-[#C9A84C]/40 transition-all group/link">
            <LinkIcon className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
            <span className="text-xs text-[#4A4A6A] truncate group-hover/link:text-[#C9A84C] transition-colors">
              {post.media_url}
            </span>
          </a>
        </div>
      )}

      {/* ── Card body ── */}
      <div className="p-5 flex-1 flex flex-col">

        {/* Type badge + date */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1
            rounded-full font-bold ${cfg.bg} ${cfg.fg}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-xs text-[#A8A6A0]">{timeAgo(post.created_at || '')}</span>
        </div>

        {/* Title + excerpt */}
        <Link to={`/blog/${post.id}`} className="flex-1 block mb-3">
          <h3 className="font-display text-[1.05rem] font-semibold text-[#1A1A2E]
            mb-2 line-clamp-2 group-hover:text-[#3D1F6E] transition-colors leading-snug">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-[#4A4A6A] leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full
                bg-[#F5EDD9] text-[#8B6914]">#{t}</span>
            ))}
          </div>
        )}

        {/* Author + action row */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#EEEAE4]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#C9A84C]/15
              border border-[#C9A84C]/25 flex items-center justify-center
              text-[#C9A84C] font-bold text-xs flex-shrink-0">
              {post.author_name?.[0]?.toUpperCase() || 'R'}
            </div>
            <span className="text-xs text-[#A8A6A0] font-medium truncate max-w-[80px]">
              {post.author_name || 'RuggedYouth'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Like */}
            <button onClick={e => onLike(post.id!, e)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                text-xs font-semibold transition-all select-none
                ${liked
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'text-[#A8A6A0] hover:text-red-400 hover:bg-red-50 border border-transparent'
                }`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              {post.like_count || 0}
            </button>

            {/* Comment link */}
            <Link to={`/blog/${post.id}#comments`}
              className="p-1.5 rounded-lg text-[#A8A6A0] hover:text-[#3D1F6E]
                hover:bg-[#F8F7F4] transition-all"
              title="Comments">
              <MessageCircle className="w-3.5 h-3.5" />
            </Link>

            {/* Share */}
            <div ref={shareRef} className="relative">
              <button onClick={() => setShareOpen(o => !o)}
                className={`p-1.5 rounded-lg transition-all
                  ${shareOpen
                    ? 'bg-[#F5EDD9] text-[#C9A84C]'
                    : 'text-[#A8A6A0] hover:text-[#C9A84C] hover:bg-[#F5EDD9]'
                  }`}
                title="Share">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              {shareOpen && <CardShareMenu post={post} onClose={() => setShareOpen(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Featured Card ────────────────────────────────────────────────────────────

const FeaturedCard = ({
  post, liked, onLike,
}: {
  post: BlogPost;
  liked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const cfg = TYPE_CFG[post.media_type || 'text'];

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node))
        setShareOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [shareOpen]);

  return (
    <div className="group bg-white rounded-2xl border border-[#EEEAE4]
      overflow-hidden hover:border-[#C9A84C]/40 hover:shadow-2xl
      hover:shadow-[#C9A84C]/10 transition-all duration-300">
      <div className="grid lg:grid-cols-2">

        {/* Left — visual */}
        <div className="relative h-64 lg:h-auto min-h-[280px] bg-[#0F0E1A] overflow-hidden">
          {post.media_url && (post.media_type === 'image' || post.media_type === 'flyer') ? (
            <img src={post.media_url} alt={post.title}
              className="w-full h-full object-cover opacity-90
                group-hover:scale-105 transition-transform duration-700" />
          ) : post.media_url && post.media_type === 'video' ? (
            <>
              <video src={post.media_url}
                className="w-full h-full object-cover opacity-40" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[#C9A84C]/20
                  border-2 border-[#C9A84C]/50 flex items-center justify-center">
                  <Play className="w-9 h-9 text-[#C9A84C] ml-1" />
                </div>
              </div>
            </>
          ) : post.media_url && post.media_type === 'audio' ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.15) 0%, #0F0E1A 70%)' }}>
              <Headphones className="w-20 h-20 text-green-500/30" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(61,31,110,0.7) 0%, #0F0E1A 70%)' }}>
              <BookOpen className="w-24 h-24 text-[#C9A84C]/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent
            lg:bg-gradient-to-r lg:from-transparent lg:to-white/5" />
        </div>

        {/* Right — content */}
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs
              px-2.5 py-1 rounded-full font-bold ${cfg.bg} ${cfg.fg}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-xs text-[#A8A6A0]">{timeAgo(post.created_at || '')}</span>
          </div>

          <Link to={`/blog/${post.id}`}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold
              text-[#1A1A2E] mb-3 leading-tight group-hover:text-[#3D1F6E] transition-colors">
              {post.title}
            </h2>
          </Link>

          {post.excerpt && (
            <p className="text-[#4A4A6A] leading-relaxed mb-5 line-clamp-4 text-sm lg:text-base">
              {post.excerpt}
            </p>
          )}

          {/* Audio player inline for featured */}
          {post.media_url && post.media_type === 'audio' && (
            <div className="mb-5">
              <audio src={post.media_url} controls className="w-full" />
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full
                  bg-[#F5EDD9] text-[#8B6914]">#{t}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-5 border-t border-[#EEEAE4] flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link to={`/blog/${post.id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r
                  from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] px-5 py-2.5
                  rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                Read More →
              </Link>
              <button onClick={e => onLike(post.id!, e)}
                className={`flex items-center gap-1.5 text-sm font-semibold
                  transition-all select-none
                  ${liked ? 'text-red-500' : 'text-[#A8A6A0] hover:text-red-400'}`}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {post.like_count || 0}
              </button>
            </div>

            {/* Share on featured */}
            <div ref={shareRef} className="relative">
              <button onClick={() => setShareOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                  font-medium transition-all
                  ${shareOpen
                    ? 'bg-[#1A1A2E] text-[#C9A84C]'
                    : 'bg-[#F8F7F4] border border-[#E2E0DC] text-[#4A4A6A] hover:bg-[#EEEAE4]'
                  }`}>
                <Share2 className="w-4 h-4" /> Share
              </button>
              {shareOpen && <CardShareMenu post={post} onClose={() => setShareOpen(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Blog Page ───────────────────────────────────────────────────────────

const Blog = () => {
  const [posts,      setPosts]      = useState<BlogPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    try {
      const s = localStorage.getItem('ry_liked_posts');
      if (s) setLikedPosts(new Set(JSON.parse(s)));
    } catch {}
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isLiked = likedPosts.has(postId);
      const next    = new Set(likedPosts);
      isLiked ? next.delete(postId) : next.add(postId);
      setLikedPosts(next);
      localStorage.setItem('ry_liked_posts', JSON.stringify([...next]));
      const post     = posts.find(p => p.id === postId);
      const newCount = (post?.like_count || 0) + (isLiked ? -1 : 1);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, like_count: newCount } : p
      ));
      await supabase
        .from('blog_posts')
        .update({ like_count: newCount })
        .eq('id', postId);
    } catch {}
  };

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const ok = !q
      || p.title.toLowerCase().includes(q)
      || (p.excerpt || '').toLowerCase().includes(q)
      || (p.tags  || []).some(t => t.toLowerCase().includes(q));
    return ok && (filter === 'all' || p.media_type === filter);
  });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  const FILTERS = ['all', 'text', 'image', 'video', 'audio', 'link', 'flyer'];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="py-14 bg-[#1A1A2E] relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 25% 60%, rgba(61,31,110,0.65) 0%, transparent 55%), radial-gradient(ellipse at 78% 30%, rgba(26,60,140,0.4) 0%, transparent 55%)' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5
            rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8">
            <BookOpen className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
              Community Blog
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
            Stories & <span className="text-[#C9A84C]">Insights</span>
          </h1>
          <p className="text-white/50 max-w-md mx-auto text-sm leading-relaxed">
            Read, like, comment and share — stay connected with everything
            happening in RuggedYouth.
          </p>
        </div>
      </section>

      {/* ── Upcoming Live Broadcasts ────────────────────────────── */}
      <UpcomingLiveStreams limit={3} variant="card" title="Upcoming Live Broadcasts" />

      {/* ── Sticky filter bar ────────────────────────────────────── */}
      <div className="sticky top-16 lg:top-20 z-30
        bg-white/96 backdrop-blur-md border-b border-[#EEEAE4] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row
          gap-3 items-start sm:items-center justify-between">

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A6A0]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search posts, tags…"
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F4] border
                border-[#E2E0DC] rounded-lg text-sm focus:outline-none
                focus:border-[#C9A84C] transition-colors"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize
                  transition-all ${
                    filter === f
                      ? 'bg-[#1A1A2E] text-[#C9A84C]'
                      : 'bg-[#F8F7F4] text-[#4A4A6A] hover:bg-[#EEEAE4] border border-[#E2E0DC]'
                  }`}>
                {f === 'all' ? '✦ All' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Skeleton */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse
                border border-[#EEEAE4]" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-28">
            <BookOpen className="w-14 h-14 text-[#C9A84C]/20 mx-auto mb-4" />
            <h3 className="font-display text-xl text-[#1A1A2E] mb-2">No posts found</h3>
            <p className="text-[#4A4A6A] text-sm">
              {search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Check back soon — new content is always coming.'}
            </p>
          </div>
        )}

        {/* Posts */}
        {!loading && filtered.length > 0 && (
          <>
            {/* Featured */}
            {featured && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-xs font-bold text-[#C9A84C]
                    uppercase tracking-widest">Latest Post</span>
                </div>
                <FeaturedCard
                  post={featured}
                  liked={likedPosts.has(featured.id!)}
                  onLike={handleLike}
                />
              </div>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4 text-[#A8A6A0]" />
                  <span className="text-xs font-bold text-[#A8A6A0]
                    uppercase tracking-widest">More Posts</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      liked={likedPosts.has(post.id!)}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
