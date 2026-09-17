import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store';
import { normalizeState } from './seed';
import { mergeStates } from './merge';
import { fetchDb, pushDb, createDb, GithubError } from './github';
import { newAlerts } from './alerts';
import { notifyAll } from './push';
import { NOTIFY_API } from '../push-config';
export { DEFAULT_CFG } from './github';

// Senkron ayarları (token dahil) sadece bu cihazda, uygulama verisinden ayrı saklanır.
const CFG_KEY = 'greencup.sync.cfg.v1';
const META_KEY = 'greencup.sync.meta.v1';

const readJson = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } };

const SyncCtx = createContext(null);

export function SyncProvider({ children }) {
  const { state, replaceState } = useStore();
  const [cfg, setCfgState] = useState(() => readJson(CFG_KEY, null));
  const [meta, setMetaState] = useState(() => readJson(META_KEY, { sha: null, dirty: false, lastSync: null }));
  const [status, setStatus] = useState('idle'); // idle | syncing | error | offline
  const [error, setError] = useState(null);

  const metaRef = useRef(meta);
  const setMeta = useCallback((patch) => {
    metaRef.current = { ...metaRef.current, ...patch };
    setMetaState(metaRef.current); writeJson(META_KEY, metaRef.current);
  }, []);
  const cfgRef = useRef(cfg);
  const stateRef = useRef(state);
  useEffect(() => { cfgRef.current = cfg; stateRef.current = state; }, [cfg, state]);
  const appliedRef = useRef(null);   // uzaktan uygulanan state (dirty sayılmasın)
  const seenRef = useRef(state);     // son işlenen state
  const timerRef = useRef(null);
  const busyRef = useRef(false);

  const enabled = !!(cfg && cfg.token && cfg.owner && cfg.repo && cfg.path);

  const fail = useCallback((e) => {
    const msg = e instanceof GithubError
      ? (e.status === 401 ? 'Token geçersiz' : e.status === 403 ? 'Yetki yok (token izinlerini kontrol edin)' : e.status === 404 ? 'Repo bulunamadı' : e.message)
      : (navigator.onLine ? e.message : 'Çevrimdışı');
    setError(msg); setStatus(navigator.onLine ? 'error' : 'offline');
  }, []);

  const apply = useCallback((data) => {
    const next = normalizeState(data);
    appliedRef.current = next; seenRef.current = next;
    replaceState(next);
    return next;
  }, [replaceState]);

  /** Yereli buluta yazar. sha çakışırsa (başka cihaz yazmış) iki sürümü birleştirip tekrar dener. */
  const push = useCallback(async () => {
    const c = cfgRef.current; if (!c?.token || busyRef.current) return;
    busyRef.current = true; setStatus('syncing'); setError(null);
    clearTimeout(timerRef.current);
    try {
      let sha = metaRef.current.sha;
      try {
        sha = await pushDb(c, stateRef.current, sha);
      } catch (e) {
        if (e instanceof GithubError && (e.status === 409 || e.status === 422)) {
          const remote = await fetchDb(c);
          const merged = remote.data ? mergeStates(stateRef.current, normalizeState(remote.data)) : stateRef.current;
          stateRef.current = merged; apply(merged);
          sha = await pushDb(c, merged, remote.sha);
        } else throw e;
      }
      setMeta({ sha, dirty: false, lastSync: new Date().toISOString() }); setStatus('idle');
    } catch (e) { fail(e); } finally { busyRef.current = false; }
  }, [apply, fail, setMeta]);

  /** Buluttakini okur. Yerelde bekleyen değişiklik yoksa uygular; varsa birleştirip yazar. */
  const pull = useCallback(async ({ force = false } = {}) => {
    const c = cfgRef.current; if (!c?.token || busyRef.current) return;
    busyRef.current = true; setStatus('syncing'); setError(null);
    try {
      const remote = await fetchDb(c);
      if (!remote.data) {                        // dosya/dal yok: ilk kurulum, yereli yükle
        const sha = await createDb(c, stateRef.current);
        setMeta({ sha, dirty: false, lastSync: new Date().toISOString() }); setStatus('idle');
        return;
      }
      if (metaRef.current.dirty && !force) {     // yerelde bekleyen değişiklik var
        if (remote.sha !== metaRef.current.sha) { // ve bulut da değişmiş: birleştir
          const merged = mergeStates(stateRef.current, normalizeState(remote.data));
          stateRef.current = merged; apply(merged);
          const sha = await pushDb(c, merged, remote.sha);
          setMeta({ sha, dirty: false, lastSync: new Date().toISOString() }); setStatus('idle');
          return;
        }
        busyRef.current = false; await push(); return;
      }
      if (remote.sha !== metaRef.current.sha || force) apply(remote.data);
      setMeta({ sha: remote.sha, dirty: false, lastSync: new Date().toISOString() }); setStatus('idle');
    } catch (e) { fail(e); } finally { busyRef.current = false; }
  }, [apply, fail, push, setMeta]);

  // Yerel değişiklik → kirli işaretle ve kısa gecikmeyle yaz
  useEffect(() => {
    if (seenRef.current === state) return;
    const prev = seenRef.current;
    seenRef.current = state;
    if (appliedRef.current === state) return;
    if (!enabled) return;
    // Olaya bağlı anlık bildirimler (yalnızca bu cihazda yapılan değişiklikler için; uzaktan gelenler tekrar bildirilmez)
    for (const a of newAlerts(prev, state)) notifyAll(cfgRef.current, NOTIFY_API, a).catch(() => {});
    metaRef.current = { ...metaRef.current, dirty: true }; writeJson(META_KEY, metaRef.current);
    const uiTimer = setTimeout(() => setMetaState(metaRef.current), 0);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(), 1500);
    return () => { clearTimeout(uiTimer); clearTimeout(timerRef.current); };
  }, [state, enabled, push]);

  // Açılışta ve uygulamaya geri dönünce bulutu kontrol et; internet gelince bekleyeni yaz
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(() => pull(), 0);
    let last = Date.now();
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - last > 20000) { last = Date.now(); pull(); } };
    const onOnline = () => { if (metaRef.current.dirty) push(); else pull(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => { clearTimeout(first); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', onOnline); };
  }, [enabled, pull, push]);

  const setCfg = useCallback((next) => {
    setCfgState(next);
    if (next) writeJson(CFG_KEY, next); else { try { localStorage.removeItem(CFG_KEY); } catch { /* noop */ } }
    setMeta({ sha: null, dirty: false, lastSync: null }); setStatus('idle'); setError(null);
  }, [setMeta]);

  const value = useMemo(() => ({ cfg, setCfg, enabled, status, error, meta, pull, push }), [cfg, setCfg, enabled, status, error, meta, pull, push]);
  return <SyncCtx.Provider value={value}>{children}</SyncCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSync = () => useContext(SyncCtx);
