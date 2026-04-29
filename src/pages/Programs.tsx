import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Music, Heart, Calendar, MapPin, Clock, Image as ImageIcon } from 'lucide-react';
import { supabase, UpcomingEvent, Program } from '../lib/supabase';
import UpcomingLiveStreams from '../components/UpcomingLiveStreams';

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const whatsappLink = "https://chat.whatsapp.com/GwFu5wDDl7O8hAT6p3JMAC?mode=ems_copy_t";

  const defaultPrograms = [
    { icon:'BookOpen', title:'Bible Study', description:"Deep dive into God's word with interactive discussions and practical applications for daily life.", schedule:'Thursdays 9:00 PM – 10:00 PM', location:'Main Hall' },
    { icon:'Heart', title:'Prayer Meeting', description:'Come together as a community to pray, intercede, and seek God\'s guidance for our lives and ministry.', schedule:'Wednesdays 5:00 PM – 6:00 PM', location:'Prayer Room' },
    { icon:'Users', title:'Youth Vigil', description:'A night of worship, prayer, and spiritual renewal to strengthen your faith and connect with peers.', schedule:'Last Saturday of Every Month', location:'Church Sanctuary' },
    { icon:'Music', title:'Youth Fellowship', description:'Building lasting friendships and community through games, activities, and spiritual growth.', schedule:'Last Sunday of Every Month', location:'Youth Center' },
  ];

  useEffect(() => {
    Promise.all([
      supabase.from('programs').select('*').order('created_at',{ascending:true}),
      supabase.from('upcoming_events').select('*').eq('is_active',true).gte('date',new Date().toISOString().split('T')[0]).order('date',{ascending:true})
    ]).then(([{data:progs},{data:evts}]) => {
      setPrograms(progs?.length ? progs : defaultPrograms);
      setUpcomingEvents(evts||[]);
      setLoading(false);
    });
  }, []);

  const getIcon = (n: string) => ({
    BookOpen:<BookOpen className="w-7 h-7"/>, Users:<Users className="w-7 h-7"/>, Music:<Music className="w-7 h-7"/>, Heart:<Heart className="w-7 h-7"/>, Calendar:<Calendar className="w-7 h-7"/>
  }[n] || <Calendar className="w-7 h-7"/>);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const fmtTime = (t: string) => { const [h,m]=t.split(':'); const d=new Date(); d.setHours(+h,+m); return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]"><div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero */}
      <section className="py-16 bg-[#1A1A2E] relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 30% 60%, rgba(61,31,110,0.6) 0%, transparent 55%)'}} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-5" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Our <span className="text-[#C9A84C]">Programs</span>
          </h1>
          <p className="text-white/55 max-w-2xl mx-auto">Discover opportunities to grow, connect, and make a lasting impact through our programs.</p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-14 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {programs.map((p, i) => (
            <div key={i} className="group bg-white rounded-xl border border-[#EEEAE4] p-7 hover:border-[#C9A84C]/40 hover:shadow-lg hover:shadow-[#C9A84C]/8 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3D1F6E] to-[#6B3FA0] flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform">
                {getIcon(p.icon)}
              </div>
              <h3 className="font-display text-lg font-semibold text-[#1A1A2E] mb-2">{p.title}</h3>
              <p className="text-sm text-[#4A4A6A] leading-relaxed mb-5">{p.description}</p>
              <div className="space-y-1.5 text-xs text-[#A8A6A0]">
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#C9A84C]"/>{p.schedule}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C9A84C]"/>{p.location}</div>
              </div>
              <button onClick={()=>window.open(whatsappLink,'_blank')}
                className="mt-5 w-full py-2 text-xs font-semibold text-[#3D1F6E] border border-[#3D1F6E]/20 rounded-lg hover:bg-[#3D1F6E] hover:text-white transition-all opacity-0 group-hover:opacity-100">
                Join Program
              </button>
            </div>
          ))}
        </div>

        {/* Upcoming Live Broadcasts (from admin scheduling) */}
        <div className="mb-8">
          <UpcomingLiveStreams limit={3} variant="card" title="Upcoming Live Broadcasts" />
        </div>

        {/* Events */}
        <div className="bg-white rounded-2xl border border-[#EEEAE4] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Upcoming Events</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-sm text-[#C9A84C] font-medium">Stay Updated</span>
            </div>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="rounded-xl border border-[#EEEAE4] overflow-hidden hover:border-[#C9A84C]/40 hover:shadow-lg hover:shadow-[#C9A84C]/8 transition-all">
                  {ev.flier_url ? (
                    <div className="h-48 overflow-hidden relative">
                      <img src={ev.flier_url} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-br from-[#3D1F6E] to-[#1A3C8C] flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display font-semibold text-[#1A1A2E] mb-2">{ev.title}</h3>
                    <p className="text-xs text-[#4A4A6A] mb-4 line-clamp-2">{ev.description}</p>
                    <div className="space-y-1.5 text-xs text-[#A8A6A0]">
                      <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#C9A84C]"/>{fmtDate(ev.date)}</div>
                      <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#C9A84C]"/>{fmtTime(ev.time)}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C9A84C]"/>{ev.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-[#C9A84C]/20 mx-auto mb-4" />
              <h3 className="font-display text-lg text-[#1A1A2E] mb-2">No Upcoming Events</h3>
              <p className="text-sm text-[#4A4A6A]">Check back soon for exciting new events and programs!</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#1A1A2E] rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 100%, rgba(61,31,110,0.5) 0%, transparent 60%)'}} />
          <div className="relative z-10">
            <h3 className="font-display text-2xl font-bold text-white mb-3">Ready to Join Our Community?</h3>
            <p className="text-white/55 mb-6">Take the first step towards spiritual growth and meaningful connections.</p>
            <button onClick={()=>window.open(whatsappLink,'_blank')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] px-7 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-all">
              Get Started Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs;
