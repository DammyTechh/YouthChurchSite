import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const NewMemberForm = () => {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.email || !form.location) {
      setErrorMsg('Please fill in all fields.'); setStatus('error'); return;
    }
    setLoading(true); setErrorMsg('');
    try {
      const { error } = await supabase.from('new_members').insert([{
        ...form, subscribed_newsletter: true
      }]);
      if (error) throw error;
      setStatus('success');
      setForm({ full_name: '', phone: '', email: '', location: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <section className="py-20 bg-[#1A1A2E] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(ellipse at 20% 50%, #3D1F6E 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #1A3C8C 0%, transparent 60%)'}} />
        <div className="relative z-10 container mx-auto px-4 max-w-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#C9A84C]" />
          </div>
          <h3 className="font-display text-3xl text-white mb-4">Welcome to the Family!</h3>
          <p className="text-white/60 text-lg leading-relaxed">
            Thank you for joining RuggedYouth. Our team will reach out to you soon, and you'll start receiving updates about our programs and activities.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-8 text-sm text-[#C9A84C] hover:text-[#E8C97A] transition-colors"
          >
            Register another person →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#1A1A2E] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(ellipse at 20% 50%, #3D1F6E 0%, transparent 55%), radial-gradient(ellipse at 80% 50%, #1A3C8C 0%, transparent 55%)'}} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase">New Member</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl text-white leading-tight mb-5">
              Join Our <br />
              <span className="text-[#C9A84C]">Community</span>
            </h2>
            <p className="text-white/55 text-lg leading-relaxed mb-8">
              Register to become a part of RuggedYouth. We'll use your contact to follow up personally and keep you informed about all our programs, events, and activities.
            </p>
            <div className="space-y-3">
              {[
                { icon: '✓', text: 'Personal follow-up from our team' },
                { icon: '✓', text: 'Newsletter updates on all activities' },
                { icon: '✓', text: 'First access to events & programs' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] text-xs flex items-center justify-center font-bold">{item.icon}</span>
                  <span className="text-white/65 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/60 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+234 800 000 0000"
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/60 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/60 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Location / City</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Your city or area"
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/60 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {status === 'error' && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {errorMsg}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1A1A2E]/30 border-t-[#1A1A2E] rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <>Register as New Member <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-white/35 text-xs">
                Your information is private and only used for ministry communication.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewMemberForm;
