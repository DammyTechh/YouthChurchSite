import React from 'react';

const Preloader = () => (
  <div className="fixed inset-0 bg-[#0F0E1A] flex items-center justify-center z-50">
    <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 30% 40%, rgba(61,31,110,0.5) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(26,60,140,0.4) 0%, transparent 55%)'}} />
    <div className="relative z-10 text-center">
      <div className="w-20 h-20 rounded-2xl mx-auto mb-6 overflow-hidden ring-2 ring-[#C9A84C]/30 animate-float shadow-2xl">
        <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-full h-full object-cover" />
      </div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">
        Rugged<span className="text-[#C9A84C]">Youth</span>
      </h1>
      <p className="text-white/40 text-sm mb-8 tracking-wider uppercase text-xs">Empowering Young Lives</p>
      <div className="w-48 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] rounded-full animate-loading-bar" />
      </div>
    </div>
  </div>
);

export default Preloader;
