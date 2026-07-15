import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon, WhatsAppIcon } from './BrandIcons';
import { SOCIALS, WHATSAPP_URL } from '../lib/socials';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook',  icon: <FacebookIcon className="w-[18px] h-[18px]" />,  url: SOCIALS.facebook.url,  hover: 'hover:bg-[#0866FF] hover:border-[#0866FF]' },
    { name: 'Instagram', icon: <InstagramIcon className="w-[18px] h-[18px]" />, url: SOCIALS.instagram.url, hover: 'hover:bg-gradient-to-br hover:from-[#FEDA75] hover:via-[#D62976] hover:to-[#4F5BD5] hover:border-transparent' },
    { name: 'TikTok',    icon: <TikTokIcon className="w-[18px] h-[18px]" />,     url: SOCIALS.tiktok.url,     hover: 'hover:bg-black hover:border-white/40' },
    { name: 'YouTube',   icon: <YouTubeIcon className="w-[18px] h-[18px]" />,   url: SOCIALS.youtube.url,     hover: 'hover:bg-[#FF0000] hover:border-[#FF0000]' },
    { name: 'WhatsApp',  icon: <WhatsAppIcon className="w-[18px] h-[18px]" />,   url: WHATSAPP_URL,            hover: 'hover:bg-[#25D366] hover:border-[#25D366]' },
  ];

  const navLinks = [
    { label: 'Home',      path: '/'        },
    { label: 'Programs',  path: '/programs' },
    { label: 'Radio Live',path: '/radio'    },
    { label: 'Media',     path: '/media'    },
    { label: 'Blog',      path: '/blog'     },
    { label: 'About Us',  path: '/about'    },
  ];

  return (
    <footer className="bg-[#111120] text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-[#C9A84C]/30">
                <img src="https://imgur.com/bdwOYsa.png" alt="RuggedYouth" className="w-full h-full object-cover" />
              </div>
              <span className="font-display text-lg font-semibold">
                Rugged<span className="text-[#C9A84C]">Youth</span>
              </span>
            </div>
            <p className="text-white/45 text-sm leading-relaxed mb-4">
              Under the covering of Love of Christ Global Bible Church Worldwide.
              Empowering young people to discover their purpose and build their faith.
            </p>
            <p className="text-xs text-[#C9A84C]/70 italic mb-5">
              "Rugged for Christ" — Hebrews 12:2
            </p>
            <div className="flex gap-2">
              {socialLinks.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 hover:scale-105 ${s.hover}`}
                  aria-label={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5">Navigation</h4>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-white/55 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5">Our Programs</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {['Bible Study', 'Prayer Meeting', 'Youth Vigil', 'Youth Fellowship', 'Leadership Training', 'Community Service'].map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          {/* Contact & Radio */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5">Contact</h4>
            <div className="space-y-3 mb-6">
              <a href="tel:+2348145108708" className="flex items-start gap-3 group">
                <Phone className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70 group-hover:text-white transition-colors">+234 814 510 8708</p>
                  <p className="text-xs text-white/35">Main Office</p>
                </div>
              </a>
              <a href="tel:+2348136790977" className="flex items-start gap-3 group">
                <Phone className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70 group-hover:text-white transition-colors">+234 813 679 0977</p>
                  <p className="text-xs text-white/35">Youth Pastor</p>
                </div>
              </a>
              <a href="mailto:theruggedy@gmail.com" className="flex items-center gap-3 group">
                <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                <p className="text-sm text-white/70 group-hover:text-white transition-colors">theruggedy@gmail.com</p>
              </a>
            </div>

            {/* Social handles */}
            <div className="space-y-1.5 mb-5">
              {Object.values(SOCIALS).map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-[#C9A84C] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/40" />
                  {s.handle}
                </a>
              ))}
            </div>

            {/* Radio */}
            <div className="rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/6 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">Radio Live</span>
              </div>
              <p className="text-sm text-white/60">Daily · <span className="text-white font-medium">5:15–5:30 AM</span></p>
              <p className="text-xs text-white/35 mt-1">15 minutes of morning inspiration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30 flex items-center gap-1">
            © {currentYear} RuggedYouth 4Christ.
          </p>
          <div className="flex gap-5 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="mailto:theruggedy@gmail.com" className="hover:text-[#C9A84C] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
