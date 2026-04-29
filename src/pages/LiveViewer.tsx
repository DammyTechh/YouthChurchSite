import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart, Flame, HandHeart, Send, Share2, Users, Radio as RadioIcon,
  MessageCircle, Eye, Clock, Sparkles
} from 'lucide-react';
import { useActiveLiveStream } from '../hooks/useActiveLiveStream';
import {
  supabase, LiveChatMessage, LiveStream, ReactionKind,
  getOrCreateFingerprint, getDisplayName, setDisplayName as saveDisplayName
} from '../lib/supabase';

interface FloatingReaction {
  id: number;
  kind: ReactionKind;
  left: number;
}

const REACTIONS: { kind: ReactionKind; icon: typeof Heart; color: string; label: string }[] = [
  { kind: 'heart', icon: Heart, color: '#ef4444', label: 'Love' },
  { kind: 'fire',  icon: Flame, color: '#f97316', label: 'Fire' },
  { kind: 'amen',  icon: HandHeart, color: '#C9A84C', label: 'Amen' },
];

const LiveViewer: React.FC = () => {
  const { stream, isLive, loading, tableMissing } = useActiveLiveStream();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  if (tableMissing) {
    return (
      <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center bg-white/5 backdrop-blur-md border border-amber-400/20 rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-amber-300 mb-3">Live streaming setup pending</h1>
          <p className="text-white/60 text-sm mb-2">The live streaming database tables haven't been created yet.</p>
          <p className="text-white/40 text-xs">Run <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">supabase db push</code> to apply the migrations, then refresh.</p>
        </div>
      </div>
    );
  }

  if (!isLive || !stream) return <OfflineState />;
  return <LivePlayer stream={stream} />;
};

const OfflineState: React.FC = () => {
  const [next, setNext] = useState<LiveStream | null>(null);
  useEffect(() => {
    supabase.from('live_streams')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setNext(data as LiveStream);
      })
      .catch(() => { /* table missing — ignore */ });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-5">
          <RadioIcon className="w-8 h-8 text-[#C9A84C]" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">No live stream right now</h1>
        <p className="text-white/60 mb-6">When we go live, you'll see it here. Follow us on social to get notified.</p>
        {next && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
            <p className="text-xs uppercase tracking-wider text-[#C9A84C] mb-1">Coming up</p>
            <p className="text-white font-semibold">{next.title}</p>
            {next.scheduled_for && (
              <p className="text-white/50 text-sm flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(next.scheduled_for).toLocaleString()}
              </p>
            )}
          </div>
        )}
        <a href="/radio" className="inline-block mt-6 text-[#C9A84C] hover:text-[#E8C97A] text-sm font-medium">
          Listen to past radio broadcasts →
        </a>
      </div>
    </div>
  );
};

