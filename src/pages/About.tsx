import React, { useState } from 'react';
import { Heart, Target, Users, Award, CheckCircle, Quote, Phone, Mail, Send, MessageCircle } from 'lucide-react';
import { SOCIALS, WHATSAPP_URL } from '../lib/socials';

// ── Data ──────────────────────────────────────────────────────────────────────

const COORDINATORS = [
  {
    img:      'https://imgur.com/IiEMPU2.png',
    name:     'Bro. Adeyemo Damilare',
    aka:      'Vindicated',
    role:     'General Youth P.R.O',
    initial:  'D',
  },
  {
    img:      'https://imgur.com/hc0bxrY.png',
    name:     'Miss Aisha Daramola',
    aka:      null,
    role:     'Assistant P.R.O',
    initial:  'A',
  },
  {
    img:      'https://imgur.com/6juI44S.png',
    name:     'Bro. Ayomitunde Usman',
    aka:      'Akaweje',
    role:     'General Youth Welfare',
    initial:  'A',
  },
  {
    img:      'https://imgur.com/sdP5KKi.png',
    name:     'Bro. Oluwatobiloba Kayode',
    aka:      'Asiwaju',
    role:     'General Accountant',
    initial:  'O',
  },
  {
    img:      'https://imgur.com/rJTXlSH.png',
    name:     'Mr. Adewunmi',
    aka:      'Smart',
    role:     'General Youth Secretary',
    initial:  'A',
  },
  {
    img:      'https://imgur.com/GqwNIW9.png',
    name:     'Mr. Dolapo Bolakale',
    aka:      'H.R',
    role:     'General Youth Coordinator',
    initial:  'D',
  },
  {
    img:      'https://imgur.com/9QiTUCF.png',
    name:     'Mrs. Bello',
    aka:      null,
    role:     'Assistant Youth Welfare',
    initial:  'B',
  },
  {
    img:      'https://imgur.com/wEQA5Cp.png',
    name:     'Mrs. Damola Obisesan',
    aka:      'Mummy G.O',
    role:     'Youth Overseer',
    initial:  'D',
  },
  {
    img:      'https://imgur.com/92lqpRG.png',
    name:     'Mrs. Roda Fadimaji',
    aka:      null,
    role:     'Assistant Accountant',
    initial:  'R',
  },
  {
    img:      'https://imgur.com/6ljlOG6.png',
    name:     'Miss Sahra Atilade',
    aka:      null,
    role:     'Assistant Youth Secretary',
    initial:  'S',
  },
];

// ── Coordinator card ──────────────────────────────────────────────────────────

