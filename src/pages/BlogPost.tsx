import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, ArrowLeft, Send, Play, Headphones,
  Copy, Check, ExternalLink, Link as LinkIcon, BookOpen,
  Clock, User, ChevronDown, ChevronUp, X, Reply
} from 'lucide-react';
import { supabase, BlogPost as BlogPostType, BlogComment } from '../lib/supabase';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

// ─── Share panel ───────────────────────────────────────────────────────────────
const SharePanel = ({ post, onClose }: { post: BlogPostType; onClose?: () => void }) => {
  const [copied, setCopied] = useState(false);
  const url = `https://ruggedyouth.com/blog/${post.id}`;
  const enc = encodeURIComponent(url);
  const txt = encodeURIComponent(post.title);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); onClose?.(); return; } catch {}
    }
  };

  const platforms = [
    { name: 'WhatsApp',    emoji: '💬', bg: 'bg-[#25D366]',                                                          href: `https://wa.me/?text=${txt}%20${enc}` },
    { name: 'Facebook',    emoji: '📘', bg: 'bg-[#1877F2]',                                                          href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { name: 'Twitter / X', emoji: '🐦', bg: 'bg-[#0F1419]',                                                          href: `https://twitter.com/intent/tweet?text=${txt}&url=${enc}` },
    { name: 'Instagram',   emoji: '📸', bg: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',           href: 'https://www.instagram.com/ruggedyouth_4christ' },
    { name: 'LinkedIn',    emoji: '💼', bg: 'bg-[#0A66C2]',                                                          href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { name: 'Email',       emoji: '✉️', bg: 'bg-[#4A4A6A]',                                                          href: `mailto:?subject=${txt}&body=${enc}` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EEEAE4] p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-display text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#C9A84C]" /> Share This Post
        </h4>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-[#A8A6A0] hover:text-[#1A1A2E] hover:bg-[#F8F7F4] transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Native share (shows on mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button onClick={nativeShare}
          className="w-full flex items-center justify-center gap-2 mb-4 py-3 bg-[#1A1A2E] text-[#C9A84C] font-semibold text-sm rounded-xl hover:bg-[#2D2D44] transition-all">
          <Share2 className="w-4 h-4" /> Share via your apps
        </button>
      )}

      {/* Platform grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {platforms.map(p => (
          <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 ${p.bg} text-white rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md`}>
            <span className="text-lg leading-none">{p.emoji}</span>
            <span className="leading-none">{p.name.split('/')[0]}</span>
          </a>
        ))}
      </div>

      {/* Copy link */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#F8F7F4] border border-[#E2E0DC] rounded-xl px-3 py-2.5 text-sm text-[#4A4A6A] min-w-0">
          <LinkIcon className="w-3.5 h-3.5 text-[#A8A6A0] flex-shrink-0" />
          <span className="truncate text-xs">{url}</span>
        </div>
        <button onClick={copy}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            copied ? 'bg-green-500 text-white' : 'bg-[#1A1A2E] text-[#C9A84C] hover:bg-[#2D2D44]'
          }`}>
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
        </button>
      </div>
    </div>
  );
};

// ─── Comment card ──────────────────────────────────────────────────────────────
const CommentCard = ({ comment }: { comment: BlogComment }) => (
  <div className="flex gap-3 group">
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#3D1F6E]/20 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] font-bold text-sm flex-shrink-0">
      {(comment.author_name[0] || 'A').toUpperCase()}
    </div>
    <div className="flex-1">
      {/* User comment bubble */}
      <div className="bg-white rounded-2xl rounded-tl-sm border border-[#EEEAE4] px-5 py-4 group-hover:border-[#C9A84C]/20 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1A1A2E]">{comment.author_name}</span>
          <span className="text-xs text-[#A8A6A0]">{timeAgo(comment.created_at || '')}</span>
        </div>
        <p className="text-sm text-[#4A4A6A] leading-relaxed">{comment.content}</p>
      </div>

      {/* Admin reply bubble */}
      {comment.admin_reply && (
        <div className="ml-4 mt-2 flex gap-2">
          <div className="w-7 h-7 rounded-full bg-[#3D1F6E] flex items-center justify-center flex-shrink-0">
            <Reply className="w-3.5 h-3.5 text-[#C9A84C]" />
          </div>
          <div className="flex-1 bg-[#1A1A2E]/5 border border-[#3D1F6E]/20 rounded-2xl rounded-tl-sm px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#3D1F6E]">RuggedYouth Team</span>
              {comment.replied_at && (
                <span className="text-xs text-[#A8A6A0]">{timeAgo(comment.replied_at)}</span>
              )}
            </div>
            <p className="text-sm text-[#4A4A6A] leading-relaxed">{comment.admin_reply}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Main BlogPost ─────────────────────────────────────────────────────────────
const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [commentForm, setCommentForm] = useState({ author_name: '', author_email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [commentStatus, setCommentStatus] = useState<'idle'|'success'|'error'>('idle');
  const [showAllComments, setShowAllComments] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchPost();
    fetchComments();
    const stored = localStorage.getItem('ry_liked_posts');
    if (stored) setIsLiked(new Set(JSON.parse(stored)).has(id));
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase.from('blog_posts').select('*').eq('id', id).single();
    setPost(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  const handleLike = async () => {
    if (!post?.id) return;
    const stored = localStorage.getItem('ry_liked_posts');
    const liked = new Set<string>(stored ? JSON.parse(stored) : []);
    const nowLiked = !isLiked;
    nowLiked ? liked.add(post.id) : liked.delete(post.id);
    localStorage.setItem('ry_liked_posts', JSON.stringify([...liked]));
    setIsLiked(nowLiked);
    setLikePulse(true);
    setTimeout(() => setLikePulse(false), 500);
    const newCount = Math.max(0, (post.like_count || 0) + (nowLiked ? 1 : -1));
    setPost(p => p ? { ...p, like_count: newCount } : p);
    await supabase.from('blog_posts').update({ like_count: newCount }).eq('id', post.id);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.author_name.trim() || !commentForm.content.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('blog_comments').insert([{
        post_id: id,
        author_name: commentForm.author_name.trim(),
        author_email: commentForm.author_email.trim(),
        content: commentForm.content.trim(),
      }]);
      if (error) throw error;
      setCommentStatus('success');
      setCommentForm({ author_name: '', author_email: '', content: '' });
      fetchComments();
      setTimeout(() => setCommentStatus('idle'), 5000);
    } catch {
      setCommentStatus('error');
      setTimeout(() => setCommentStatus('idle'), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToComments = (e: React.MouseEvent) => {
    e.preventDefault();
    commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center text-center px-4">
      <BookOpen className="w-12 h-12 text-[#C9A84C]/20 mb-4" />
      <h2 className="font-display text-2xl text-[#1A1A2E] mb-3">Post not found</h2>
      <Link to="/blog" className="text-[#C9A84C] text-sm font-semibold hover:underline">← Back to Blog</Link>
    </div>
  );

  const PREVIEW = 6;
  const visibleComments = showAllComments ? comments : comments.slice(0, PREVIEW);

  return (
    <div className="min-h-screen bg-[#F8F7F4]">

      {/* Dark hero header */}
      <div className="bg-[#1A1A2E] pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 25% 60%, rgba(61,31,110,0.6) 0%, transparent 55%)'}} />
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")"}} />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-white/45 hover:text-[#C9A84C] text-sm mb-8 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {post.media_type && post.media_type !== 'text' && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] font-bold uppercase tracking-wider mb-4 capitalize">
              {post.media_type}
            </span>
          )}

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white mb-5 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/40">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author_name || 'RuggedYouth'}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {fmtDate(post.created_at || '')}</span>
            <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-400' : 'hover:text-red-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} /> {post.like_count || 0} likes
            </button>
            <button onClick={scrollToComments} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> {comments.length} comments
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl -mt-6 pb-20">

        {/* Main content card */}
        <div className="bg-white rounded-2xl border border-[#EEEAE4] shadow-sm overflow-hidden mb-6">

          {/* ── Media rendering ─────────────────────────────── */}
          {post.media_url && post.media_type === 'image' && (
            <div className="overflow-hidden bg-[#F8F7F4]">
              <img src={post.media_url} alt={post.title} className="w-full max-h-[520px] object-cover" />
            </div>
          )}
          {post.media_url && post.media_type === 'flyer' && (
            <div className="bg-[#F8F7F4] p-6 flex items-center justify-center border-b border-[#EEEAE4]">
              <img src={post.media_url} alt={post.title} className="max-h-[640px] w-auto object-contain rounded-xl shadow-lg" />
            </div>
          )}
          {post.media_url && post.media_type === 'video' && (
            <div className="bg-black">
              <video
                src={post.media_url}
                controls
                controlsList="nodownload"
                playsInline
                className="w-full max-h-[520px] outline-none">
                Your browser does not support video playback.
              </video>
            </div>
          )}
          {post.media_url && post.media_type === 'audio' && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50/60 border-b border-[#EEEAE4]">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-green-800">Audio Message</p>
                  <p className="text-sm text-green-600">Press play to listen</p>
                </div>
              </div>
              <audio src={post.media_url} controls className="w-full rounded-lg" />
            </div>
          )}
          {post.media_url && post.media_type === 'link' && (
            <div className="p-6 border-b border-[#EEEAE4]">
              <a href={post.media_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-[#F8F7F4] border-2 border-[#EEEAE4] rounded-2xl hover:border-[#C9A84C]/40 hover:bg-[#F5EDD9]/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/25 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1A1A2E] mb-0.5 group-hover:text-[#C9A84C] transition-colors">Open External Link</p>
                  <p className="text-xs text-[#A8A6A0] truncate">{post.media_url}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#A8A6A0] flex-shrink-0" />
              </a>
            </div>
          )}

          {/* ── Post content ───────────────────────────────── */}
          <div className="p-7 sm:p-9">
            {post.content && (
              <div className="text-[#4A4A6A] leading-[1.9] text-[0.97rem] whitespace-pre-wrap mb-8">
                {post.content}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[#EEEAE4]">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-[#F5EDD9] text-[#8B6914] border border-[#C9A84C]/20 font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Action bar ─────────────────────────────────── */}
            <div className="flex items-center flex-wrap gap-3">
              {/* Like */}
              <button onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all select-none ${
                  likePulse ? 'scale-110' : 'scale-100'
                } ${
                  isLiked
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-[#F8F7F4] border-2 border-[#E2E0DC] text-[#4A4A6A] hover:bg-red-50 hover:border-red-300 hover:text-red-500'
                }`}
                style={{transition:'all 0.2s ease'}}>
                <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'} · {post.like_count || 0}
              </button>

              {/* Comment */}
              <button onClick={scrollToComments}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#F8F7F4] border-2 border-[#E2E0DC] text-[#4A4A6A] hover:bg-[#EEEAE4] transition-all">
                <MessageCircle className="w-4 h-4" />
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </button>

              {/* Share */}
              <button onClick={() => setShowShare(s => !s)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                  showShare
                    ? 'bg-[#1A1A2E] text-[#C9A84C] border-[#1A1A2E]'
                    : 'bg-[#F8F7F4] border-[#E2E0DC] text-[#4A4A6A] hover:bg-[#F5EDD9] hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
                }`}>
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Share panel */}
        {showShare && <SharePanel post={post} onClose={() => setShowShare(false)} />}

        {/* ── Comments ─────────────────────────────────────────── */}
        <div ref={commentRef} id="comments">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-display text-xl font-bold text-[#1A1A2E]">
              Comments <span className="text-[#C9A84C]">({comments.length})</span>
            </h3>
          </div>

          {/* Comment form */}
          <div className="bg-white rounded-2xl border border-[#EEEAE4] p-6 mb-6">
            <h4 className="font-display text-base font-semibold text-[#1A1A2E] mb-5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#C9A84C]" /> Leave a Comment
            </h4>
            <form onSubmit={handleComment} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Your Name *</label>
                  <input
                    value={commentForm.author_name}
                    onChange={e => setCommentForm(p => ({...p, author_name: e.target.value}))}
                    placeholder="First name or full name"
                    className="input-field"
                    required
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">
                    Email <span className="text-[#C9A84C]/50 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    value={commentForm.author_email}
                    onChange={e => setCommentForm(p => ({...p, author_email: e.target.value}))}
                    type="email"
                    placeholder="your@email.com"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Your Comment *</label>
                <textarea
                  value={commentForm.content}
                  onChange={e => setCommentForm(p => ({...p, content: e.target.value}))}
                  placeholder="Share your thoughts, testimony, prayer request, or a question…"
                  rows={4}
                  className="input-field resize-none"
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-[#A8A6A0] mt-1 text-right">{commentForm.content.length}/1000</p>
              </div>

              {commentStatus === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Your comment was posted — thank you! 🙌
                </div>
              )}
              {commentStatus === 'error' && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  Something went wrong. Please try again.
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-[#1A1A2E]/30 border-t-[#1A1A2E] rounded-full animate-spin" /> Posting…</>
                  : <><Send className="w-4 h-4" /> Post Comment</>
                }
              </button>
            </form>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#EEEAE4]">
              <MessageCircle className="w-12 h-12 text-[#C9A84C]/15 mx-auto mb-3" />
              <p className="font-display text-[#1A1A2E] font-semibold mb-1">No comments yet</p>
              <p className="text-sm text-[#4A4A6A]">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleComments.map(c => <CommentCard key={c.id} comment={c} />)}

              {comments.length > PREVIEW && (
                <button onClick={() => setShowAllComments(s => !s)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-[#C9A84C] bg-white border border-[#EEEAE4] rounded-2xl hover:bg-[#F5EDD9] hover:border-[#C9A84C]/30 transition-all">
                  {showAllComments
                    ? <><ChevronUp className="w-4 h-4" /> Show fewer</>
                    : <><ChevronDown className="w-4 h-4" /> Load {comments.length - PREVIEW} more comments</>
                  }
                </button>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#A8A6A0] hover:text-[#C9A84C] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to all posts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
