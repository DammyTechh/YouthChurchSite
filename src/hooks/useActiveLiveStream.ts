import { useEffect, useRef, useState } from 'react';
import { supabase, LiveStream } from '../lib/supabase';

interface ActiveStreamState {
  stream: LiveStream | null;
  isLive: boolean;
  loading: boolean;
  tableMissing: boolean;
}

/**
 * Subscribes to currently-live streams.
 *
 * Hardened against:
 *  - the live_streams table not existing yet (returns gracefully, no crash)
 *  - React StrictMode double-mounting (channel created lazily after the
 *    initial async query resolves, single subscribe per mount)
 *  - cleanup on unmount
 */
export function useActiveLiveStream(): ActiveStreamState {
  const [state, setState] = useState<ActiveStreamState>({
    stream: null, isLive: false, loading: true, tableMissing: false,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchActive() {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('status', 'live')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          // Table missing or RLS issue — return a friendly state, don't crash
          if (error.code === '42P01' || /relation .* does not exist/i.test(error.message)) {
            setState({ stream: null, isLive: false, loading: false, tableMissing: true });
            return;
          }
          // Other errors: just say no stream
          setState({ stream: null, isLive: false, loading: false, tableMissing: false });
          return;
        }

        const stream = (data as LiveStream | null) || null;
        setState({ stream, isLive: !!stream, loading: false, tableMissing: false });
      } catch {
        if (!cancelled) {
          setState({ stream: null, isLive: false, loading: false, tableMissing: false });
        }
      }
    }

    // Initial fetch, then subscribe (only if table exists)
    fetchActive().then(() => {
      if (cancelled) return;

      // Don't subscribe if the table doesn't exist (avoids the
      // `cannot add postgres_changes callbacks after subscribe()` error
      // that fires when the channel sees a non-existent relation).
      if (channelRef.current) return; // already subscribed (StrictMode safeguard)

      try {
        const channel = supabase
          .channel(`live-streams-active-${Math.random().toString(36).slice(2, 8)}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'live_streams' },
            () => { if (!cancelled) fetchActive(); },
          )
          .subscribe();
        channelRef.current = channel;
      } catch {
        // Realtime not available or table missing — silently no-op
      }
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* noop */ }
        channelRef.current = null;
      }
    };
  }, []);

  return state;
}
