import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Calendar, Image as ImageIcon, BookOpen, Users, Settings,
  LogOut, Plus, Edit, Trash2, Upload, Eye, EyeOff, Save, X, CheckCircle,
  AlertCircle, Menu, Youtube, Instagram, Facebook, Music, ChevronRight,
  Lock, Mail, User, Key, ArrowLeft, RefreshCw, FileText, Headphones, Play,
  Search, Filter, BarChart3, TrendingUp, Heart, MessageCircle, Bell
} from 'lucide-react';
import { supabase, SocialMediaPost, UpcomingEvent, BlogPost, NewMember } from '../lib/supabase';

// ── Notification ────────────────────────────────────────────────────
const Notif = ({ msg, onClose }: { msg: {type:'success'|'error'; text:string}; onClose: ()=>void }) => (
  <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium max-w-sm animate-fadeInUp border ${
    msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
  }`}>
    {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
    <span>{msg.text}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
);

// ── Auth Screen ─────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }: { onAuth: (user: any) => void }) => {
  const [mode, setMode] = useState<'login'|'register'|'forgot'|'verify'>('login');
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [verifyEmail, setVerifyEmail] = useState('');

  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) { setMsg({type:'error', text: error.message}); return; }
    if (data.user) onAuth(data.user);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    if (form.password !== form.confirmPassword) { setMsg({type:'error',text:'Passwords do not match'}); setLoading(false); return; }
    if (form.password.length < 8) { setMsg({type:'error',text:'Password must be at least 8 characters'}); setLoading(false); return; }
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName }, emailRedirectTo: `https://ruggedyouth.com/auth/confirm` }
    });
    setLoading(false);
    if (error) { setMsg({type:'error', text: error.message}); return; }
    setVerifyEmail(form.email); setMode('verify');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `https://ruggedyouth.com/auth/confirm`
    });
    setLoading(false);
    if (error) { setMsg({type:'error', text: error.message}); return; }
    setMsg({type:'success', text: 'Password reset link sent! Check your inbox.'});
  };

  const handleResend = async () => {
    setLoading(true);
    await supabase.auth.resend({ type:'signup', email: verifyEmail, options: { emailRedirectTo: `https://ruggedyouth.com/auth/confirm` } });
    setLoading(false);
    setMsg({type:'success', text:'Verification email resent!'});
  };

  if (mode === 'verify') return (
    <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-16 h-16 rounded-2xl mx-auto mb-4 ring-2 ring-[#C9A84C]/30" />
          <h1 className="font-display text-2xl font-bold text-white">Check Your Email</h1>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h2 className="font-display text-xl text-white mb-3">Verify Your Email</h2>
          <p className="text-white/55 text-sm mb-2">We sent a confirmation link to:</p>
          <p className="text-white font-medium mb-6 break-all">{verifyEmail}</p>
          {msg && <p className={`text-sm mb-4 px-4 py-3 rounded-lg ${msg.type==='success'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{msg.text}</p>}
          <button onClick={handleResend} disabled={loading}
            className="w-full mb-3 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? 'Sending...' : 'Resend Email'}
          </button>
          <button onClick={() => setMode('login')} className="text-sm text-white/50 hover:text-white transition-colors">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-4" style={{backgroundImage:'radial-gradient(ellipse at 30% 40%, rgba(61,31,110,0.5) 0%, transparent 50%)'}}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-16 h-16 rounded-2xl mx-auto mb-4 ring-2 ring-[#C9A84C]/30" />
          <h1 className="font-display text-2xl font-bold text-white">
            Rugged<span className="text-[#C9A84C]">Youth</span> Admin
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Create admin account' : 'Reset your password'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {msg && (
            <div className={`flex items-start gap-3 p-3.5 rounded-lg mb-5 text-sm ${
              msg.type==='success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {msg.type==='success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {msg.text}
            </div>
          )}

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Email</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.email} onChange={e=>set('email',e.target.value)} type="email" placeholder="admin@email.com" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.password} onChange={e=>set('password',e.target.value)} type="password" placeholder="••••••••" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={()=>{setMode('forgot');setMsg(null);}} className="text-xs text-[#C9A84C] hover:text-[#E8C97A]">Forgot password?</button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-white/35">
                Need an account?{' '}
                <button type="button" onClick={()=>{setMode('register');setMsg(null);}} className="text-[#C9A84C] hover:text-[#E8C97A]">Register</button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Your full name" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Email</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.email} onChange={e=>set('email',e.target.value)} type="email" placeholder="admin@email.com" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.password} onChange={e=>set('password',e.target.value)} type="password" placeholder="Min. 8 characters" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} type="password" placeholder="Repeat password" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <p className="text-center text-xs text-white/35">
                Already have an account?{' '}
                <button type="button" onClick={()=>{setMode('login');setMsg(null);}} className="text-[#C9A84C] hover:text-[#E8C97A]">Sign In</button>
              </p>
            </form>
          )}

          {/* FORGOT */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-white/55 text-sm">Enter your email and we'll send a reset link.</p>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Email</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.email} onChange={e=>set('email',e.target.value)} type="email" placeholder="admin@email.com" required
                    className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-all" /></div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={()=>{setMode('login');setMsg(null);}} className="w-full text-xs text-white/40 hover:text-white transition-colors py-2">
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminPanel ─────────────────────────────────────────────────
const AdminPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notif, setNotif] = useState<{type:'success'|'error';text:string}|null>(null);

  // Data states
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<NewMember[]>([]);

  // Modal states
  const [editPost, setEditPost] = useState<SocialMediaPost|null>(null);
  const [editEvent, setEditEvent] = useState<UpcomingEvent|null>(null);
  const [editBlog, setEditBlog] = useState<BlogPost|null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);

  // Change password
  const [pwForm, setPwForm] = useState({current:'', newPw:'', confirm:''});
  const [pwLoading, setPwLoading] = useState(false);

  const notify = (type:'success'|'error', text:string) => { setNotif({type,text}); setTimeout(()=>setNotif(null),4000); };

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setUser(session?.user||null); setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => setUser(session?.user||null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if(user) { fetchSocialPosts(); fetchEvents(); fetchBlogPosts(); fetchMembers(); } }, [user]);

  const fetchSocialPosts = async () => { const {data}=await supabase.from('social_media_posts').select('*').order('created_at',{ascending:false}); setSocialPosts(data||[]); };
  const fetchEvents = async () => { const {data}=await supabase.from('upcoming_events').select('*').order('date',{ascending:true}); setEvents(data||[]); };
  const fetchBlogPosts = async () => { const {data}=await supabase.from('blog_posts').select('*').order('created_at',{ascending:false}); setBlogPosts(data||[]); };
  const fetchMembers = async () => { const {data}=await supabase.from('new_members').select('*').order('created_at',{ascending:false}); setMembers(data||[]); };

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { notify('error','Passwords do not match'); return; }
    if (pwForm.newPw.length < 8) { notify('error','Password must be at least 8 characters'); return; }
    setPwLoading(true);
    const {error} = await supabase.auth.updateUser({password: pwForm.newPw});
    setPwLoading(false);
    if (error) { notify('error', error.message); return; }
    notify('success','Password updated successfully!');
    setPwForm({current:'', newPw:'', confirm:''});
  };

  if (loading) return <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  const navItems = [
    { id:'dashboard', icon:<LayoutDashboard className="w-4 h-4"/>, label:'Dashboard' },
    { id:'posts', icon:<ImageIcon className="w-4 h-4"/>, label:'Media Posts' },
    { id:'events', icon:<Calendar className="w-4 h-4"/>, label:'Events' },
    { id:'blog', icon:<BookOpen className="w-4 h-4"/>, label:'Blog' },
    { id:'members', icon:<Users className="w-4 h-4"/>, label:'Members' },
    { id:'settings', icon:<Settings className="w-4 h-4"/>, label:'Settings' },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111120] border-r border-[#C9A84C]/12">
      {/* Logo */}
      <div className="p-5 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-[#C9A84C]/30"><img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-full h-full object-cover"/></div>
          <div>
            <p className="font-display text-sm font-semibold text-white">Rugged<span className="text-[#C9A84C]">Youth</span></p>
            <p className="text-xs text-white/30">Admin Panel</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <button key={item.id} onClick={()=>{setTab(item.id);setSidebarOpen(false);}}
            className={`admin-nav-item w-full text-left ${tab===item.id?'active':''}`}>
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
      {/* User */}
      <div className="p-4 border-t border-white/6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.user_metadata?.full_name || 'Admin'}</p>
            <p className="text-xs text-white/30 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="admin-nav-item w-full text-left text-red-400/70 hover:text-red-400 hover:bg-red-500/8">
          <LogOut className="w-4 h-4"/> Sign Out
        </button>
      </div>
    </div>
  );

  // ── Dashboard ────────────────────────────────────────────────────
  const DashboardTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1">Dashboard</h2>
        <p className="text-sm text-[#4A4A6A]">Welcome back, {user.user_metadata?.full_name || user.email}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Media Posts',val:socialPosts.length,icon:<ImageIcon className="w-5 h-5"/>,color:'#3D1F6E'},
          {label:'Events',val:events.filter(e=>e.is_active).length,icon:<Calendar className="w-5 h-5"/>,color:'#1A3C8C'},
          {label:'Blog Posts',val:blogPosts.filter(b=>b.is_published).length,icon:<BookOpen className="w-5 h-5"/>,color:'#C9A84C'},
          {label:'Members',val:members.length,icon:<Users className="w-5 h-5"/>,color:'#2D7A4F'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#EEEAE4] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider">{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{background:s.color}}>
                {s.icon}
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-[#1A1A2E]">{s.val}</p>
          </div>
        ))}
      </div>
      {/* Recent members */}
      <div className="bg-white rounded-xl border border-[#EEEAE4] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">Recent Members</h3>
          <button onClick={()=>setTab('members')} className="text-xs text-[#C9A84C] hover:text-[#E8C97A]">View all →</button>
        </div>
        {members.slice(0,5).map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-[#EEEAE4] last:border-0">
            <div className="w-8 h-8 rounded-full bg-[#F5EDD9] border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
              {m.full_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">{m.full_name}</p>
              <p className="text-xs text-[#A8A6A0] truncate">{m.email} · {m.location}</p>
            </div>
            <p className="text-xs text-[#A8A6A0] whitespace-nowrap">{new Date(m.created_at||'').toLocaleDateString()}</p>
          </div>
        ))}
        {members.length === 0 && <p className="text-sm text-[#A8A6A0] text-center py-4">No members yet</p>}
      </div>
    </div>
  );

  // ── Social Posts ─────────────────────────────────────────────────
  const PostsTab = () => {
    const [form, setForm] = useState<Omit<SocialMediaPost,'id'|'created_at'>>({
      title:'',description:'',platform:'youtube',url:'',thumbnail:'',date:new Date().toISOString().split('T')[0]
    });
    const isEditing = !!editPost;

    useEffect(() => { if(editPost) setForm({title:editPost.title,description:editPost.description,platform:editPost.platform,url:editPost.url,thumbnail:editPost.thumbnail,date:editPost.date}); }, [editPost]);

    const save = async () => {
      if(!form.title||!form.url) { notify('error','Title and URL are required'); return; }
      const {error} = isEditing ? await supabase.from('social_media_posts').update(form).eq('id',editPost!.id) : await supabase.from('social_media_posts').insert([form]);
      if(error) { notify('error',error.message); return; }
      notify('success', isEditing?'Post updated!':'Post added!');
      setEditPost(null); setShowPostForm(false); fetchSocialPosts();
    };

    const del = async (id: string) => {
      if(!confirm('Delete this post?')) return;
      await supabase.from('social_media_posts').delete().eq('id',id);
      notify('success','Post deleted'); fetchSocialPosts();
    };

    const platformIcon = (p: string) => ({youtube:<Youtube className="w-4 h-4"/>,instagram:<Instagram className="w-4 h-4"/>,tiktok:<Music className="w-4 h-4"/>,facebook:<Facebook className="w-4 h-4"/>})[p] || null;

    const Form = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-[#EEEAE4]">
            <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">{isEditing?'Edit Post':'Add Media Post'}</h3>
            <button onClick={()=>{setEditPost(null);setShowPostForm(false);}} className="text-[#A8A6A0] hover:text-[#1A1A2E]"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-6 space-y-4">
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Title</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="input-field" placeholder="Post title" /></div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Platform</label>
              <select value={form.platform} onChange={e=>setForm(p=>({...p,platform:e.target.value as any}))} className="input-field">
                {['youtube','instagram','tiktok','facebook'].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">URL</label><input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} className="input-field" placeholder="https://..." /></div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Thumbnail URL</label><input value={form.thumbnail} onChange={e=>setForm(p=>({...p,thumbnail:e.target.value}))} className="input-field" placeholder="https://..." /></div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input-field resize-none" rows={3} placeholder="Post description" /></div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Date</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field" /></div>
          </div>
          <div className="flex gap-3 p-6 border-t border-[#EEEAE4]">
            <button onClick={()=>{setEditPost(null);setShowPostForm(false);}} className="flex-1 py-2.5 border border-[#E2E0DC] text-[#4A4A6A] rounded-lg text-sm font-medium hover:bg-[#F8F7F4] transition-all">Cancel</button>
            <button onClick={save} className="flex-1 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:opacity-90 transition-all">Save Post</button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Media Posts</h2>
          <button onClick={()=>{setEditPost(null);setShowPostForm(true);}} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4"/> Add Post
          </button>
        </div>
        {(showPostForm||editPost) && <Form />}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-[#EEEAE4] overflow-hidden">
              {post.thumbnail && <img src={post.thumbnail} alt={post.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                    style={{background:{youtube:'#dc2626',instagram:'#9333ea',tiktok:'#111',facebook:'#2563eb'}[post.platform]||'#666'}}>
                    {platformIcon(post.platform)} {post.platform}
                  </span>
                </div>
                <h4 className="font-semibold text-[#1A1A2E] text-sm mb-1 line-clamp-1">{post.title}</h4>
                <p className="text-xs text-[#A8A6A0] line-clamp-2 mb-3">{post.description}</p>
                <div className="flex gap-2">
                  <button onClick={()=>{setEditPost(post);setShowPostForm(false);}} className="flex-1 py-1.5 text-xs font-medium text-[#4A4A6A] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all flex items-center justify-center gap-1"><Edit className="w-3 h-3"/>Edit</button>
                  <button onClick={()=>del(post.id!)} className="flex-1 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center gap-1"><Trash2 className="w-3 h-3"/>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {socialPosts.length===0 && <div className="col-span-3 text-center py-12 text-[#A8A6A0] text-sm">No posts yet. Click "Add Post" to start.</div>}
        </div>
      </div>
    );
  };

  // ── Events ───────────────────────────────────────────────────────
  const EventsTab = () => {
    const blank = {title:'',description:'',date:'',time:'',location:'',flier_url:'',is_active:true};
    const [form, setForm] = useState<Omit<UpcomingEvent,'id'|'created_at'>>(blank);
    const [uploading, setUploading] = useState(false);
    const isEditing = !!editEvent;

    useEffect(() => {
      if(editEvent) setForm({title:editEvent.title,description:editEvent.description,date:editEvent.date,time:editEvent.time,location:editEvent.location,flier_url:editEvent.flier_url||'',is_active:editEvent.is_active});
    }, [editEvent]);

    const uploadFlier = async (file: File) => {
      setUploading(true);
      const name = `flier_${Date.now()}_${file.name}`;
      const {data,error} = await supabase.storage.from('event-fliers').upload(name,file,{upsert:true});
      setUploading(false);
      if(error) { notify('error',error.message); return; }
      const {data:{publicUrl}} = supabase.storage.from('event-fliers').getPublicUrl(name);
      setForm(p=>({...p,flier_url:publicUrl}));
      notify('success','Flier uploaded!');
    };

    const save = async () => {
      if(!form.title||!form.date) { notify('error','Title and date are required'); return; }
      const {error} = isEditing ? await supabase.from('upcoming_events').update(form).eq('id',editEvent!.id) : await supabase.from('upcoming_events').insert([form]);
      if(error) { notify('error',error.message); return; }
      notify('success', isEditing?'Event updated!':'Event added!');
      setEditEvent(null); setShowEventForm(false); setForm(blank); fetchEvents();
    };

    const del = async (id: string) => {
      if(!confirm('Delete this event?')) return;
      await supabase.from('upcoming_events').delete().eq('id',id);
      notify('success','Event deleted'); fetchEvents();
    };

    const toggle = async (id: string, val: boolean) => {
      await supabase.from('upcoming_events').update({is_active:!val}).eq('id',id);
      fetchEvents();
    };

    const Form = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-[#EEEAE4]">
            <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">{isEditing?'Edit Event':'Add Event'}</h3>
            <button onClick={()=>{setEditEvent(null);setShowEventForm(false);setForm(blank);}} className="text-[#A8A6A0] hover:text-[#1A1A2E]"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-6 space-y-4">
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Title</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="input-field" placeholder="Event title" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Date</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field" /></div>
              <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Time</label><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} className="input-field" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Location</label><input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} className="input-field" placeholder="Venue / location" /></div>
            <div><label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input-field resize-none" rows={3} placeholder="Event details" /></div>
            <div>
              <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Event Flier</label>
              <input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&uploadFlier(e.target.files[0])} className="hidden" id="flierInput" />
              <label htmlFor="flierInput" className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-[#E2E0DC] rounded-lg cursor-pointer text-sm text-[#A8A6A0] hover:border-[#C9A84C]/50 transition-all ${uploading?'opacity-50':''}`}>
                <Upload className="w-4 h-4"/> {uploading?'Uploading…':form.flier_url?'Replace Flier':'Upload Flier'}
              </label>
              {form.flier_url && <img src={form.flier_url} alt="Flier" className="mt-2 h-24 w-full object-cover rounded-lg" />}
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} className="rounded" />
              <label htmlFor="active" className="text-sm text-[#4A4A6A]">Publish event (visible to public)</label>
            </div>
          </div>
          <div className="flex gap-3 p-6 border-t border-[#EEEAE4]">
            <button onClick={()=>{setEditEvent(null);setShowEventForm(false);setForm(blank);}} className="flex-1 py-2.5 border border-[#E2E0DC] text-[#4A4A6A] rounded-lg text-sm font-medium hover:bg-[#F8F7F4] transition-all">Cancel</button>
            <button onClick={save} className="flex-1 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:opacity-90 transition-all">Save Event</button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Events</h2>
          <button onClick={()=>{setEditEvent(null);setShowEventForm(true);}} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4"/> Add Event
          </button>
        </div>
        {(showEventForm||editEvent) && <Form />}
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-[#EEEAE4] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {ev.flier_url && <img src={ev.flier_url} alt={ev.title} className="w-full sm:w-20 h-20 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-[#1A1A2E] text-sm truncate">{ev.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                    {ev.is_active?'Active':'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-[#A8A6A0]">{ev.date} · {ev.time} · {ev.location}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={()=>toggle(ev.id!,ev.is_active)} className="p-2 text-[#A8A6A0] hover:text-[#4A4A6A] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all">
                  {ev.is_active?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
                <button onClick={()=>{setEditEvent(ev);setShowEventForm(false);}} className="p-2 text-[#A8A6A0] hover:text-[#4A4A6A] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all">
                  <Edit className="w-4 h-4"/>
                </button>
                <button onClick={()=>del(ev.id!)} className="p-2 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-all">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
          {events.length===0 && <div className="text-center py-12 text-[#A8A6A0] text-sm">No events yet.</div>}
        </div>
      </div>
    );
  };

  // ── Blog ─────────────────────────────────────────────────────────
  const BlogTab = () => {
    const blank: Omit<BlogPost,'id'|'created_at'|'updated_at'> = {
      title:'', content:'', excerpt:'', media_url:'', media_type:'text',
      author_name:'RuggedYouth Team', tags:[], is_published:false, like_count:0
    };
    const [form, setForm] = useState<typeof blank>(blank);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [blogSearch, setBlogSearch] = useState('');
    const [viewComments, setViewComments] = useState<string|null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);
    const isEditing = !!editBlog;

    // Media type options
    const MEDIA_TYPES = [
      { value:'text',  label:'✍️ Text only' },
      { value:'image', label:'🖼️ Image / Photo' },
      { value:'video', label:'🎬 Video' },
      { value:'audio', label:'🎙️ Audio / Sermon' },
      { value:'flyer', label:'📋 Event Flyer' },
      { value:'link',  label:'🔗 External Link' },
    ];

    useEffect(() => {
      if (editBlog) setForm({
        title: editBlog.title, content: editBlog.content,
        excerpt: editBlog.excerpt||'', media_url: editBlog.media_url||'',
        media_type: editBlog.media_type||'text', author_name: editBlog.author_name||'RuggedYouth Team',
        tags: editBlog.tags||[], is_published: editBlog.is_published, like_count: editBlog.like_count||0
      });
    }, [editBlog]);

    const uploadFile = async (file: File) => {
      setUploading(true);
      setUploadProgress('Uploading…');
      const ext = file.name.split('.').pop()?.toLowerCase();
      const folder = file.type.startsWith('image') ? 'blog/images'
                   : file.type.startsWith('video') ? 'blog/videos'
                   : file.type.startsWith('audio') ? 'blog/audio'
                   : 'blog/files';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const {error} = await supabase.storage.from('event-fliers').upload(fileName, file, {upsert: true});
      if (error) { notify('error', error.message); setUploading(false); setUploadProgress(''); return; }
      const {data:{publicUrl}} = supabase.storage.from('event-fliers').getPublicUrl(fileName);
      const autoType = file.type.startsWith('image') ? (form.media_type === 'flyer' ? 'flyer' : 'image')
                     : file.type.startsWith('video') ? 'video'
                     : file.type.startsWith('audio') ? 'audio'
                     : 'text';
      setForm(p => ({...p, media_url: publicUrl, media_type: autoType as any}));
      setUploading(false);
      setUploadProgress('');
      notify('success', `${autoType} uploaded successfully!`);
    };

    const addTag = () => {
      if (tagInput.trim() && !(form.tags||[]).includes(tagInput.trim())) {
        setForm(p => ({...p, tags: [...(p.tags||[]), tagInput.trim()]}));
        setTagInput('');
      }
    };

    const save = async () => {
      if (!form.title.trim()) { notify('error', 'Title is required'); return; }
      if (form.media_type !== 'link' && !form.content.trim() && !form.media_url) {
        notify('error', 'Add some content, text, or media'); return;
      }
      const payload = {
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || form.content.trim().slice(0, 180) + (form.content.length > 180 ? '…' : ''),
        author_name: form.author_name.trim() || 'RuggedYouth Team',
      };
      const {error} = isEditing
        ? await supabase.from('blog_posts').update(payload).eq('id', editBlog!.id)
        : await supabase.from('blog_posts').insert([payload]);
      if (error) { notify('error', error.message); return; }
      notify('success', isEditing ? 'Post updated!' : payload.is_published ? 'Post published! 🎉' : 'Post saved as draft');
      setEditBlog(null); setShowBlogForm(false); setForm(blank); fetchBlogPosts();
    };

    const del = async (id: string) => {
      if (!confirm('Permanently delete this post and all its comments?')) return;
      await supabase.from('blog_comments').delete().eq('post_id', id);
      await supabase.from('blog_posts').delete().eq('id', id);
      notify('success', 'Post deleted');
      fetchBlogPosts();
    };

    const delComment = async (commentId: string) => {
      await supabase.from('blog_comments').delete().eq('id', commentId);
      setPostComments(prev => prev.filter(c => c.id !== commentId));
      notify('success', 'Comment removed');
    };

    const togglePublish = async (id: string, current: boolean) => {
      await supabase.from('blog_posts').update({is_published: !current}).eq('id', id);
      notify('success', current ? 'Post unpublished' : 'Post published! 🎉');
      fetchBlogPosts();
    };

    const loadComments = async (postId: string) => {
      const {data} = await supabase.from('blog_comments').select('*').eq('post_id', postId).order('created_at', {ascending: false});
      setPostComments(data || []);
      setViewComments(postId);
    };

    const filteredBlog = blogPosts.filter(p =>
      p.title.toLowerCase().includes(blogSearch.toLowerCase()) ||
      (p.author_name||'').toLowerCase().includes(blogSearch.toLowerCase())
    );

    // ── Form Modal ────────────────────────────────────────────────
    const Form = () => (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 bg-black/70 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-[#EEEAE4] sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1A1A2E]">{isEditing ? 'Edit Post' : 'New Blog Post'}</h3>
              <p className="text-xs text-[#A8A6A0] mt-0.5">Posts are permanent — only admins can delete</p>
            </div>
            <button onClick={() => {setEditBlog(null); setShowBlogForm(false); setForm(blank);}} className="text-[#A8A6A0] hover:text-[#1A1A2E] p-1.5 rounded-lg hover:bg-[#F8F7F4]">
              <X className="w-5 h-5"/>
            </button>
          </div>

          <div className="p-7 space-y-5">
            {/* Post type selector */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-2">Post Type</label>
              <div className="grid grid-cols-3 gap-2">
                {MEDIA_TYPES.map(mt => (
                  <button key={mt.value} type="button"
                    onClick={() => setForm(p => ({...p, media_type: mt.value as any, media_url: mt.value === 'link' ? p.media_url : (mt.value === 'text' ? '' : p.media_url)}))}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                      form.media_type === mt.value
                        ? 'border-[#C9A84C] bg-[#F5EDD9] text-[#8B6914]'
                        : 'border-[#E2E0DC] text-[#4A4A6A] hover:border-[#C9A84C]/40'
                    }`}>
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                className="input-field text-base font-semibold" placeholder="Give your post a great title…" />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Author</label>
              <input value={form.author_name} onChange={e => setForm(p => ({...p, author_name: e.target.value}))}
                className="input-field" placeholder="RuggedYouth Team" />
            </div>

            {/* Media upload — shown for image, video, audio, flyer */}
            {['image','video','audio','flyer'].includes(form.media_type) && (
              <div>
                <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">
                  {form.media_type === 'image' && 'Upload Image'}
                  {form.media_type === 'video' && 'Upload Video'}
                  {form.media_type === 'audio' && 'Upload Audio / Sermon'}
                  {form.media_type === 'flyer' && 'Upload Event Flyer'}
                </label>
                <input type="file"
                  accept={
                    form.media_type === 'video' ? 'video/*' :
                    form.media_type === 'audio' ? 'audio/*' :
                    'image/*'
                  }
                  onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
                  className="hidden" id="blogFileInput"
                />
                <label htmlFor="blogFileInput"
                  className={`flex flex-col items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    uploading ? 'opacity-60 pointer-events-none border-[#C9A84C]/40 bg-[#F5EDD9]/30' : 'border-[#E2E0DC] hover:border-[#C9A84C]/60 hover:bg-[#F5EDD9]/20'
                  }`}>
                  <Upload className={`w-6 h-6 ${uploading ? 'text-[#C9A84C] animate-bounce' : 'text-[#A8A6A0]'}`} />
                  <span className="text-sm text-[#A8A6A0] font-medium">
                    {uploading ? uploadProgress || 'Uploading to Supabase Storage…' : form.media_url ? 'Click to replace file' : 'Click to upload file'}
                  </span>
                  {!uploading && <span className="text-xs text-[#A8A6A0]/70">Files are permanently stored — never auto-deleted</span>}
                </label>
                {/* Preview */}
                {form.media_url && !uploading && (
                  <div className="mt-3">
                    {(form.media_type === 'image' || form.media_type === 'flyer') && (
                      <img src={form.media_url} alt="preview" className="w-full h-40 object-cover rounded-xl border border-[#EEEAE4]" />
                    )}
                    {form.media_type === 'video' && (
                      <video src={form.media_url} controls className="w-full h-40 rounded-xl bg-black" />
                    )}
                    {form.media_type === 'audio' && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <Headphones className="w-5 h-5 text-green-600" />
                        <audio src={form.media_url} controls className="flex-1 h-8" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">File uploaded successfully</span>
                      <button type="button" onClick={() => setForm(p => ({...p, media_url: ''}))}
                        className="ml-auto text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* External link */}
            {form.media_type === 'link' && (
              <div>
                <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">External URL *</label>
                <input value={form.media_url} onChange={e => setForm(p => ({...p, media_url: e.target.value}))}
                  className="input-field" type="url" placeholder="https://youtube.com/watch?v=…" />
                <p className="text-xs text-[#A8A6A0] mt-1">Paste a YouTube, SoundCloud, or any external link</p>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">
                {form.media_type === 'link' ? 'Description' : 'Content'}
                {form.media_type === 'text' && ' *'}
              </label>
              <textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))}
                className="input-field resize-none" rows={7}
                placeholder={
                  form.media_type === 'audio' ? 'Add a description, scripture reference, or key points from this message…' :
                  form.media_type === 'video' ? 'Add a description or key highlights from this video…' :
                  form.media_type === 'link' ? 'Tell your audience what this link is about…' :
                  form.media_type === 'flyer' ? 'Add event details, date, time, location…' :
                  'Write your message, devotional, or story here…'
                } />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Preview Excerpt <span className="normal-case text-[#C9A84C]/70">(auto if blank)</span></label>
              <textarea value={form.excerpt} onChange={e => setForm(p => ({...p, excerpt: e.target.value}))}
                className="input-field resize-none" rows={2} placeholder="Short teaser shown on the blog listing…" />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Tags</label>
              <div className="flex gap-2 mb-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                  className="input-field flex-1" placeholder="e.g. devotion, faith, youth — press Enter" />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-[#F5EDD9] text-[#8B6914] rounded-lg text-sm font-semibold hover:bg-[#EEEAE4] transition-all">+ Add</button>
              </div>
              {(form.tags||[]).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags!.map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#F5EDD9] text-[#8B6914] border border-[#C9A84C]/20 font-medium">
                      #{t}
                      <button onClick={() => setForm(p => ({...p, tags: p.tags?.filter(x => x !== t)}))} className="opacity-50 hover:opacity-100 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 bg-[#F8F7F4] rounded-xl border border-[#E2E0DC]">
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">{form.is_published ? '✅ Published — visible to everyone' : '📝 Draft — not visible yet'}</p>
                <p className="text-xs text-[#A8A6A0] mt-0.5">You can always publish or unpublish after saving</p>
              </div>
              <button type="button"
                onClick={() => setForm(p => ({...p, is_published: !p.is_published}))}
                className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${form.is_published ? 'bg-green-500' : 'bg-[#D1D5DB]'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_published ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-7 py-5 border-t border-[#EEEAE4] bg-[#F8F7F4] rounded-b-2xl">
            <button onClick={() => {setEditBlog(null); setShowBlogForm(false); setForm(blank);}}
              className="flex-1 py-2.5 border border-[#E2E0DC] bg-white text-[#4A4A6A] rounded-xl text-sm font-medium hover:bg-[#EEEAE4] transition-all">
              Cancel
            </button>
            <button onClick={save} disabled={uploading}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {isEditing ? 'Update Post' : form.is_published ? '🚀 Publish Now' : '💾 Save Draft'}
            </button>
          </div>
        </div>
      </div>
    );

    // ── Comments viewer modal ─────────────────────────────────────
    const CommentsModal = () => {
      const post = blogPosts.find(p => p.id === viewComments);
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEAE4]">
              <div>
                <h3 className="font-display text-base font-bold text-[#1A1A2E]">Comments</h3>
                <p className="text-xs text-[#A8A6A0] mt-0.5 line-clamp-1">{post?.title}</p>
              </div>
              <button onClick={() => setViewComments(null)} className="text-[#A8A6A0] hover:text-[#1A1A2E]"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {postComments.length === 0 ? (
                <p className="text-center text-sm text-[#A8A6A0] py-8">No comments on this post</p>
              ) : postComments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-[#C9A84C] font-bold text-sm flex-shrink-0">
                    {c.author_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 bg-[#F8F7F4] rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[#1A1A2E]">{c.author_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A8A6A0]">{new Date(c.created_at||'').toLocaleDateString()}</span>
                        <button onClick={() => delComment(c.id)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#4A4A6A]">{c.content}</p>
                    {c.author_email && <p className="text-xs text-[#A8A6A0] mt-1">{c.author_email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Blog Posts</h2>
            <p className="text-xs text-[#A8A6A0] mt-0.5">{blogPosts.filter(p=>p.is_published).length} published · {blogPosts.filter(p=>!p.is_published).length} drafts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A6A0]"/>
              <input value={blogSearch} onChange={e => setBlogSearch(e.target.value)}
                placeholder="Search posts…" className="pl-8 pr-3 py-2 border border-[#E2E0DC] rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] w-44" />
            </div>
            <button onClick={() => {setEditBlog(null); setShowBlogForm(true);}}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-xl text-sm font-bold hover:opacity-90 transition-all whitespace-nowrap">
              <Plus className="w-4 h-4"/> New Post
            </button>
          </div>
        </div>

        {(showBlogForm || editBlog) && <Form />}
        {viewComments && <CommentsModal />}

        {/* Posts list */}
        <div className="space-y-3">
          {filteredBlog.map(post => {
            const typeColors: Record<string,string> = {
              image:'bg-blue-50 text-blue-700', video:'bg-purple-50 text-purple-700',
              audio:'bg-green-50 text-green-700', text:'bg-[#F5EDD9] text-[#8B6914]',
              link:'bg-orange-50 text-orange-700', flyer:'bg-pink-50 text-pink-700',
            };
            return (
              <div key={post.id} className="bg-white rounded-xl border border-[#EEEAE4] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Thumbnail */}
                  {post.media_url && (post.media_type==='image'||post.media_type==='flyer') && (
                    <div className="w-full sm:w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#F8F7F4]">
                      <img src={post.media_url} alt={post.title} className="w-full h-full object-cover"/>
                    </div>
                  )}
                  {post.media_url && post.media_type==='video' && (
                    <div className="w-full sm:w-20 h-20 rounded-lg bg-[#0F0E1A] flex items-center justify-center flex-shrink-0">
                      <Play className="w-7 h-7 text-[#C9A84C]"/>
                    </div>
                  )}
                  {post.media_url && post.media_type==='audio' && (
                    <div className="w-full sm:w-20 h-20 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-7 h-7 text-green-600"/>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-[#1A1A2E] text-sm leading-tight">{post.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${post.is_published?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                        {post.is_published ? 'Live' : 'Draft'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${typeColors[post.media_type||'text']||'bg-gray-100 text-gray-500'}`}>
                        {post.media_type||'text'}
                      </span>
                    </div>
                    {post.excerpt && <p className="text-xs text-[#A8A6A0] line-clamp-1 mb-2">{post.excerpt}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A8A6A0]">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400"/> {post.like_count||0}</span>
                      <span>by {post.author_name}</span>
                      <span>{new Date(post.created_at||'').toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* View comments */}
                    <button onClick={() => loadComments(post.id!)}
                      className="p-2 text-[#A8A6A0] hover:text-[#3D1F6E] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all" title="View comments">
                      <MessageCircle className="w-4 h-4"/>
                    </button>
                    {/* Publish toggle */}
                    <button onClick={() => togglePublish(post.id!, post.is_published)}
                      className="p-2 text-[#A8A6A0] hover:text-[#4A4A6A] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all" title={post.is_published ? 'Unpublish' : 'Publish'}>
                      {post.is_published ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                    {/* Edit */}
                    <button onClick={() => {setEditBlog(post); setShowBlogForm(false);}}
                      className="p-2 text-[#A8A6A0] hover:text-[#4A4A6A] border border-[#E2E0DC] rounded-lg hover:bg-[#F8F7F4] transition-all" title="Edit">
                      <Edit className="w-4 h-4"/>
                    </button>
                    {/* Delete — intentional, admin-only */}
                    <button onClick={() => del(post.id!)}
                      className="p-2 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-all" title="Delete post">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredBlog.length === 0 && (
            <div className="text-center py-16 text-[#A8A6A0] text-sm">
              {blogSearch ? 'No posts match your search.' : 'No posts yet — click "New Post" to create your first one.'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Members ──────────────────────────────────────────────────────
  const MembersTab = () => {
    const [search, setSearch] = useState('');
    const filtered = members.filter(m =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.location?.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Members <span className="text-[#C9A84C] text-lg">({members.length})</span></h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A6A0]" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members..." className="w-full pl-9 pr-4 py-2 input-field text-sm" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#EEEAE4] overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-3 bg-[#F8F7F4] border-b border-[#EEEAE4]">
            {['Name','Email','Phone','Location'].map(h=><span key={h} className="text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider">{h}</span>)}
          </div>
          {filtered.map(m => (
            <div key={m.id} className="grid sm:grid-cols-4 gap-2 sm:gap-4 px-5 py-3.5 border-b border-[#EEEAE4] last:border-0 text-sm hover:bg-[#F8F7F4] transition-colors">
              <div className="flex items-center gap-2.5 col-span-full sm:col-span-1">
                <div className="w-8 h-8 rounded-full bg-[#F5EDD9] border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm flex-shrink-0">
                  {m.full_name?.[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-[#1A1A2E] truncate">{m.full_name}</span>
              </div>
              <span className="text-[#4A4A6A] truncate sm:col-span-1 text-xs sm:text-sm">{m.email}</span>
              <span className="text-[#4A4A6A] truncate sm:col-span-1 text-xs sm:text-sm">{m.phone}</span>
              <span className="text-[#4A4A6A] truncate sm:col-span-1 text-xs sm:text-sm">{m.location}</span>
            </div>
          ))}
          {filtered.length===0 && <div className="text-center py-10 text-[#A8A6A0] text-sm">No members found</div>}
        </div>
      </div>
    );
  };

  // ── Settings ─────────────────────────────────────────────────────
  const SettingsTab = () => (
    <div className="space-y-6 max-w-lg">
      <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Settings</h2>
      <div className="bg-white rounded-xl border border-[#EEEAE4] p-6">
        <h3 className="font-display text-lg font-semibold text-[#1A1A2E] mb-1">Account Info</h3>
        <p className="text-sm text-[#4A4A6A] mb-5">Signed in as <span className="font-medium text-[#1A1A2E]">{user.email}</span></p>
        <div className="flex items-center gap-3 mb-5 p-3 bg-[#F8F7F4] rounded-lg">
          <div className="w-10 h-10 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] font-bold">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E]">{user.user_metadata?.full_name||'Admin'}</p>
            <p className="text-xs text-[#A8A6A0]">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#EEEAE4] p-6">
        <h3 className="font-display text-lg font-semibold text-[#1A1A2E] mb-5">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A6A0]" />
              <input value={pwForm.newPw} onChange={e=>setPwForm(p=>({...p,newPw:e.target.value}))} type="password" placeholder="Min. 8 characters" className="input-field pl-10" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#A8A6A0] uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A6A0]" />
              <input value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} type="password" placeholder="Repeat new password" className="input-field pl-10" /></div>
          </div>
          <button type="submit" disabled={pwLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-[#1A1A2E] rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            <Key className="w-4 h-4"/> {pwLoading?'Saving...':'Update Password'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h3 className="font-display text-lg font-semibold text-[#1A1A2E] mb-3">Sign Out</h3>
        <p className="text-sm text-[#4A4A6A] mb-4">You'll be redirected to the login screen.</p>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all">
          <LogOut className="w-4 h-4"/> Sign Out
        </button>
      </div>
    </div>
  );

  const tabContent: Record<string, React.ReactNode> = {
    dashboard: <DashboardTab />,
    posts: <PostsTab />,
    events: <EventsTab />,
    blog: <BlogTab />,
    members: <MembersTab />,
    settings: <SettingsTab />,
  };

  return (
    <div className="min-h-screen flex bg-[#F8F7F4]">
      {notif && <Notif msg={notif} onClose={()=>setNotif(null)} />}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-shrink-0 lg:flex-col h-screen sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={()=>setSidebarOpen(false)} />
          <div className="relative w-60 h-full flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-[#EEEAE4] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-2 text-[#4A4A6A] hover:text-[#1A1A2E] border border-[#E2E0DC] rounded-lg">
              <Menu className="w-5 h-5"/>
            </button>
            <h1 className="font-display text-lg font-semibold text-[#1A1A2E] capitalize">
              {navItems.find(n=>n.id===tab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-[#C9A84C] font-medium hidden sm:block hover:text-[#E8C97A] transition-colors">
              View Site →
            </a>
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
              {user.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {tabContent[tab]}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
