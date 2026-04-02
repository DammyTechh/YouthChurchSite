import React, { useState, useEffect } from 'react';
import { ExternalLink, Youtube, Instagram, Facebook, Music, Play, Search } from 'lucide-react';
import { supabase, SocialMediaPost } from '../lib/supabase';
import { SOCIALS } from '../lib/socials';

const Media = () => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const defaultPosts: SocialMediaPost[] = [
    { platform:'youtube',  title:'Youth Revival Night 2024', description:'Highlights from our powerful youth revival service with amazing testimonies and worship.', url: SOCIALS.youtube.url, thumbnail:'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=800', date:'2024-01-15' },
    { platform:'instagram',title:'Daily Inspiration Posts',  description:'Follow us for daily motivational quotes, behind-the-scenes content, and community highlights.', url: SOCIALS.instagram.url, thumbnail:'https://images.pexels.com/photos/7530568/pexels-photo-7530568.jpeg?auto=compress&cs=tinysrgb&w=800', date:'2024-01-14' },
    { platform:'tiktok',   title:'Youth Challenges & Fun',   description:'Join our viral challenges, dance videos, and quick inspirational messages for young people.', url: SOCIALS.tiktok.url, thumbnail:'https://images.pexels.com/photos/6994999/pexels-photo-6994999.jpeg?auto=compress&cs=tinysrgb&w=800', date:'2024-01-13' },
    { platform:'facebook', title:'Community Updates',        description:'Stay connected with our community events, announcements, and live streaming sessions.', url: SOCIALS.facebook.url, thumbnail:'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800', date:'2024-01-12' },
  ];

  useEffect(() => {
    supabase.from('social_media_posts').select('*').order('date',{ascending:false})
      .then(({data,error}) => {
        setPosts(!error && data?.length ? data : defaultPosts);
        setLoading(false);
      });
  }, []);

  const platformConfig: Record<string,{icon:React.ReactNode;color:string;label:string}> = {
    youtube:  {icon:<Youtube className="w-4 h-4"/>,   color:'#FF0000', label:'YouTube'},
    instagram:{icon:<Instagram className="w-4 h-4"/>, color:'#E1306C', label:'Instagram'},
    tiktok:   {icon:<Music className="w-4 h-4"/>,     color:'#010101', label:'TikTok'},
    facebook: {icon:<Facebook className="w-4 h-4"/>,  color:'#1877F2', label:'Facebook'},
  };

  const channels = [
    { platform:'youtube',   url: SOCIALS.youtube.url,   handle: SOCIALS.youtube.handle   },
    { platform:'instagram', url: SOCIALS.instagram.url, handle: SOCIALS.instagram.handle },
    { platform:'tiktok',    url: SOCIALS.tiktok.url,    handle: SOCIALS.tiktok.handle    },
    { platform:'facebook',  url: SOCIALS.facebook.url,  handle: SOCIALS.facebook.handle  },
  ];

  const filtered = posts.filter(p => {
    const matchFilter = filter === 'all' || p.platform === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero */}
      <section className="py-16 bg-[#1A1A2E] relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 70% 50%, rgba(107,63,160,0.5) 0%, transparent 55%)'}} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-block w-8 h-0.5 bg-[#C9A84C] mb-5" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Media <span className="text-[#C9A84C]">Gallery</span>
          </h1>
          <p className="text-white/55 max-w-xl mx-auto">Stay connected with RuggedYouth across all our social channels and latest content.</p>
        </div>
      </section>

      {/* Social channel links */}
      <section className="py-10 bg-white border-b border-[#EEEAE4]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {channels.map(ch => {
              const cfg = platformConfig[ch.platform];
              return (
                <a key={ch.platform} href={ch.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 rounded-xl border border-[#EEEAE4] hover:border-[#C9A84C]/40 hover:shadow-md transition-all bg-white">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{background: cfg.color}}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A2E]">{cfg.label}</p>
                    <p className="text-xs text-[#A8A6A0] truncate">{ch.handle}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#A8A6A0] ml-auto flex-shrink-0 group-hover:text-[#C9A84C] transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-16 lg:top-20 z-30 bg-white/95 backdrop-blur-sm border-b border-[#EEEAE4]">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A6A0]" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search content..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg text-sm text-[#1A1A2E] focus:outline-none focus:border-[#C9A84C] transition-colors"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','youtube','instagram','tiktok','facebook'].map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter===f ? 'bg-[#C9A84C] text-white' : 'bg-[#F8F7F4] text-[#4A4A6A] hover:bg-[#EEEAE4] border border-[#E2E0DC]'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <section className="py-12 container mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i=><div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-[#EEEAE4]"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Play className="w-12 h-12 text-[#C9A84C]/20 mx-auto mb-4"/>
            <h3 className="font-display text-xl text-[#1A1A2E] mb-2">No content found</h3>
            <p className="text-sm text-[#4A4A6A]">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((post, i) => {
              const cfg = platformConfig[post.platform];
              return (
                <a key={post.id||i} href={post.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-white rounded-xl border border-[#EEEAE4] overflow-hidden hover:border-[#C9A84C]/40 hover:shadow-lg hover:shadow-[#C9A84C]/8 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-44 overflow-hidden">
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{background: cfg.color}}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white"/>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1A1A2E] text-sm mb-1 line-clamp-1 group-hover:text-[#3D1F6E] transition-colors">{post.title}</h3>
                    <p className="text-xs text-[#A8A6A0] line-clamp-2 leading-relaxed">{post.description}</p>
                    <p className="text-xs text-[#C9A84C] mt-2">{new Date(post.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Media;
