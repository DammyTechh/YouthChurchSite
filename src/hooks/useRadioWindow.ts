import { useEffect, useState } from 'react';

/**
 * Window when the radio play button is unlocked: 05:14 → 05:31 Africa/Lagos.
 * After 05:30 the live broadcast ends — at 05:31 the button locks again.
 *
 * Uses Intl.DateTimeFormat to read the current Lagos-local time, so it works
 * correctly regardless of the user's device timezone.
 */
const TZ = 'Africa/Lagos';
const OPEN_HOUR = 5;
const OPEN_MIN = 14;
const CLOSE_HOUR = 5;
const CLOSE_MIN = 31; // exclusive

interface RadioWindowState {
  isLive: boolean;
  nowHour: number;
  nowMin: number;
  nowSec: number;
  todayDate: string;
  nextOpenLabel: string;
  millisUntilOpen: number;
}

function readLagosTime(): { y: number; m: number; d: number; h: number; min: number; s: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || '0', 10);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute'), s: get('second') };
}

function lagosToUtcMillis(y: number, m: number, d: number, h: number, min: number, s: number): number {
  // Africa/Lagos is UTC+1 year-round (no DST). Compute UTC equivalent.
  return Date.UTC(y, m - 1, d, h - 1, min, s);
}

export function useRadioWindow(): RadioWindowState {
  const [now, setNow] = useState(() => readLagosTime());

  useEffect(() => {
    const id = setInterval(() => setNow(readLagosTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const minsNow = now.h * 60 + now.min;
  const minsOpen = OPEN_HOUR * 60 + OPEN_MIN;
  const minsClose = CLOSE_HOUR * 60 + CLOSE_MIN;
  const isLive = minsNow >= minsOpen && minsNow < minsClose;

  // next open: today if before window, otherwise tomorrow
  const nowUtc = lagosToUtcMillis(now.y, now.m, now.d, now.h, now.min, now.s);
  const todayOpenUtc = lagosToUtcMillis(now.y, now.m, now.d, OPEN_HOUR, OPEN_MIN, 0);
  let nextOpenUtc = todayOpenUtc;
  if (nowUtc >= todayOpenUtc) nextOpenUtc = todayOpenUtc + 24 * 60 * 60 * 1000;
  const millisUntilOpen = Math.max(0, nextOpenUtc - nowUtc);

  // friendly label like "Tomorrow 5:14 AM" or "Today 5:14 AM"
  const isToday = nextOpenUtc === todayOpenUtc;
  const nextOpenLabel = `${isToday ? 'Today' : 'Tomorrow'} 5:14 AM (Lagos)`;

  const todayDate = `${now.y}-${String(now.m).padStart(2, '0')}-${String(now.d).padStart(2, '0')}`;

  return {
    isLive,
    nowHour: now.h,
    nowMin: now.min,
    nowSec: now.s,
    todayDate,
    nextOpenLabel,
    millisUntilOpen,
  };
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
