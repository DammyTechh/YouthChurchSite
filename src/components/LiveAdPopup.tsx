import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Play, Radio as RadioIcon } from 'lucide-react';
import { useActiveLiveStream } from '../hooks/useActiveLiveStream';
import { supabase, LiveAd } from '../lib/supabase';

const LS_KEY = 'ry_live_ad_lastShown';

const FALLBACK: LiveAd = {
  title: "We're Live Now!",
  body: 'Join the live broadcast — tap to watch with the community.',
  cta_label: 'Watch Live',
  cta_url: '/live',
  display_style: 'corner',
  cooldown_minutes: 30,
  is_active: true,
};

const LiveAdPopup: React.FC = () => {
  const { isLive, stream } = useActiveLiveStream();
  const location = useLocation();
  const navigate = useNavigate();
  const [ad, setAd] = useState<LiveAd | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show on the /live page itself or admin pages
  const skipPath = location.pathname.startsWith('/live') ||
                   location.pathname.startsWith('/admin') ||
                   location.pathname.startsWith('/auth');

  useEffect(() => {
    if (!isLive || skipPath) { setVisible(false); return; }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('live_ads')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(10);
        if (cancelled) return;
        if (error) { setVisible(false); return; }

        const matching = (data as LiveAd[] | null)?.find(a => {
          if (!a.show_on_routes || a.show_on_routes.length === 0) return true;
          return a.show_on_routes.some(r => location.pathname.startsWith(r) || (r === '/' && location.pathname === '/'));
        }) || FALLBACK;

      // cooldown check
      const last = parseInt(window.localStorage.getItem(LS_KEY) || '0', 10);
      const now = Date.now();
      const cooldownMs = (matching.cooldown_minutes || 30) * 60 * 1000;
      if (now - last < cooldownMs && !dismissed) { setVisible(false); return; }

      setAd(matching);
      setVisible(true);
      setDismissed(false);

      if (matching.auto_hide_seconds && matching.auto_hide_seconds > 0) {
        setTimeout(() => setVisible(false), matching.auto_hide_seconds * 1000);
      }
      } catch { /* table missing or other error — silently no-op */ }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, skipPath, location.pathname]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    window.localStorage.setItem(LS_KEY, String(Date.now()));
  };

  const handleCta = () => {
    window.localStorage.setItem(LS_KEY, String(Date.now()));
    if (ad?.cta_url?.startsWith('/')) navigate(ad.cta_url);
    else if (ad?.cta_url) window.open(ad.cta_url, '_blank');
  };

  if (!visible || !ad) return null;

  const streamTitle = stream?.title;

  // Display style branches
  if (ad.display_style === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-[#C9A84C] text-white px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          <p className="text-sm font-medium truncate">
            <span className="font-bold uppercase tracking-wider mr-1.5">Live</span>
            {streamTitle || ad.title} — {ad.body}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleCta} className="px-3 py-1 bg-white text-red-600 rounded-md text-xs font-bold hover:bg-white/90">{ad.cta_label}</button>
          <button onClick={dismiss} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  if (ad.display_style === 'modal') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-[#1A1A2E] border border-[#C9A84C]/30 rounded-2xl max-w-md w-full p-6 relative">
          <button onClick={dismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
          {ad.image_url
            ? <img src={ad.image_url} alt="" className="w-full h-44 object-cover rounded-xl mb-4" />
            : <div className="w-full h-44 rounded-xl bg-gradient-to-br from-red-600 to-[#C9A84C] mb-4 flex items-center justify-center"><RadioIcon className="w-16 h-16 text-white/80" /></div>
          }
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">● Live</span>
            <span className="text-white/50 text-xs">{streamTitle || ad.title}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">{streamTitle || ad.title}</h3>
          <p className="text-white/70 text-sm mb-5">{ad.body}</p>
          <button onClick={handleCta} className="w-full px-4 py-3 bg-[#C9A84C] hover:bg-[#E8C97A] text-[#1A1A2E] rounded-lg font-bold flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />{ad.cta_label}
          </button>
        </div>
      </div>
    );
  }

  if (ad.display_style === 'toast') {
    return (
      <div className="fixed top-20 right-4 z-[100] bg-[#1A1A2E] border border-[#C9A84C]/30 rounded-xl shadow-2xl p-3 max-w-xs flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-600 flex-shrink-0 flex items-center justify-center">
          <RadioIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{streamTitle || ad.title}</p>
          <p className="text-white/50 text-xs mb-2 line-clamp-2">{ad.body}</p>
          <button onClick={handleCta} className="text-[#C9A84C] hover:text-[#E8C97A] text-xs font-bold">{ad.cta_label} →</button>
        </div>
        <button onClick={dismiss} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  // default: corner card (bottom-right)
  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-[#1A1A2E] border border-[#C9A84C]/30 rounded-xl shadow-2xl overflow-hidden max-w-xs animate-[fadeInUp_0.3s_ease-out]">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <button onClick={dismiss} className="absolute top-2 right-2 p-1 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 z-10"><X className="w-3.5 h-3.5" /></button>
      {ad.image_url
        ? <img src={ad.image_url} alt="" className="w-full h-28 object-cover" />
        : <div className="w-full h-28 bg-gradient-to-br from-red-600 to-[#C9A84C] flex items-center justify-center"><RadioIcon className="w-10 h-10 text-white/80" /></div>
      }
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">Live Now</span>
        </div>
        <p className="text-white text-sm font-semibold mb-1 line-clamp-1">{streamTitle || ad.title}</p>
        <p className="text-white/55 text-xs mb-3 line-clamp-2">{ad.body}</p>
        <button onClick={handleCta} className="w-full px-3 py-2 bg-[#C9A84C] hover:bg-[#E8C97A] text-[#1A1A2E] rounded-lg font-bold text-sm flex items-center justify-center gap-1.5">
          <Play className="w-3.5 h-3.5" />{ad.cta_label}
        </button>
      </div>
    </div>
  );
};

export default LiveAdPopup;