const CoordinatorCard = ({ person }: { person: typeof COORDINATORS[0] }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group flex flex-col items-center text-center
      bg-white rounded-2xl border border-[#EEEAE4] p-6
      hover:border-[#C9A84C]/40 hover:shadow-xl hover:shadow-[#C9A84C]/8
      hover:-translate-y-1 transition-all duration-300">

      {/* Photo */}
      <div className="relative w-24 h-24 rounded-full mb-4 overflow-hidden
        ring-2 ring-[#C9A84C]/25 group-hover:ring-[#C9A84C]/60 transition-all
        flex-shrink-0">
        {!imgError ? (
          <img
            src={person.img}
            alt={person.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top
              group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#3D1F6E] to-[#6B3FA0]
            flex items-center justify-center text-white font-bold text-2xl font-display">
            {person.initial}
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="font-display font-semibold text-[#1A1A2E] text-sm leading-snug mb-0.5">
        {person.name}
      </h4>

      {/* A.K.A */}
      {person.aka && (
        <p className="text-xs text-[#C9A84C] font-semibold italic mb-1">
          a.k.a {person.aka}
        </p>
      )}

      {/* Role */}
      <span className="inline-block text-xs font-bold uppercase tracking-wider
        text-[#3D1F6E] bg-[#3D1F6E]/8 border border-[#3D1F6E]/15
        px-3 py-1 rounded-full mt-1">
        {person.role}
      </span>
    </div>
  );
};

// ── Main About page ───────────────────────────────────────────────────────────

const About = () => {
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', message:'' });
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1000);
  };

  const values = [
    { icon:<Heart className="w-5 h-5"/>,  title:'Faith-Centered',    desc:'Everything we do is rooted in Christian values and biblical principles.' },
    { icon:<Users className="w-5 h-5"/>,  title:'Community Focused',  desc:'Building strong relationships and supporting one another in growth.' },
    { icon:<Target className="w-5 h-5"/>, title:'Purpose Driven',     desc:'Helping young people discover and pursue their God-given purpose.' },
    { icon:<Award className="w-5 h-5"/>,  title:'Excellence',         desc:'Committed to providing high-quality programs and meaningful experiences.' },
  ];

  const achievements = [
    '500+ Active Youth Members',
    '50+ Weekly Programs',
    '25+ Community Outreach Projects',
    '5 Years of Continuous Impact',
    '100+ Lives Transformed',
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#1A1A2E] relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(61,31,110,0.5) 0%, transparent 55%)' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-5" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            About <span className="text-[#C9A84C]">RuggedYouth</span>
          </h1>
          <p className="text-white/55 max-w-2xl mx-auto">
            Empowering young people to discover their purpose, build their faith,
            and make a positive impact — under the covering of Love of Christ
            Global Bible Church Worldwide.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* ── General Overseer ─────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-4" />
            <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
              Spiritual Covering
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Our General Overseers
            </h2>
            <p className="text-[#4A4A6A] mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Founders of Love of Christ Global Bible Church Worldwide —
              under whose grace and vision RuggedYouth operates.
            </p>
          </div>

          {/* G.O card — full-width feature */}
          <div className="bg-white rounded-3xl border border-[#EEEAE4] overflow-hidden
            shadow-lg shadow-[#C9A84C]/5">
            <div className="grid lg:grid-cols-2 gap-0">

              {/* Photo side */}
              <div className="relative min-h-[340px] lg:min-h-[440px] overflow-hidden bg-[#0F0E1A]">
                <img
                  src="https://imgur.com/988yByW.png"
                  alt="Prophet Olabode Odunayo & Pastor Mrs. Olufunke Odunayo"
                  className="w-full h-full object-cover object-center opacity-92"
                  style={{ minHeight: '340px' }}
                />
                {/* Elegant overlay */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, transparent 50%, rgba(255,255,255,0.04)), linear-gradient(to top, rgba(10,10,26,0.5) 0%, transparent 40%)' }} />
                {/* Gold accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1
                  bg-gradient-to-r from-[#C9A84C] via-[#E8C97A] to-[#C9A84C]
                  lg:top-0 lg:bottom-auto lg:left-auto lg:right-0 lg:w-1 lg:h-full
                  lg:bg-gradient-to-b" />
              </div>

              {/* Content side */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">

                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5
                  rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                  <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                    Founders · G.O
                  </span>
                </div>

                {/* Prophet / Daddy G.O */}
                <div className="mb-5 pb-5 border-b border-[#EEEAE4]">
                  <h3 className="font-display text-xl font-bold text-[#1A1A2E] mb-0.5">
                    Prophet Olabode Odunayo J.P
                  </h3>
                  <p className="text-[#C9A84C] font-semibold text-sm uppercase
                    tracking-wider mb-3">
                    General Overseer &nbsp;·&nbsp; <span className="italic normal-case">a.k.a Baba Love</span>
                  </p>
                  <p className="text-sm text-[#4A4A6A] leading-relaxed">
                    A man of God whose life is a testament to the love of Christ. Prophet
                    Olabode Odunayo — widely known as <em>Baba Love</em> — founded
                    Love of Christ Global Bible Church Worldwide with a singular vision:
                    to spread the love of God to every nation, tribe, and generation.
                    His prophetic ministry and apostolic grace have been the bedrock upon
                    which RuggedYouth stands.
                  </p>
                </div>

                {/* Pastor / Mummy G.O */}
                <div className="mb-7">
                  <h3 className="font-display text-xl font-bold text-[#1A1A2E] mb-0.5">
                    Pastor (Dr.) Mrs. Olufunke Odunayo
                  </h3>
                  <p className="text-[#C9A84C] font-semibold text-sm uppercase
                    tracking-wider mb-3">
                    Co-Founder &nbsp;·&nbsp; <span className="italic normal-case">a.k.a Mama for the Youth</span>
                  </p>
                  <p className="text-sm text-[#4A4A6A] leading-relaxed">
                    A mother in Zion whose heart beats for the next generation.
                    Pastor (Dr.) Mrs. Olufunke Odunayo carries a deep passion for
                    youth development, discipleship, and holistic leadership. Her
                    tireless investment in young lives has shaped RuggedYouth into
                    a family — not just a ministry.
                  </p>
                </div>

                {/* Church name */}
                <div className="p-4 bg-[#F5EDD9] rounded-xl border-l-4 border-[#C9A84C]">
                  <p className="text-xs font-bold text-[#C9A84C] uppercase
                    tracking-widest mb-1">Spiritual Home</p>
                  <p className="text-sm font-semibold text-[#1A1A2E] leading-snug">
                    Love of Christ Global Bible Church Worldwide
                  </p>
                  <p className="text-xs text-[#4A4A6A] mt-1 italic">
                    "Spreading God's love to every nation and generation"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Youth Pastor ─────────────────────────────────────── */}
        <section>
          <div className="bg-white rounded-2xl border border-[#EEEAE4] overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative h-72 lg:h-auto min-h-[300px] bg-[#1A1A2E] overflow-hidden">
                <img
                  src="https://imgur.com/RAOB6Ej.png"
                  alt="Youth Pastor — RuggedYouth"
                  className="w-full h-full object-cover object-center opacity-90"
                />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(26,26,46,0.15))' }} />
                <div className="absolute bottom-0 left-0 right-0 h-1
                  bg-gradient-to-r from-[#C9A84C] via-[#E8C97A] to-[#C9A84C]
                  lg:top-0 lg:bottom-auto lg:left-auto lg:right-0 lg:w-1 lg:h-full
                  lg:bg-gradient-to-b" />
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5
                  rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                  <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                    Leadership
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold text-[#1A1A2E] mb-1">
                  Our Youth Pastor
                </h2>
                <p className="text-[#C9A84C] font-semibold text-sm mb-5 uppercase tracking-wider">
                  RuggedYouth 4Christ
                </p>
                <div className="space-y-3 text-sm text-[#4A4A6A] leading-relaxed mb-6">
                  <p>
                    Our Youth Pastor leads RuggedYouth with a burning passion to see young people
                    rooted deeply in Christ — fully alive to their faith and purposeful in their
                    careers and community.
                  </p>
                  <p>
                    With a heart for discipleship and an unwavering commitment to God's word,
                    he guides the next generation to be truly "Rugged for Christ" — resilient,
                    purposeful, and heaven-bound.
                  </p>
                </div>
                <div className="p-5 bg-[#F5EDD9] rounded-xl border-l-4 border-[#C9A84C]">
                  <p className="text-[#4A4A6A] italic text-sm leading-relaxed">
                    "We are building more than a youth group — we are raising an army of young
                    men and women who are established in Christ and excellent in their calling."
                  </p>
                  <p className="text-xs text-[#C9A84C] font-semibold mt-2 uppercase tracking-wider">
                    — Youth Pastor
                  </p>
                </div>
                <a href="tel:+2348136790977"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold
                    text-[#3D1F6E] hover:text-[#C9A84C] transition-colors w-fit">
                  <Phone className="w-4 h-4" /> +234 813 679 0977
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Meet Our Coordinators ─────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-4" />
            <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
              The Team
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Meet Our Coordinators
            </h2>
            <p className="text-[#4A4A6A] mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
              These are the dedicated men and women who pour their hearts into building,
              serving, and sustaining the RuggedYouth community every day.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {COORDINATORS.map((person, i) => (
              <CoordinatorCard key={i} person={person} />
            ))}
          </div>
        </section>

        {/* ── Story + Values ────────────────────────────────────── */}
        <section className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-2xl border border-[#EEEAE4] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/12 border border-[#C9A84C]/25
                flex items-center justify-center text-[#C9A84C]">
                <Quote className="w-5 h-5"/>
              </div>
              <h2 className="font-display text-xl font-bold text-[#1A1A2E]">Our Story</h2>
            </div>
            <div className="space-y-4 text-sm text-[#4A4A6A] leading-relaxed">
              <p>"Rugged for Christ" is a mindset that empowers us to overcome life's challenges
                through prayer, fasting, and fellowship with God. As Jesus said in John 16:33,
                "In the world you will have tribulations; but be of good cheer, I have overcome
                the world."</p>
              <p>We choose to be "Rugged for Christ," relying on His strength and grace to
                overcome every obstacle — not for worldly gain, but for eternal purpose.</p>
              <p>We believe every young person has incredible potential, and our mission is to
                provide the support, guidance, and opportunities they need to flourish.</p>
            </div>
            <div className="mt-6 p-5 bg-gradient-to-r from-[#F5EDD9] to-[#FBF5E7]
              rounded-xl border-l-4 border-[#C9A84C]">
              <p className="text-[#4A4A6A] italic text-sm leading-relaxed">
                "We're not just building a youth group; we're building character, faith,
                and the future leaders of tomorrow."
              </p>
              <p className="text-xs text-[#C9A84C] font-semibold mt-2 uppercase tracking-wider">
                — RuggedYouth Leadership
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-[#1A1A2E] mb-6">Our Core Values</h2>
            <div className="space-y-4">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-xl
                  border border-[#EEEAE4] p-5 hover:border-[#C9A84C]/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#3D1F6E]/8 border border-[#3D1F6E]/15
                    flex items-center justify-center text-[#3D1F6E] flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A2E] mb-1">{v.title}</h3>
                    <p className="text-sm text-[#4A4A6A]">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Impact ───────────────────────────────────────────── */}
        <section className="bg-[#1A1A2E] rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(61,31,110,0.4) 0%, transparent 55%)' }} />
          <div className="relative z-10">
            <h2 className="font-display text-2xl font-bold text-white mb-8">Our Impact</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0"/>
                  <span className="text-white/80 text-sm">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#EEEAE4] p-8 text-center">
          <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-5"/>
          <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-4">Our Mission</h2>
          <p className="text-[#4A4A6A] max-w-2xl mx-auto leading-relaxed mb-4">
            To draw the heart of every individual to the old Rugged Cross, make individuals
            active and established in Christ and Career, show Love and make peace,
            and make it to Heaven.
          </p>
          <p className="text-xs text-[#C9A84C] font-semibold uppercase tracking-wider">
            Hebrews 12:2 · Col. 3:23–24 · Joshua 1:8 · Matt. 5:9 · 1 John 4:7 · John 14:3
          </p>
        </section>

        {/* ── Contact ─────────────────────────────────────────── */}
        <section className="grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-6">Get In Touch</h2>
            <div className="space-y-4">
              {[
                { icon:<Phone className="w-5 h-5"/>, label:'RuggedYouth Office', value:'+234 814 510 8708', href:'tel:+2348145108708', sub:'General inquiries & program info' },
                { icon:<Phone className="w-5 h-5"/>, label:'Youth Pastor',        value:'+234 813 679 0977', href:'tel:+2348136790977', sub:'Direct pastoral support' },
                { icon:<Mail className="w-5 h-5"/>,  label:'Email',              value:'theruggedy@gmail.com', href:'mailto:theruggedy@gmail.com', sub:'We reply within 24 hours' },
              ].map((c, i) => (
                <a key={i} href={c.href}
                  className="group flex items-start gap-4 p-5 bg-white rounded-xl
                    border border-[#EEEAE4] hover:border-[#C9A84C]/40 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/12 border border-[#C9A84C]/25
                    flex items-center justify-center text-[#C9A84C] flex-shrink-0">{c.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-0.5">{c.label}</p>
                    <p className="font-semibold text-[#1A1A2E] group-hover:text-[#C9A84C] transition-colors">{c.value}</p>
                    <p className="text-xs text-[#A8A6A0] mt-0.5">{c.sub}</p>
                  </div>
                </a>
              ))}

              {/* Social links */}
              <div className="bg-white rounded-xl border border-[#EEEAE4] p-5">
                <p className="text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-4">Follow Us</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(SOCIALS).map(s => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg
                        bg-[#F8F7F4] border border-[#EEEAE4] hover:border-[#C9A84C]/40
                        hover:bg-[#F5EDD9] transition-all group">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center
                        text-white text-xs font-bold flex-shrink-0"
                        style={{ background: s.color }}>
                        {s.label[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1A1A2E] leading-none">{s.label}</p>
                        <p className="text-xs text-[#A8A6A0] truncate mt-0.5">{s.handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 bg-green-50
                  border border-green-200 rounded-xl hover:bg-green-100 transition-all">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center
                  justify-center text-white flex-shrink-0">
                  <MessageCircle className="w-5 h-5"/>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Join WhatsApp Community</p>
                  <p className="text-xs text-green-600 mt-0.5">Connect with other members</p>
                </div>
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-[#EEEAE4] p-8">
            <h3 className="font-display text-xl font-bold text-[#1A1A2E] mb-6">Send a Message</h3>
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center
                  justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600"/>
                </div>
                <h4 className="font-display text-lg font-semibold text-[#1A1A2E] mb-2">Message Sent!</h4>
                <p className="text-sm text-[#4A4A6A]">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                    className="input-field" placeholder="Your full name" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                    className="input-field" placeholder="you@example.com" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                    className="input-field" placeholder="+234 800 000 0000"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                    className="input-field resize-none" rows={4}
                    placeholder="How can we help?" required/>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3
                    bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E]
                    rounded-lg font-semibold text-sm hover:opacity-90 transition-all
                    disabled:opacity-50">
                  <Send className="w-4 h-4"/> {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
