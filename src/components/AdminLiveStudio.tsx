import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Radio as RadioIcon, Video, VideoOff, Mic, MicOff,
  Youtube, Facebook, Instagram, Music, Plus, Link2, Calendar, Play, Square,
  Wand2, History, Loader2, CheckCircle, AlertTriangle, Eye, KeyRound, Trash2, Camera
} from 'lucide-react';
import {
  supabase, SocialConnection, LiveStream, SocialPlatform, StreamDestination
} from '../lib/supabase';
import { BroadcastEngine, DEFAULT_FILTER, VideoFilter, publishWHIP } from '../lib/broadcast-engine';

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; Icon: typeof Youtube; supportsOAuth: boolean; supportsManual: boolean; comingSoon?: boolean }> = {
  youtube:   { label: 'YouTube',   color: '#dc2626', Icon: Youtube,   supportsOAuth: true,  supportsManual: true  },
  facebook:  { label: 'Facebook',  color: '#1877f2', Icon: Facebook,  supportsOAuth: true,  supportsManual: true  },
  instagram: { label: 'Instagram', color: '#dd2a7b', Icon: Instagram, supportsOAuth: false, supportsManual: true  },
  tiktok:    { label: 'TikTok',    color: '#000000', Icon: Music,     supportsOAuth: false, supportsManual: false, comingSoon: true },
};

interface AdminLiveStudioProps {
  notify: (type: 'success' | 'error', text: string) => void;
}