const LivePlayer: React.FC<{ stream: LiveStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState(getDisplayName());
  const [showNamePrompt, setShowNamePrompt] = useState(!getDisplayName());
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [shared, setShared] = useState(false);
  const fp = useMemo(() => getOrCreateFingerprint(), []);
  const isAudio = stream.stream_type === 'audio';
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── HLS playback ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!stream.playback_url) return;
    const url = stream.playback_url;
    const el = isAudio ? audioRef.current : videoRef.current;
    if (!el) return;

    let hls: import('hls.js').default | null = null;

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS native HLS
      el.src = url;
      el.play().catch(() => {/* user gesture needed */});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          hls = new Hls({ lowLatencyMode: true, liveSyncDuration: 4 });
          hls.loadSource(url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}));
        } else {
          el.src = url;
        }
      });
    }
    return () => { hls?.destroy(); };
  }, [stream.playback_url, isAudio]);

  // ── viewer count heartbeat ───────────────────────────────────────────
  useEffect(() => {
    const heartbeat = async () => {
      await supabase.from('live_streams')
        .update({ viewer_count: (stream.viewer_count || 0) + 1 })
        .eq('id', stream.id!);
    };
    heartbeat();
    const id = setInterval(heartbeat, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.id]);

  // ── chat realtime ────────────────────────────────────────────────────
  useEffect(() => {
    if (!stream.id) return;
    let cancelled = false;
    supabase.from('live_chat_messages')
      .select('*')
      .eq('stream_id', stream.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(60)
      .then(({ data }) => { if (!cancelled) setMessages((data as LiveChatMessage[]) || []); });

    const channel = supabase
      .channel(`live-chat-${stream.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `stream_id=eq.${stream.id}` },
        payload => setMessages(m => [...m, payload.new as LiveChatMessage].slice(-80)))
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_reactions', filter: `stream_id=eq.${stream.id}` },
        payload => spawnFloating((payload.new as { kind: ReactionKind }).kind))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [stream.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const spawnFloating = (kind: ReactionKind) => {
    const id = Date.now() + Math.random();
    const left = 5 + Math.random() * 80;
    setFloating(f => [...f, { id, kind, left }]);
    setTimeout(() => setFloating(f => f.filter(x => x.id !== id)), 3100);
  };

  const sendReaction = async (kind: ReactionKind) => {
    spawnFloating(kind);
    await supabase.from('live_reactions').insert({ stream_id: stream.id!, user_fingerprint: fp, kind });
    if (kind === 'heart') {
      await supabase.from('live_streams')
        .update({ like_count: (stream.like_count || 0) + 1 })
        .eq('id', stream.id!);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (!name.trim()) { setShowNamePrompt(true); return; }
    setInput('');
    await supabase.from('live_chat_messages').insert({
      stream_id: stream.id!,
      user_fingerprint: fp,
      display_name: name.trim().slice(0, 40),
      message: text.slice(0, 500),
    });
  };

  const share = async () => {
    const url = window.location.origin + '/live';
    const data = { title: stream.title, text: 'Watch us live now!', url };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen bg-[#0F0E1A]">
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) scale(.8); opacity: 0; }
          15%  { transform: translateY(-30px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-360px) scale(1); opacity: 0; }
        }
      `}</style>

      <div className="container mx-auto px-4 py-6 lg:py-10 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          {/* PLAYER */}
          <div>
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl">
              {isAudio ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3D1F6E] to-[#1A3C8C]">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <RadioIcon className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-white/80 font-medium">Audio-only broadcast</p>
                  </div>
                  <audio ref={audioRef} autoPlay controls className="absolute bottom-4 left-4 right-4" />
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline controls className="w-full h-full object-cover" />
              )}

              {/* live badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live
              </div>

              {/* viewer pill */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs">
                <Eye className="w-3.5 h-3.5" /> {stream.viewer_count || 0}
              </div>

              {/* floating reactions */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floating.map(f => {
                  const meta = REACTIONS.find(r => r.kind === f.kind)!;
                  const Icon = meta.icon;
                  return (
                    <div key={f.id}
                      style={{ left: `${f.left}%`, bottom: 0, animation: 'float-up 3s ease-out forwards', color: meta.color }}
                      className="absolute">
                      <Icon className="w-7 h-7" fill="currentColor" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* meta bar */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-white">{stream.title}</h1>
                {stream.description && <p className="text-white/50 text-sm mt-0.5">{stream.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {REACTIONS.map(r => {
                  const Icon = r.icon;
                  return (
                    <button key={r.kind} onClick={() => sendReaction(r.kind)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition"
                      title={r.label}>
                      <Icon className="w-4 h-4" style={{ color: r.color }} />
                      <span className="hidden sm:inline">{r.label}</span>
                    </button>
                  );
                })}
                <button onClick={share}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-medium transition">
                  <Share2 className="w-4 h-4" />
                  {shared ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>

            {/* engagement counts */}
            <div className="mt-3 flex items-center gap-4 text-white/50 text-xs">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {stream.peak_viewers || stream.viewer_count || 0} peak</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {stream.like_count || 0} likes</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> on {(stream.platforms || []).join(', ') || 'web'}</span>
            </div>
          </div>

          {/* CHAT */}
          <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[600px] lg:h-auto lg:max-h-[calc(100vh-100px)]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-white font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#C9A84C]" /> Live Chat
              </p>
              <span className="text-xs text-white/40">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-white/40 text-sm text-center mt-8">Be the first to say hello 👋</p>
              )}
              {messages.map(m => (
                <div key={m.id || `${m.created_at}-${m.user_fingerprint}`} className="flex gap-2">
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    m.is_admin ? 'bg-[#C9A84C] text-[#1A1A2E]' : 'bg-white/10 text-white/70'
                  }`}>
                    {m.display_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className={m.is_admin ? 'text-[#C9A84C] font-semibold' : 'text-white/70 font-medium'}>{m.display_name}</span>
                      {m.is_admin && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-[#C9A84C]/70">Host</span>}
                    </p>
                    <p className="text-white/90 text-sm break-words">{m.message}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {showNamePrompt ? (
              <div className="p-3 border-t border-white/10 bg-white/5">
                <p className="text-xs text-white/50 mb-2">Pick a display name to chat</p>
                <div className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value.slice(0, 40))}
                    placeholder="Your name…"
                    className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50" />
                  <button onClick={() => { if (name.trim()) { saveDisplayName(name.trim()); setShowNamePrompt(false); } }}
                    className="px-3 py-2 rounded-lg bg-[#C9A84C] text-[#1A1A2E] text-sm font-semibold hover:bg-[#E8C97A]">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 border-t border-white/10 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Say something kind…"
                  maxLength={500}
                  className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50" />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className="px-3 py-2 rounded-lg bg-[#C9A84C] text-[#1A1A2E] hover:bg-[#E8C97A] disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveViewer;
