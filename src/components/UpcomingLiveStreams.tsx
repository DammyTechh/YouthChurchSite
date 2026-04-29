import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Radio, Video, ChevronRight } from 'lucide-react';
import { supabase, LiveStream } from '../lib/supabase';

interface Props {
  limit?: number;
  variant?: 'card' | 'compact' | 'inline';
  title?: string;
}

/**
 * Renders any scheduled live streams from the live_streams table so they
 * surface naturally on Programs / Home / Blog pages alongside the
 * existing event/program/post lists.
 *
 * Hardened against the table not existing yet — silently renders nothing
 * if the migrations haven't been applied or there are no scheduled streams.
 */
const UpcomingLiveStreams: React.FC<Props> = ({ limit = 3, variant = 'card', title = 'Upcoming Live Broadcasts' }) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_for', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // include events that started in the last hour
          .order('scheduled_for', { ascending: true })
          .limit(limit);
        if (cancelled) return;
        if (!error && data) setStreams(data as LiveStream[]);
      } catch { /* table missing — render nothing */ }
      finally { if (!cancelled) setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  if (!loaded || streams.length === 0) return null;

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {streams.map(s => (
          <Link key={s.id} to="/live"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 text-[#C9A84C] text-xs font-medium hover:bg-[#C9A84C]/15 transition">
            {s.status === 'live'
              ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              : <Calendar className="w-3 h-3" />}
            <span>{s.title}</span>
            {s.scheduled_for && s.status !== 'live' && (
              <span className="opacity-60">· {new Date(s.scheduled_for).toLocaleDateString()}</span>
            )}
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {streams.map(s => (
          <Link key={s.id} to="/live" className="flex items-center gap-3 p-3 rounded-xl border border-[#EEEAE4] hover:border-[#C9A84C]/40 hover:bg-[#F8F7F4] transition">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.status === 'live' ? 'bg-red-100 text-red-600' : 'bg-[#C9A84C]/15 text-[#C9A84C]'}`}>
              {s.stream_type === 'audio' ? <Radio className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">
                {s.status === 'live' && <span className="text-red-600 text-xs font-bold mr-1.5 uppercase">● Live</span>}
                {s.title}
              </p>
              <p className="text-xs text-[#A8A6A0]">
                {s.scheduled_for ? new Date(s.scheduled_for).toLocaleString() : 'Live now'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A8A6A0]" />
          </Link>
        ))}
      </div>
    );
  }

  // card variant
  return (
    <section className="py-12 bg-[#F8F7F4]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/25">
            <Radio className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider">Live Broadcasts</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-[#1A1A2E] mb-2">{title}</h2>
          <p className="text-[#4A4A6A] text-sm">Don't miss out — join us live across YouTube, Facebook, and right here on the site.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {streams.map(s => {
            const dt = s.scheduled_for ? new Date(s.scheduled_for) : null;
            const isLive = s.status === 'live';
            return (
              <Link key={s.id} to="/live" className="group bg-white rounded-2xl border border-[#EEEAE4] hover:border-[#C9A84C]/40 hover:shadow-xl transition-all overflow-hidden">
                <div className={`h-32 relative flex items-center justify-center ${isLive ? 'bg-gradient-to-br from-red-500 to-[#C9A84C]' : 'bg-gradient-to-br from-[#3D1F6E] to-[#1A3C8C]'}`}>
                  {isLive ? (
                    <div className="flex items-center gap-2 text-white">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="font-bold tracking-wider uppercase text-sm">Live Now</span>
                    </div>
                  ) : (
                    <div className="text-center text-white/90">
                      {s.stream_type === 'audio' ? <Radio className="w-8 h-8 mx-auto mb-1" /> : <Video className="w-8 h-8 mx-auto mb-1" />}
                      <p className="text-xs uppercase tracking-wider opacity-80">Coming up</p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-[#1A1A2E] mb-2 line-clamp-2 group-hover:text-[#C9A84C] transition">{s.title}</h3>
                  {s.description && <p className="text-sm text-[#4A4A6A] line-clamp-2 mb-3">{s.description}</p>}
                  {dt && (
                    <div className="flex items-center gap-1.5 text-xs text-[#A8A6A0]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#C9A84C] group-hover:gap-2 transition-all">
                    {isLive ? 'Watch now' : 'Set reminder'} <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UpcomingLiveStreams;
