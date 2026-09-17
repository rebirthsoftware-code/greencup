import { useEffect, useState } from 'react';

/** Sayıyı 0'dan hedefe kısa sürede artırarak gösterir (hareket azaltma açıksa anında). */
export function useCountUp(target, ms = 650) {
  const [v, setV] = useState(target);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf;
    if (reduce || !Number.isFinite(target)) { raf = requestAnimationFrame(() => setV(target)); return () => cancelAnimationFrame(raf); }
    const from = 0; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - p, 3); setV(from + (target - from) * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Hafif dokunsal geri bildirim (Android). */
export const tap = () => { try { navigator.vibrate?.(8); } catch { /* noop */ } };
