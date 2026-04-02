import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ConfirmEmail = () => {
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const confirm = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        if (!token || !type) { setStatus('error'); setMessage('Invalid confirmation link.'); setTimeout(()=>navigate('/admin'),3000); return; }
        const {error} = await supabase.auth.verifyOtp({ token_hash:token, type:type as any });
        if (error) { setStatus('error'); setMessage(error.message); setTimeout(()=>navigate('/admin'),3000); }
        else { setStatus('success'); setMessage('Email confirmed! Redirecting to dashboard…'); setTimeout(()=>navigate('/admin'),2000); }
      } catch { setStatus('error'); setMessage('An unexpected error occurred.'); setTimeout(()=>navigate('/admin'),3000); }
    };
    confirm();
  }, [searchParams, navigate]);

  const colors = { loading:'text-white/60', success:'text-[#C9A84C]', error:'text-red-400' };

  return (
    <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-4" style={{backgroundImage:'radial-gradient(ellipse at 30% 40%, rgba(61,31,110,0.5) 0%, transparent 50%)'}}>
      <div className="w-full max-w-md text-center">
        <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth" className="w-16 h-16 rounded-2xl mx-auto mb-6 ring-2 ring-[#C9A84C]/30"/>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border" style={{
            background: status==='success'?'rgba(201,168,76,0.12)':status==='error'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)',
            borderColor: status==='success'?'rgba(201,168,76,0.3)':status==='error'?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.1)'
          }}>
            {status==='loading' && <Loader className="w-8 h-8 text-white/40 animate-spin"/>}
            {status==='success' && <CheckCircle className="w-8 h-8 text-[#C9A84C]"/>}
            {status==='error'   && <AlertCircle className="w-8 h-8 text-red-400"/>}
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-3">
            {status==='loading'&&'Confirming Email…'}{status==='success'&&'Email Confirmed!'}{status==='error'&&'Confirmation Failed'}
          </h1>
          <p className={`text-sm ${colors[status]}`}>{message || (status==='loading'?'Please wait while we verify your email…':'')}</p>
          {status!=='loading' && <p className="text-xs text-white/30 mt-4">You'll be redirected automatically…</p>}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
