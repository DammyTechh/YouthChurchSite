import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Radio, Clock, Calendar, Mic, Lock, ChevronRight, ListMusic } from 'lucide-react';
import { supabase, RadioRecording } from '../lib/supabase';
import { useRadioWindow, formatCountdown } from '../hooks/useRadioWindow';

const LIVE_STREAM_URL = 'https://cast5.my-control-panel.com/proxy/princefm/stream?listening-from-radio-garden=1685336566';

const RadioLive = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRecording, setActiveRecording] = useState<RadioRecording | null>(null);
  const [recordings, setRecordings] = useState<RadioRecording[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);

  const { isLive, nextOpenLabel, millisUntilOpen } = useRadioWindow();

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('radio_recordings')
          .select('*')
          .eq('is_published', true)
          .order('broadcast_date', { ascending: false })
          .limit(30);
        if (!cancelled) {
          if (!error && data) setRecordings(data as RadioRecording[]);
          setLoadingRecs(false);
        }
      } catch {
        if (!cancelled) setLoadingRecs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // If user is listening to live, force-pause when window closes
  useEffect(() => {
    if (!isLive && !activeRecording && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isLive, activeRecording, isPlaying]);

  const buttonLocked = !isLive && !activeRecording;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (buttonLocked) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
  };

  const playRecording = async (rec: RadioRecording) => {
    setActiveRecording(rec);
    setIsPlaying(false);
    setTimeout(() => audioRef.current?.play().catch(console.error), 100);
    if (rec.id) {
      const { error } = await supabase.rpc('increment_radio_play_count', { rec_id: rec.id });
      if (error) {
        await supabase.from('radio_recordings')
          .update({ play_count: (rec.play_count || 0) + 1 })
          .eq('id', rec.id);
      }
    }
  };

  const switchToLive = () => {
    setActiveRecording(null);
    setIsPlaying(false);
    setTimeout(() => audioRef.current?.play().catch(console.error), 100);
  };

  const currentSrc = activeRecording ? activeRecording.audio_url : LIVE_STREAM_URL;
  const sourceLabel = activeRecording
    ? `Recording · ${new Date(activeRecording.broadcast_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
    : 'RuggedYouth Radio · Live';

  const schedule = [
    { day: 'Mon – Fri', time: '5:14 – 5:30 AM', title: 'Morning Devotion', desc: 'Scripture, prayer & daily inspiration' },
    { day: 'Saturdays', time: '6:00 – 6:30 AM', title: 'Youth Talk',       desc: 'Practical topics for young people' },
    { day: 'Sundays',   time: '7:00 – 7:30 AM', title: 'Word of Faith',    desc: 'Deeper teaching & testimonies' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0E1A] relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(61,31,110,0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(26,60,140,0.5) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8">
            <Radio className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-semibold tracking-wider uppercase">Live Broadcasting</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Radio <span className="text-[#C9A84C]">Live</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">Join us every morning for inspiring messages, worship music, and community updates.</p>
        </div>

        <div className="max-w-lg mx-auto mb-14">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              {activeRecording ? (
                <><div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-full" /><span className="text-white font-semibold tracking-wide text-sm uppercase">Playing Recording</span></>
              ) : isLive ? (
                <><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /><span className="text-white font-semibold tracking-wide text-sm uppercase">On Air · Live Now</span></>
              ) : (
                <><div className="w-2.5 h-2.5 bg-white/20 rounded-full" /><span className="text-white/40 text-sm uppercase tracking-wide">Off Air</span></>
              )}
            </div>

            <div className="flex items-end justify-center gap-1 h-10 mb-6">
              {[4,7,5,9,6,8,4,6,9,5,7,4,8,6,5].map((h, i) => (
                <div key={i} className={`w-1.5 rounded-full transition-all ${isPlaying ? 'bg-[#C9A84C] animate-pulse' : 'bg-white/10'}`}
                  style={{ height: `${isPlaying ? h * 4 : 8}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 mb-4">
              <button onClick={togglePlay} disabled={buttonLocked}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  buttonLocked
                    ? 'bg-white/10 border border-white/15 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] hover:opacity-90 hover:scale-105 shadow-[#C9A84C]/20'
                }`}>
                {buttonLocked
                  ? <Lock className="w-7 h-7" />
                  : isPlaying
                    ? <Pause className="w-8 h-8" />
                    : <Play className="w-8 h-8 ml-1" />}
              </button>

              <audio
                ref={audioRef}
                preload="none"
                src={currentSrc}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={() => setIsPlaying(false)}
              />

              <div className="flex items-center gap-2 text-white/60">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">{sourceLabel}</span>
              </div>
            </div>

            {buttonLocked && (
              <div className="mb-4 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
                <p className="text-amber-200/90 text-xs leading-relaxed text-center">
                  <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Live radio plays only between <strong>5:14 – 5:31 AM (Africa/Lagos)</strong>. Next broadcast: <strong>{nextOpenLabel}</strong> · in {formatCountdown(millisUntilOpen)}.
                </p>
                <p className="text-white/40 text-xs text-center mt-1.5">You can still play any past broadcast from the archive below.</p>
              </div>
            )}

            {activeRecording && isLive && (
              <button onClick={switchToLive} className="w-full mb-4 text-center text-[#C9A84C] text-xs font-semibold hover:text-[#E8C97A]">
                ← Switch to Live broadcast (on air now)
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-[#C9A84C]" /><span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Schedule</span></div>
                <p className="text-white text-sm">Daily · 5:14 – 5:30 AM</p>
                <p className="text-white/35 text-xs mt-1">~16 min of inspiration</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-[#C9A84C]" /><span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Next Broadcast</span></div>
                <p className="text-white text-sm">{isLive ? 'NOW LIVE!' : nextOpenLabel}</p>
                <p className="text-white/35 text-xs mt-1">{isLive ? 'Tap to listen' : `In ${formatCountdown(millisUntilOpen)}`}</p>
              </div>
            </div>

            <div className="text-center mt-5 pt-5 border-t border-white/8">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Current Time</p>
              <p className="text-white font-mono text-lg">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-14">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-2 flex items-center justify-center gap-2">
            <ListMusic className="w-5 h-5 text-[#C9A84C]" />
            Past Broadcasts
          </h2>
          <p className="text-white/40 text-sm text-center mb-8">Listen to previous Morning Devotion sessions</p>

          {loadingRecs ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-10 bg-white/5 border border-white/8 rounded-xl">
              <Mic className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">No past broadcasts yet. Check back tomorrow morning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map(rec => {
                const isActive = activeRecording?.id === rec.id;
                const date = new Date(rec.broadcast_date);
                const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                const minutes = rec.duration_seconds ? Math.round(rec.duration_seconds / 60) : null;
                return (
                  <button key={rec.id}
                    onClick={() => playRecording(rec)}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-[#C9A84C]/10 border-[#C9A84C]/40'
                        : 'bg-white/5 border-white/8 hover:border-[#C9A84C]/25 hover:bg-white/8'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[#C9A84C] text-[#1A1A2E]' : 'bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C]'
                    }`}>
                      {isActive && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{rec.title}</p>
                      <p className="text-white/40 text-xs">
                        {formatted}{minutes ? ` · ${minutes} min` : ''}{rec.play_count ? ` · ${rec.play_count} play${rec.play_count !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">Broadcast Schedule</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {schedule.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-5 hover:border-[#C9A84C]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] mb-4">
                  <Mic className="w-5 h-5" />
                </div>
                <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-1">{s.day}</p>
                <p className="text-white font-semibold mb-1">{s.time}</p>
                <p className="text-white/80 text-sm font-medium mb-1">{s.title}</p>
                <p className="text-white/40 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioLive;
