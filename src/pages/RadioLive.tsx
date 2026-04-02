import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Radio, Clock, Calendar, Mic } from 'lucide-react';

const RadioLive = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play().catch(console.error); }
    setIsPlaying(!isPlaying);
  };

  const isLiveTime = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= 5*60+15 && mins <= 5*60+30;
  };

  const getNextLive = () => {
    const t = new Date(); t.setDate(t.getDate()+1); t.setHours(5,15,0,0);
    return t.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  };

  const schedule = [
    { day:'Mon – Fri', time:'5:15 – 5:30 AM', title:'Morning Devotion', desc:'Scripture, prayer & daily inspiration' },
    { day:'Saturdays', time:'6:00 – 6:30 AM', title:'Youth Talk', desc:'Practical topics for young people' },
    { day:'Sundays', time:'7:00 – 7:30 AM', title:'Word of Faith', desc:'Deeper teaching & testimonies' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0E1A] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 20% 30%, rgba(61,31,110,0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(26,60,140,0.5) 0%, transparent 50%)'}}/>
      <div className="absolute inset-0 opacity-15" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")"}}/>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8">
            <Radio className="w-3.5 h-3.5 text-[#C9A84C]"/>
            <span className="text-[#C9A84C] text-xs font-semibold tracking-wider uppercase">Live Broadcasting</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Radio <span className="text-[#C9A84C]">Live</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">Join us every morning for inspiring messages, worship music, and community updates.</p>
        </div>

        {/* Player */}
        <div className="max-w-lg mx-auto mb-14">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
            {/* Live status */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {isLiveTime() ? (
                <><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/><span className="text-white font-semibold tracking-wide text-sm uppercase">On Air · Live Now</span></>
              ) : (
                <><div className="w-2.5 h-2.5 bg-white/20 rounded-full"/><span className="text-white/40 text-sm uppercase tracking-wide">Off Air</span></>
              )}
            </div>

            {/* Visualizer bars (decorative) */}
            <div className="flex items-end justify-center gap-1 h-10 mb-6">
              {[4,7,5,9,6,8,4,6,9,5,7,4,8,6,5].map((h,i)=>(
                <div key={i} className={`w-1.5 rounded-full transition-all ${isPlaying?'bg-[#C9A84C] animate-pulse':'bg-white/10'}`}
                  style={{height:`${isPlaying?h*4:8}px`, animationDelay:`${i*0.1}s`}}/>
              ))}
            </div>

            {/* Play button */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <button onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C97A] flex items-center justify-center text-[#1A1A2E] hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-[#C9A84C]/20">
                {isPlaying ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8 ml-1"/>}
              </button>
              <audio ref={audioRef} preload="none"
                onPlay={()=>setIsPlaying(true)} onPause={()=>setIsPlaying(false)} onError={()=>setIsPlaying(false)}>
                <source src="https://cast5.my-control-panel.com/proxy/princefm/stream?listening-from-radio-garden=1685336566" type="audio/mp3"/>
              </audio>
              <div className="flex items-center gap-2 text-white/60">
                <Volume2 className="w-4 h-4"/>
                <span className="text-sm font-medium">RuggedYouth Radio</span>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-[#C9A84C]"/><span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Schedule</span></div>
                <p className="text-white text-sm">Daily · 5:15 – 5:30 AM</p>
                <p className="text-white/35 text-xs mt-1">15 min of inspiration</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-[#C9A84C]"/><span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Next Broadcast</span></div>
                <p className="text-white text-sm">{isLiveTime()?'NOW LIVE!':getNextLive()}</p>
                <p className="text-white/35 text-xs mt-1">Set a reminder</p>
              </div>
            </div>

            {/* Clock */}
            <div className="text-center mt-5 pt-5 border-t border-white/8">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Current Time</p>
              <p className="text-white font-mono text-lg">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">Broadcast Schedule</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {schedule.map((s,i)=>(
              <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-5 hover:border-[#C9A84C]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] mb-4">
                  <Mic className="w-5 h-5"/>
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