const AdminLiveStudio: React.FC<AdminLiveStudioProps> = ({ notify }) => {
  const [tab, setTab] = useState<'studio' | 'connections' | 'schedule' | 'history'>('studio');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1 flex items-center gap-2">
          <RadioIcon className="w-6 h-6 text-[#C9A84C]" /> Live Studio
        </h2>
        <p className="text-sm text-[#4A4A6A]">Broadcast simultaneously to YouTube, Facebook, and Instagram from your dashboard.</p>
      </div>

      <div className="flex gap-1 border-b border-[#EEEAE4]">
        {(['studio', 'connections', 'schedule', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition ${
              tab === t ? 'border-[#C9A84C] text-[#1A1A2E]' : 'border-transparent text-[#4A4A6A] hover:text-[#1A1A2E]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'studio' && <StudioTab notify={notify} />}
      {tab === 'connections' && <ConnectionsTab notify={notify} />}
      {tab === 'schedule' && <ScheduleTab notify={notify} />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
};

/* ─── Studio (the actual go-live screen) ─────────────────────────────── */

const StudioTab: React.FC<{ notify: AdminLiveStudioProps['notify'] }> = ({ notify }) => {
  const previewRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<BroadcastEngine | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [audioOnly, setAudioOnly] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [filter, setFilter] = useState<VideoFilter>({ ...DEFAULT_FILTER });
  const [previewing, setPreviewing] = useState(false);
  const [going, setGoing] = useState(false);
  const [live, setLive] = useState(false);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [destinations, setDestinations] = useState<StreamDestination[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<SocialPlatform, boolean>>({
    youtube: true, facebook: true, instagram: false, tiktok: false,
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  // Load existing connections
  useEffect(() => {
    supabase.from('social_connections').select('*').then(({ data }) => {
      setConnections((data as SocialConnection[]) || []);
    });
  }, []);

  // Live viewer count + reactions polling while live
  useEffect(() => {
    if (!live || !stream?.id) return;
    const id = setInterval(async () => {
      const { data } = await supabase.from('live_streams').select('viewer_count').eq('id', stream.id!).maybeSingle();
      if (data) setViewerCount((data as { viewer_count: number }).viewer_count);
    }, 5000);
    return () => clearInterval(id);
  }, [live, stream?.id]);

  const startPreview = useCallback(async () => {
    try {
      const engine = new BroadcastEngine();
      engineRef.current = engine;
      const out = await engine.start({ audioOnly });
      engine.setFilter(filter);
      if (!audioOnly && previewRef.current) {
        previewRef.current.srcObject = out;
        await previewRef.current.play().catch(() => {});
      }
      setPreviewing(true);
    } catch (e) {
      notify('error', 'Could not access camera/microphone: ' + (e as Error).message);
    }
  }, [audioOnly, filter, notify]);

  const stopPreview = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setPreviewing(false);
  }, []);

  // Apply filter changes live
  useEffect(() => {
    engineRef.current?.setFilter(filter);
  }, [filter]);

  const toggleMic = () => {
    const stream = engineRef.current?.getOutputStream();
    if (!stream) return;
    stream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
    setMicOn(m => !m);
  };
  const toggleCam = () => {
    const stream = engineRef.current?.getOutputStream();
    if (!stream) return;
    stream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
    setCamOn(c => !c);
  };

  const goLive = async () => {
    if (!title.trim()) { notify('error', 'Please enter a stream title'); return; }
    if (!engineRef.current?.getOutputStream()) { notify('error', 'Start the preview first'); return; }
    setGoing(true);
    try {
      const platforms = (Object.keys(selectedPlatforms) as SocialPlatform[]).filter(p => selectedPlatforms[p] && p !== 'tiktok');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const resp = await fetch(`${FUNCTIONS_BASE}/livestream-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description,
          stream_type: audioOnly ? 'audio' : 'video',
          platforms,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed to create stream');

      const created: LiveStream = json.stream;
      const ingest: { whip_url?: string; auth_token?: string } = json.ingest || {};

      if (!ingest.whip_url) throw new Error('No WHIP URL returned by Cloudflare');

      // publish over WHIP
      const out = engineRef.current!.getOutputStream()!;
      const pc = await publishWHIP(out, ingest.whip_url, ingest.auth_token);
      pcRef.current = pc;
      engineRef.current!.startLocalRecording();

      setStream(created);
      setDestinations(json.destinations || []);
      setLive(true);
      notify('success', 'You are live! Broadcasting to ' + platforms.join(', '));
    } catch (e) {
      notify('error', (e as Error).message);
    } finally {
      setGoing(false);
    }
  };

  const endLive = async () => {
    if (!stream?.id) return;
    setGoing(true);
    try {
      pcRef.current?.close();
      pcRef.current = null;
      const blob = await engineRef.current?.stopLocalRecording();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const fd = new FormData();
      fd.append('stream_id', stream.id);
      if (blob) fd.append('recording', new File([blob], `${stream.id}.webm`, { type: 'video/webm' }));

      await fetch(`${FUNCTIONS_BASE}/livestream-end`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      setLive(false);
      setStream(null);
      setDestinations([]);
      stopPreview();
      notify('success', 'Stream ended. Recording saved.');
    } catch (e) {
      notify('error', (e as Error).message);
    } finally {
      setGoing(false);
    }
  };

  const isConnected = (p: SocialPlatform) => connections.some(c => c.platform === p);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      {/* Preview pane */}
      <div className="space-y-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
          {audioOnly ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3D1F6E] to-[#1A3C8C]">
              <div className="text-center text-white">
                <RadioIcon className="w-16 h-16 mx-auto mb-2 opacity-80" />
                <p className="text-sm">Audio-only mode</p>
              </div>
            </div>
          ) : (
            <video ref={previewRef} muted playsInline className="w-full h-full object-cover" />
          )}
          {live && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live · {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
            </div>
          )}
          {!previewing && !live && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <button onClick={startPreview} className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center gap-2 backdrop-blur">
                <Camera className="w-4 h-4" /> Start preview
              </button>
            </div>
          )}
        </div>

        {previewing && (
          <div className="flex items-center gap-2">
            <button onClick={toggleMic} className={`p-3 rounded-xl border ${micOn ? 'bg-white border-[#E2E0DC]' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            {!audioOnly && (
              <button onClick={toggleCam} className={`p-3 rounded-xl border ${camOn ? 'bg-white border-[#E2E0DC]' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            )}
            <button onClick={stopPreview} className="px-3 py-2 rounded-xl border border-[#E2E0DC] bg-white text-sm text-[#4A4A6A] hover:bg-[#F8F7F4]">Stop preview</button>

            <div className="ml-auto flex items-center gap-2">
              {!live ? (
                <button onClick={goLive} disabled={going}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                  {going ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Go Live
                </button>
              ) : (
                <button onClick={endLive} disabled={going}
                  className="px-5 py-2.5 rounded-xl bg-[#1A1A2E] text-white font-semibold hover:bg-[#2D2D44] disabled:opacity-50 flex items-center gap-2">
                  {going ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  End Stream
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter editor */}
        {previewing && !audioOnly && <FilterEditor filter={filter} setFilter={setFilter} />}

        {/* Live destinations status */}
        {live && destinations.length > 0 && (
          <div className="bg-white border border-[#EEEAE4] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-[#A8A6A0] font-semibold mb-3">Broadcasting to</p>
            <div className="space-y-2">
              {destinations.map(d => {
                const meta = PLATFORM_META[d.platform];
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
                      <span className="text-[#1A1A2E] font-medium">{meta.label}</span>
                      {d.watch_url && <a href={d.watch_url} target="_blank" rel="noreferrer" className="text-xs text-[#C9A84C] hover:underline">View →</a>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${
                      d.status === 'live' ? 'bg-green-50 text-green-700' :
                      d.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-[#F8F7F4] text-[#4A4A6A]'
                    }`}>
                      {d.status === 'live' ? '● Live' : d.status === 'failed' ? `Failed${d.error_message ? ': ' + d.error_message : ''}` : d.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Side: stream details + destinations */}
      <div className="space-y-4">
        <div className="bg-white border border-[#EEEAE4] rounded-xl p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-[#A8A6A0] font-semibold">Stream details</p>
          <div>
            <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} disabled={live}
              placeholder="e.g. Sunday Service — Faith That Moves"
              className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C]/50 disabled:opacity-60" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={live} rows={3}
              className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C]/50 resize-none disabled:opacity-60" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1A1A2E] cursor-pointer">
            <input type="checkbox" checked={audioOnly} onChange={e => { setAudioOnly(e.target.checked); if (previewing) { stopPreview(); } }} disabled={live} />
            Go live with audio only
          </label>
        </div>

        <div className="bg-white border border-[#EEEAE4] rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-[#A8A6A0] font-semibold mb-3">Destinations</p>
          <div className="space-y-2">
            {(Object.keys(PLATFORM_META) as SocialPlatform[]).map(p => {
              const meta = PLATFORM_META[p];
              const connected = isConnected(p);
              const disabled = meta.comingSoon || (!connected);
              return (
                <label key={p} className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${
                  selectedPlatforms[p] && !disabled ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-[#EEEAE4] bg-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex items-center gap-2">
                    <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
                    <span className="text-sm font-medium text-[#1A1A2E]">{meta.label}</span>
                    {meta.comingSoon && <span className="text-[10px] uppercase tracking-wider text-[#A8A6A0]">Coming soon</span>}
                  </div>
                  <input type="checkbox" disabled={disabled || live}
                    checked={selectedPlatforms[p] && !disabled}
                    onChange={e => setSelectedPlatforms(s => ({ ...s, [p]: e.target.checked }))} />
                </label>
              );
            })}
          </div>
          {connections.length === 0 && (
            <p className="text-xs text-[#A8A6A0] mt-3">Connect your accounts in the <span className="font-medium text-[#1A1A2E]">Connections</span> tab to enable broadcasting.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Filter editor ──────────────────────────────────────────────────── */

const FilterEditor: React.FC<{ filter: VideoFilter; setFilter: React.Dispatch<React.SetStateAction<VideoFilter>> }> = ({ filter, setFilter }) => {
  const sliders: { key: keyof VideoFilter; label: string; min: number; max: number; suffix: string }[] = [
    { key: 'brightness', label: 'Brightness', min: 50, max: 150, suffix: '%' },
    { key: 'contrast',   label: 'Contrast',   min: 50, max: 150, suffix: '%' },
    { key: 'saturation', label: 'Saturation', min: 0,  max: 200, suffix: '%' },
    { key: 'blur',       label: 'Blur',       min: 0,  max: 8,   suffix: 'px' },
    { key: 'hueRotate',  label: 'Hue',        min: -90, max: 90, suffix: '°' },
  ];
  const presets: VideoFilter['preset'][] = ['none', 'warm', 'cool', 'vintage', 'noir', 'vivid', 'soft'];

  return (
    <div className="bg-white border border-[#EEEAE4] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-4 h-4 text-[#C9A84C]" />
        <p className="text-sm font-semibold text-[#1A1A2E]">Video filters</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {presets.map(p => (
          <button key={p} onClick={() => setFilter(f => ({ ...f, preset: p }))}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${
              filter.preset === p ? 'bg-[#C9A84C] text-[#1A1A2E]' : 'bg-[#F8F7F4] text-[#4A4A6A] hover:bg-[#EEEAE4]'
            }`}>
            {p}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="flex justify-between text-xs text-[#4A4A6A] mb-1">
              <span>{s.label}</span>
              <span>{filter[s.key] as number}{s.suffix}</span>
            </div>
            <input type="range" min={s.min} max={s.max} value={filter[s.key] as number}
              onChange={e => setFilter(f => ({ ...f, [s.key]: parseInt(e.target.value, 10) }))}
              className="w-full accent-[#C9A84C]" />
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-xs text-[#4A4A6A] mb-1">Overlay text</label>
          <input value={filter.overlayText} onChange={e => setFilter(f => ({ ...f, overlayText: e.target.value.slice(0, 80) }))}
            placeholder="e.g. Sunday Service" maxLength={80}
            className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[#4A4A6A] mb-1">Position</label>
          <select value={filter.overlayPosition} onChange={e => setFilter(f => ({ ...f, overlayPosition: e.target.value as VideoFilter['overlayPosition'] }))}
            className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-1.5 text-sm">
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#1A1A2E] mt-3 cursor-pointer">
        <input type="checkbox" checked={filter.mirror} onChange={e => setFilter(f => ({ ...f, mirror: e.target.checked }))} />
        Mirror video
      </label>
    </div>
  );
};

/* ─── Connections (OAuth + manual keys) ─────────────────────────────── */

const ConnectionsTab: React.FC<{ notify: AdminLiveStudioProps['notify'] }> = ({ notify }) => {
  const [conns, setConns] = useState<SocialConnection[]>([]);
  const [editing, setEditing] = useState<SocialPlatform | null>(null);
  const [form, setForm] = useState({ rtmp_url: '', stream_key: '', account_name: '' });

  const refresh = async () => {
    const { data } = await supabase.from('social_connections').select('*');
    setConns((data as SocialConnection[]) || []);
  };
  useEffect(() => { refresh(); }, []);

  const startOAuth = async (platform: SocialPlatform) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) { notify('error', 'Not authenticated'); return; }
    window.location.href = `${FUNCTIONS_BASE}/social-oauth?platform=${platform}&action=start&jwt=${encodeURIComponent(token)}`;
  };

  const saveManual = async (platform: SocialPlatform) => {
    if (!form.rtmp_url.trim() || !form.stream_key.trim()) { notify('error', 'RTMP URL and Stream Key are required'); return; }
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) return;
    const { error } = await supabase.from('social_connections').upsert({
      admin_user_id: userId,
      platform,
      account_name: form.account_name || `${platform} (manual)`,
      rtmp_url: form.rtmp_url,
      stream_key: form.stream_key,
      is_manual: true,
    }, { onConflict: 'admin_user_id,platform' });
    if (error) { notify('error', error.message); return; }
    notify('success', `${PLATFORM_META[platform].label} connected via stream key`);
    setEditing(null);
    setForm({ rtmp_url: '', stream_key: '', account_name: '' });
    refresh();
  };

  const disconnect = async (id: string, platform: SocialPlatform) => {
    if (!confirm(`Disconnect ${PLATFORM_META[platform].label}?`)) return;
    const { error } = await supabase.from('social_connections').delete().eq('id', id);
    if (error) { notify('error', error.message); return; }
    notify('success', 'Disconnected');
    refresh();
  };

  // Detect ?connected= success redirect from OAuth
  useEffect(() => {
    const u = new URL(window.location.href);
    const p = u.searchParams.get('connected');
    if (p) {
      notify('success', `${p} connected successfully`);
      u.searchParams.delete('connected');
      window.history.replaceState({}, '', u.toString());
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {(Object.keys(PLATFORM_META) as SocialPlatform[]).map(p => {
        const meta = PLATFORM_META[p];
        const conn = conns.find(c => c.platform === p);
        return (
          <div key={p} className="bg-white border border-[#EEEAE4] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
                <p className="font-semibold text-[#1A1A2E]">{meta.label}</p>
              </div>
              {conn && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
            {conn ? (
              <div className="text-sm">
                <p className="text-[#4A4A6A] mb-1">{conn.account_name || 'Connected'}</p>
                <p className="text-xs text-[#A8A6A0] mb-3">{conn.is_manual ? 'Manual stream key' : 'OAuth'}</p>
                <button onClick={() => disconnect(conn.id!, p)}
                  className="px-3 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Disconnect
                </button>
              </div>
            ) : meta.comingSoon ? (
              <div className="text-sm text-[#A8A6A0] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Live API not yet available for third parties.
              </div>
            ) : editing === p ? (
              <div className="space-y-2">
                <input placeholder="Account name (optional)" value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                  className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-1.5 text-sm" />
                <input placeholder="RTMP URL (e.g. rtmps://live-api-s.facebook.com:443/rtmp/)" value={form.rtmp_url}
                  onChange={e => setForm(f => ({ ...f, rtmp_url: e.target.value }))}
                  className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-1.5 text-sm font-mono" />
                <input placeholder="Stream key" value={form.stream_key}
                  onChange={e => setForm(f => ({ ...f, stream_key: e.target.value }))}
                  className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-1.5 text-sm font-mono" type="password" />
                <div className="flex gap-2">
                  <button onClick={() => saveManual(p)} className="flex-1 px-3 py-1.5 bg-[#C9A84C] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:bg-[#E8C97A]">Save</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 border border-[#E2E0DC] rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {meta.supportsOAuth && (
                  <button onClick={() => startOAuth(p)}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1A2E] text-white text-xs font-medium hover:bg-[#2D2D44] inline-flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Connect
                  </button>
                )}
                {meta.supportsManual && (
                  <button onClick={() => setEditing(p)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E0DC] text-[#4A4A6A] text-xs font-medium hover:bg-[#F8F7F4] inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Paste key
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Schedule (creates scheduled streams) ──────────────────────────── */

const ScheduleTab: React.FC<{ notify: AdminLiveStudioProps['notify'] }> = ({ notify }) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [form, setForm] = useState({ title: '', description: '', scheduled_for: '', stream_type: 'video' as 'video' | 'audio' });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.from('live_streams').select('*').eq('status', 'scheduled').order('scheduled_for', { ascending: true });
    setStreams((data as LiveStream[]) || []);
  };
  useEffect(() => { refresh(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.scheduled_for) { notify('error', 'Title and date/time are required'); return; }
    setBusy(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    const { error } = await supabase.from('live_streams').insert({
      title: form.title, description: form.description,
      scheduled_for: new Date(form.scheduled_for).toISOString(),
      stream_type: form.stream_type, status: 'scheduled', admin_user_id: userId,
    });
    setBusy(false);
    if (error) { notify('error', error.message); return; }
    notify('success', 'Scheduled. It will appear under Programs and on the Live page.');
    setForm({ title: '', description: '', scheduled_for: '', stream_type: 'video' });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this scheduled stream?')) return;
    await supabase.from('live_streams').delete().eq('id', id);
    refresh();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white border border-[#EEEAE4] rounded-xl p-5 space-y-3">
        <p className="font-semibold text-[#1A1A2E] flex items-center gap-2"><Calendar className="w-4 h-4 text-[#C9A84C]" /> Schedule a stream</p>
        <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm" />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3} className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm resize-none" />
        <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
          className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm" />
        <select value={form.stream_type} onChange={e => setForm(f => ({ ...f, stream_type: e.target.value as 'video' | 'audio' }))}
          className="w-full bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg px-3 py-2 text-sm">
          <option value="video">Video stream</option>
          <option value="audio">Audio-only</option>
        </select>
        <button onClick={submit} disabled={busy}
          className="px-4 py-2 bg-[#C9A84C] text-[#1A1A2E] rounded-lg font-semibold text-sm hover:bg-[#E8C97A] disabled:opacity-50 inline-flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Schedule
        </button>
      </div>

      <div className="bg-white border border-[#EEEAE4] rounded-xl p-5">
        <p className="font-semibold text-[#1A1A2E] mb-3">Upcoming</p>
        {streams.length === 0 ? (
          <p className="text-sm text-[#A8A6A0]">Nothing scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {streams.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-[#F8F7F4] rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A2E] truncate">{s.title}</p>
                  <p className="text-xs text-[#A8A6A0]">{s.scheduled_for ? new Date(s.scheduled_for).toLocaleString() : 'No date'} · {s.stream_type}</p>
                </div>
                <button onClick={() => remove(s.id!)} className="text-red-600 p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── History (past streams) ─────────────────────────────────────────── */

const HistoryTab: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  useEffect(() => {
    supabase.from('live_streams').select('*').eq('status', 'ended').order('ended_at', { ascending: false }).limit(40)
      .then(({ data }) => setStreams((data as LiveStream[]) || []));
  }, []);

  return (
    <div className="bg-white border border-[#EEEAE4] rounded-xl">
      <div className="p-4 border-b border-[#EEEAE4] flex items-center gap-2">
        <History className="w-4 h-4 text-[#C9A84C]" />
        <p className="font-semibold text-[#1A1A2E]">Past streams</p>
      </div>
      {streams.length === 0 ? (
        <p className="p-6 text-sm text-[#A8A6A0]">No streams yet — your past broadcasts will appear here.</p>
      ) : (
        <div className="divide-y divide-[#EEEAE4]">
          {streams.map(s => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-[#1A1A2E] truncate">{s.title}</p>
                <p className="text-xs text-[#A8A6A0]">
                  {s.ended_at && new Date(s.ended_at).toLocaleString()} · {s.peak_viewers || 0} peak viewers · {s.like_count || 0} likes
                </p>
              </div>
              {s.recording_url && (
                <a href={s.recording_url} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 text-xs rounded-md bg-[#1A1A2E] text-white hover:bg-[#2D2D44] inline-flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Recording
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLiveStudio;
