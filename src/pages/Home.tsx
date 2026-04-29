import React from 'react';
import { ArrowRight, Heart, Users, Star, Calendar, Radio, Play, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewMemberForm from '../components/NewMemberForm';
import UpcomingLiveStreams from '../components/UpcomingLiveStreams';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0F0E1A]">
          {/* Layered atmosphere */}
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 30% 40%, rgba(61,31,110,0.7) 0%, transparent 55%), radial-gradient(ellipse at 75% 60%, rgba(26,60,140,0.5) 0%, transparent 50%)'}} />
          {/* Grain texture */}
          <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")"}} />
        </div>

        {/* Decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 animate-fadeInUp">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase">Empowering Young Lives</span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fadeInUp delay-100">
              Welcome to{' '}
              <span className="text-[#C9A84C]">RuggedYouth</span>
            </h1>

            {/* Sub */}
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed font-light animate-fadeInUp delay-200">
              Building character, faith, and purpose in the next generation through dynamic programs, community engagement, and spiritual growth.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fadeInUp delay-300">
              <Link to="/programs"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] px-7 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg shadow-[#C9A84C]/20">
                Explore Programs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/radio"
                className="inline-flex items-center gap-2 bg-white/8 border border-white/20 text-white px-7 py-3.5 rounded-lg font-medium text-sm hover:bg-white/12 transition-all">
                <Radio className="w-4 h-4" /> Listen Live
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fadeInUp delay-400">
              {[
                { icon: <Users className="w-5 h-5" />, num: '500+', label: 'Members' },
                { icon: <Heart className="w-5 h-5" />, num: '50+', label: 'Programs' },
                { icon: <Star className="w-5 h-5" />, num: '5 Yrs', label: 'Impact' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-full border border-[#C9A84C]/25 bg-[#C9A84C]/8 flex items-center justify-center text-[#C9A84C] mx-auto mb-2">
                    {s.icon}
                  </div>
                  <div className="text-xl font-bold text-white font-display">{s.num}</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-[#C9A84C]/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Upcoming Live Broadcasts (auto-populated from admin scheduling) ── */}
      <UpcomingLiveStreams limit={3} variant="card" title="Upcoming Live Broadcasts" />

      {/* ── Quick Access ─────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F8F7F4]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block w-10 h-0.5 bg-[#C9A84C] mb-5" />
            <h2 className="font-display text-4xl font-bold text-[#1A1A2E] mb-3">
              Discover <span className="text-[#C9A84C]">RuggedYouth</span>
            </h2>
            <p className="text-[#4A4A6A] max-w-xl mx-auto">
              Explore our community and find your place in God's plan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { to: '/programs', icon: <Calendar className="w-6 h-6" />, title: 'Programs', desc: 'Weekly Bible studies, fellowship & community programs', color: '#3D1F6E' },
              { to: '/radio', icon: <Radio className="w-6 h-6" />, title: 'Radio Live', desc: 'Tune in daily 5:15–5:30 AM for inspiration', color: '#1A3C8C' },
              { to: '/media', icon: <Play className="w-6 h-6" />, title: 'Media', desc: 'Videos, social posts & all our content in one place', color: '#6B3FA0' },
              { to: '/blog', icon: <BookOpen className="w-6 h-6" />, title: 'Blog', desc: 'Read, like, share & comment on our latest posts', color: '#C9A84C' },
            ].map((card) => (
              <Link key={card.to} to={card.to}
                className="group bg-white rounded-xl p-7 border border-[#EEEAE4] hover:border-[#C9A84C]/40 hover:shadow-lg hover:shadow-[#C9A84C]/8 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 transition-transform group-hover:scale-105"
                  style={{background:`linear-gradient(135deg, ${card.color}, ${card.color}cc)`}}>
                  {card.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1A1A2E] mb-2">{card.title}</h3>
                <p className="text-sm text-[#4A4A6A] leading-relaxed mb-4">{card.desc}</p>
                <span className="text-xs font-semibold text-[#C9A84C] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn More <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Statement ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <div className="inline-block w-10 h-0.5 bg-[#C9A84C] mb-5" />
          <blockquote className="font-display text-2xl sm:text-3xl text-[#1A1A2E] leading-relaxed font-normal italic mb-6">
            "To draw the heart of every individual to the old Rugged Cross, make them active and established in Christ and Career, show Love, make peace, and make it to Heaven."
          </blockquote>
          <p className="text-sm text-[#C9A84C] font-semibold uppercase tracking-wider">— RuggedYouth Mission</p>
          <p className="text-xs text-[#4A4A6A] mt-2">Hebrews 12:2 · Col. 3:23–24 · Joshua 1:8 · Matt. 5:9 · John 14:3</p>
        </div>
      </section>

      {/* ── New Member Form ───────────────────────────────────────────── */}
      <NewMemberForm />
    </div>
  );
};

export default Home;
