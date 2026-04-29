import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { SOCIALS } from '../lib/socials';

interface HeaderProps { onNavigate: () => void; }

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navItems = [
    { path: '/',         label: 'Home'      },
    { path: '/programs', label: 'Programs'  },
    { path: '/live',     label: 'Live'      },
    { path: '/radio',    label: 'Radio Live'},
    { path: '/media',    label: 'Media'     },
    { path: '/blog',     label: 'Blog'      },
    { path: '/about',    label: 'About'     },
  ];

  const socialIcons = [
    { name: 'IG',  url: SOCIALS.instagram.url, emoji: '📸' },
    { name: 'YT',  url: SOCIALS.youtube.url,   emoji: '▶️' },
    { name: 'FB',  url: SOCIALS.facebook.url,  emoji: '👥' },
    { name: 'TT',  url: SOCIALS.tiktok.url,    emoji: '🎵' },
  ];

  const handleNavClick = () => { setMenuOpen(false); onNavigate(); };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled || menuOpen
        ? 'bg-[#1A1A2E] shadow-lg shadow-black/30'
        : 'bg-[#1A1A2E]/85 backdrop-blur-md'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-3 z-50 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-[#C9A84C]/40">
            <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-lg font-semibold text-white tracking-wide">
            Rugged<span className="text-[#C9A84C]">Youth</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} onClick={handleNavClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'text-[#E8C97A] bg-white/10'
                  : 'text-white/80 hover:text-white hover:bg-white/8'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="lg:hidden z-[60] p-2 rounded-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-[280px] z-50 flex flex-col
        bg-[#1A1A2E] border-l border-[#C9A84C]/20
        transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-[#C9A84C]/40">
              <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-sm font-semibold text-white">
              Rugged<span className="text-[#C9A84C]">Youth</span>
            </span>
          </div>
          <button onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} onClick={handleNavClick}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-[15px] font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-[#C9A84C]/15 text-[#E8C97A] border-l-2 border-[#C9A84C] pl-[14px]'
                  : 'text-white/80 hover:text-white hover:bg-white/8'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Social links in drawer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Follow Us</p>
          <div className="flex gap-2 mb-4">
            {[
              { label: 'Instagram', url: SOCIALS.instagram.url, bg: 'bg-gradient-to-br from-purple-500 to-pink-500', text: 'IG' },
              { label: 'YouTube',   url: SOCIALS.youtube.url,   bg: 'bg-red-600',   text: 'YT' },
              { label: 'Facebook',  url: SOCIALS.facebook.url,  bg: 'bg-blue-600',  text: 'FB' },
              { label: 'TikTok',    url: SOCIALS.tiktok.url,    bg: 'bg-[#010101] border border-white/20', text: 'TK' },
            ].map(s => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center
                  text-white text-xs font-bold hover:scale-105 transition-transform`}
                aria-label={s.label}>
                {s.text}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <a href="tel:+2348145108708" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors">
              <Phone className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              +234 814 510 8708
            </a>
            <a href="mailto:theruggedy@gmail.com" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors">
              <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              theruggedy@gmail.com
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
