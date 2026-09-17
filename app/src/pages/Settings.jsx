import { useState } from 'react';
import { useStore } from '../store/store';
import { useSync, DEFAULT_CFG } from '../store/sync';
import { testConnection } from '../store/github';
import { loadDevice, saveDevice } from '../store/storage';
import { setDevicePin, hasDevicePin } from '../store/pin';
import { pushSupported, getSubscription, subscribePush, unsubscribePush, sendTestPush, isIOS, isStandalone } from '../store/push';
import { NOTIFY_API } from '../push-config';
import { useEffect } from 'react';
import { PageHeader, Sheet, DangerButton, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const Row = ({ icon: Icon, label, sub, onClick, danger }) => (
  <button className="row pad" style={{ width: '100%', padding: '13px 0', color: danger ? 'var(--red)' : 'inherit', textAlign: 'left' }} onClick={onClick}>
    <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Icon size={20} className={danger ? '' : 'muted'} /><span><div>{label}</div>{sub && <div className="xs muted">{sub}</div>}</span></span>
    <Ic.ChevronRight size={18} className="muted" />
  </button>
);
const Field = ({ label, children, hint }) => <div className="field"><label>{label}</label>{children}{hint && <span className="xs muted">{hint}</span>}</div>;

export default function Settings() {
  const { state, updateSettings, reset, clearAll, addUser, updateUser, deleteUser } = useStore();
  const sync = useSync();
  const toast = useToast();
  const [sheet, setSheet] = useState(null);
  const [f, setF] = useState(state.settings);
  const [device, setDevice] = useState(() => loadDevice());
  const [pin, setPin] = useState({ a: '', b: '' });
  const [userName, setUserName] = useState('');
  const [sc, setSc] = useState(sync.cfg || DEFAULT_CFG);
  const [testing, setTesting] = useState(false);
  const [pushOn, setPushOn] = useState(null); // null: bilinmiyor
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => { getSubscription().then((s) => setPushOn(!!s)).catch(() => setPushOn(false)); }, []);
  const enablePush = async () => {
    if (!sync.enabled) return toast('Önce Bulut Senkron\'u bağlayın (abonelik buluta yazılır)');
    setPushBusy(true);
    try { await subscribePush(sync.cfg, activeUser?.name); setPushOn(true); toast('Anlık bildirimler açıldı'); }
    catch (e) { toast(e.message); } finally { setPushBusy(false); }
  };
  const disablePush = async () => { setPushBusy(true); try { await unsubscribePush(sync.cfg); setPushOn(false); toast('Anlık bildirimler kapatıldı'); } catch (e) { toast(e.message); } finally { setPushBusy(false); } };
  const testPush = async () => { setPushBusy(true); try { await sendTestPush(NOTIFY_API); toast('Test bildirimi gönderildi'); } catch (e) { toast(e.message); } finally { setPushBusy(false); } };
  const setScField = (k) => (e) => setSc({ ...sc, [k]: e.target.value.trim() });
  const setField = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const activeUser = state.users.find((u) => u.name === device.userName) || state.users[0];
  const saveSettings = () => { updateSettings({ ...f, kdv: +f.kdv || 0, overdueDays: +f.overdueDays || 30, defaultDueDays: +f.defaultDueDays || 30, invoiceSeq: +f.invoiceSeq || 1 }); toast('Kaydedildi'); setSheet(null); };
  const chooseUser = (u) => { setDevice(saveDevice({ userName: u.name })); toast(`Bu cihazda kullanıcı: ${u.name}`); };
  const savePin = async () => {
    if (pin.a.length < 4 || pin.a.length > 6) return toast('PIN 4-6 haneli olmalı');
    if (pin.a !== pin.b) return toast('PIN\'ler eşleşmiyor');
    await setDevicePin(pin.a); setPin({ a: '', b: '' }); setDevice(loadDevice()); toast('PIN ayarlandı'); setSheet(null);
  };
  const removePin = async () => { await setDevicePin(null); setDevice(loadDevice()); toast('PIN kaldırıldı'); setSheet(null); };

  const testSync = async () => {
    setTesting(true);
    try { const r = await testConnection(sc); toast(r.canWrite ? `Bağlandı: ${r.name}` : `Bağlandı ama yazma izni yok: ${r.name}`); }
    catch (e) { toast(`Bağlantı hatası: ${e.message}`); } finally { setTesting(false); }
  };
  const saveSync = () => { sync.setCfg(sc); toast('Senkron açıldı, veriler yükleniyor...'); setSheet(null); };
  const removeSync = () => { if (confirm('Bulut bağlantısı kaldırılsın mı? Veriler cihazda kalır.')) { sync.setCfg(null); setSc(DEFAULT_CFG); toast('Bağlantı kaldırıldı'); } };
  const lastSyncText = sync.meta.lastSync ? new Date(sync.meta.lastSync).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  const syncLabel = !sync.enabled ? 'Kapalı' : sync.status === 'syncing' ? 'Senkronize ediliyor...' : sync.status === 'error' ? `Hata: ${sync.error}` : sync.status === 'offline' ? 'Çevrimdışı, bekliyor' : sync.meta.dirty ? 'Bekleyen değişiklik var' : lastSyncText ? `Güncel · ${lastSyncText}` : 'Hazır';

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `greencup-yedek-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Yedek indirildi');
  };
  const importJson = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    file.text().then((txt) => { JSON.parse(txt); localStorage.setItem('greencup.app.v1', txt); location.reload(); }).catch(() => toast('Dosya okunamadı'));
  };

  return (
    <div className="page">
      <PageHeader title="Ayarlar" to="/daha" />
      <button className="card row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSheet('kullanici')}>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="avatar" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Ic.User size={22} /></span>
          <span><div className="bold">{activeUser?.name || state.settings.userName}</div><div className="small muted">Bu cihazın kullanıcısı · {activeUser?.role || ''}</div></span>
        </span><Ic.ChevronRight size={18} className="muted" />
      </button>
      <div className="card" style={{ marginTop: 12 }}>
        <Row icon={Ic.Building} label="Firma Bilgileri" sub="Ad, adres, VKN, KDV, vade, fatura no" onClick={() => { setF(state.settings); setSheet('firma'); }} />
        <Row icon={Ic.Users} label="Kullanıcı Yönetimi" sub={`${state.users.length} kullanıcı · hareketlerde kim girdi görünür`} onClick={() => setSheet('kullanici')} />
        <Row icon={Ic.Lock} label="PIN Kilidi" sub={hasDevicePin() ? 'Açık · bu cihazda' : 'Kapalı'} onClick={() => setSheet('pin')} />
        <Row icon={Ic.Cloud} label="Bulut Senkron (GitHub)" sub={syncLabel} onClick={() => setSheet('sync')} />
        <Row icon={Ic.FileText} label="Yedekleme (JSON)" onClick={() => setSheet('yedek')} />
        <Row icon={Ic.Bell} label="Anlık Bildirimler" sub={pushOn ? 'Açık · stok azalınca/tükenince' : 'Kapalı'} onClick={() => setSheet('bildirim')} />
        <Row icon={Ic.Info} label="Hakkında" onClick={() => setSheet('hakkinda')} />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <Row icon={Ic.Trash} label="Tümünü Temizle (boş başla)" danger onClick={() => {
          if (confirm('Tüm müşteriler, hareketler, ürünler, kasa ve ödemeler silinecek. Bulut senkron açıksa buluttaki veri de temizlenir. Emin misiniz?')) { clearAll(); toast('Tüm veriler temizlendi'); }
        }} />
        <Row icon={Ic.Box} label="Örnek Veriyi Yükle" onClick={() => { if (confirm('Mevcut veriler silinip örnek (demo) veri yüklenecek. Emin misiniz?')) { reset(); toast('Örnek veri yüklendi'); } }} />
      </div>

      {/* Firma */}
      <Sheet open={sheet === 'firma'} onClose={() => setSheet(null)} title="Firma Bilgileri">
        <Field label="Firma Adı"><div className="input"><input value={f.company || ''} onChange={setField('company')} /></div></Field>
        <Field label="Adres"><div className="input"><input value={f.companyAddress || ''} onChange={setField('companyAddress')} placeholder="Faturada görünür" /></div></Field>
        <Field label="Vergi No"><div className="input"><input value={f.taxNo || ''} onChange={setField('taxNo')} inputMode="numeric" /></div></Field>
        <div className="grid-2">
          <Field label="KDV (%)"><div className="input"><input inputMode="numeric" value={f.kdv ?? ''} onChange={setField('kdv')} /></div></Field>
          <Field label="Varsayılan Vade (gün)"><div className="input"><input inputMode="numeric" value={f.defaultDueDays ?? ''} onChange={setField('defaultDueDays')} /></div></Field>
        </div>
        <div className="grid-2">
          <Field label="Gecikme Eşiği (gün)" hint="Vadesi olmayan eski satışlar için"><div className="input"><input inputMode="numeric" value={f.overdueDays ?? ''} onChange={setField('overdueDays')} /></div></Field>
          <Field label="Sıradaki Fatura No"><div className="input"><input inputMode="numeric" value={f.invoiceSeq ?? ''} onChange={setField('invoiceSeq')} /></div></Field>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>Kaydet</button>
      </Sheet>

      {/* Kullanıcılar */}
      <Sheet open={sheet === 'kullanici'} onClose={() => setSheet(null)} title="Kullanıcı Yönetimi">
        <p className="small muted" style={{ marginBottom: 10 }}>Kullanıcı listesi tüm cihazlarda ortaktır. Her cihaz kendi kullanıcısını seçer; girilen hareketlerde bu ad görünür. Şifreli giriş için sunucu gerekir; cihaz güvenliği için PIN kilidini kullanın.</p>
        {state.users.map((u) => (
          <div key={u.id} className="opt-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ flex: 1, textAlign: 'left', fontWeight: u.name === activeUser?.name ? 700 : 400, color: u.name === activeUser?.name ? 'var(--green)' : 'inherit' }} onClick={() => chooseUser(u)}>
              {u.name} <span className="xs muted">· {u.role}</span>{u.name === activeUser?.name && <span className="xs" style={{ marginLeft: 6 }}>(bu cihaz)</span>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { const n = prompt('Ad', u.name); if (n?.trim()) updateUser(u.id, { name: n.trim() }); }}><Ic.Edit size={14} /></button>
            {state.users.length > 1 && <DangerButton message={`${u.name} silinsin mi? Geçmiş kayıtlardaki adı korunur.`} onConfirm={() => deleteUser(u.id)}><Ic.Trash size={14} /></DangerButton>}
          </div>
        ))}
        <div className="field" style={{ marginTop: 12 }}><label>Yeni Kullanıcı</label>
          <div className="input"><input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Ad Soyad" /><button className="btn btn-sm btn-primary" style={{ boxShadow: 'none' }} disabled={!userName.trim()} onClick={() => { addUser({ name: userName.trim() }); setUserName(''); toast('Kullanıcı eklendi'); }}>Ekle</button></div></div>
      </Sheet>

      {/* PIN */}
      <Sheet open={sheet === 'pin'} onClose={() => setSheet(null)} title="PIN Kilidi">
        <p className="small muted" style={{ marginBottom: 10 }}>Uygulama açılışında ve 5 dakika arka planda kaldıktan sonra PIN sorar. PIN yalnızca bu cihazda saklanır; her cihaz kendi PIN'ini belirler.</p>
        {hasDevicePin() && <button className="btn btn-ghost" style={{ marginBottom: 12, color: 'var(--red)' }} onClick={removePin}>PIN'i Kaldır</button>}
        <div className="grid-2">
          <Field label={hasDevicePin() ? 'Yeni PIN' : 'PIN (4-6 hane)'}><div className="input"><input type="password" inputMode="numeric" maxLength={6} value={pin.a} onChange={(e) => setPin({ ...pin, a: e.target.value.replace(/\D/g, '') })} /></div></Field>
          <Field label="Tekrar"><div className="input"><input type="password" inputMode="numeric" maxLength={6} value={pin.b} onChange={(e) => setPin({ ...pin, b: e.target.value.replace(/\D/g, '') })} /></div></Field>
        </div>
        <button className="btn btn-primary" onClick={savePin} disabled={pin.a.length < 4}>PIN'i Kaydet</button>
      </Sheet>

      {/* Bulut */}
      <Sheet open={sheet === 'sync'} onClose={() => setSheet(null)} title="Bulut Senkron (GitHub)">
        <p className="small muted" style={{ marginBottom: 10 }}>Veriler GitHub'daki repoda, <b>{sc.branch}</b> dalındaki <b>{sc.path}</b> dosyasında saklanır. Her değişiklik otomatik yazılır; iki cihaz aynı anda değiştirirse kayıtlar birleştirilir.</p>
        <div className="card small" style={{ marginBottom: 14, background: 'var(--green-light)', borderColor: 'var(--green-soft)' }}><div className="bold">Durum: {syncLabel}</div></div>
        <div className="grid-2">
          <Field label="Kullanıcı / Org"><div className="input"><input value={sc.owner} onChange={setScField('owner')} autoCapitalize="off" /></div></Field>
          <Field label="Repo"><div className="input"><input value={sc.repo} onChange={setScField('repo')} autoCapitalize="off" /></div></Field>
        </div>
        <div className="grid-2">
          <Field label="Dal"><div className="input"><input value={sc.branch} onChange={setScField('branch')} autoCapitalize="off" /></div></Field>
          <Field label="Dosya"><div className="input"><input value={sc.path} onChange={setScField('path')} autoCapitalize="off" /></div></Field>
        </div>
        <Field label="Erişim Token'ı" hint="GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → yalnızca bu repo, Contents: Read and write. Token sadece bu cihazda saklanır.">
          <div className="input"><input type="password" value={sc.token} onChange={setScField('token')} placeholder="github_pat_..." autoCapitalize="off" autoComplete="off" /></div></Field>
        <div className="stack">
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={testSync} disabled={testing || !sc.token}>{testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}</button>
            <button className="btn btn-primary" onClick={saveSync} disabled={!sc.token || !sc.owner || !sc.repo}>Kaydet ve Bağla</button>
          </div>
          {sync.enabled && <div className="btn-row"><button className="btn btn-ghost" onClick={() => sync.pull({ force: true })}>Buluttan Al</button><button className="btn btn-ghost" onClick={() => sync.push()}>Buluta Gönder</button></div>}
          {sync.enabled && <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={removeSync}>Bağlantıyı Kaldır</button>}
        </div>
      </Sheet>

      <Sheet open={sheet === 'yedek'} onClose={() => setSheet(null)} title="Yedekleme">
        <p className="small muted" style={{ marginBottom: 12 }}>Bulut senkron açıksa her değişiklik GitHub'a commit edilir ve dalın geçmişinden eski sürümlere dönülebilir. Ek olarak JSON yedek alıp başka cihazda geri yükleyebilirsiniz.</p>
        <div className="stack">
          <button className="btn btn-primary" onClick={exportJson}>Yedek İndir (JSON)</button>
          <label className="btn btn-ghost">Yedekten Geri Yükle<input type="file" accept="application/json" hidden onChange={importJson} /></label>
        </div>
      </Sheet>

      <Sheet open={sheet === 'bildirim'} onClose={() => setSheet(null)} title="Anlık Bildirimler">
        <p className="small muted" style={{ marginBottom: 10 }}>Bir ürünün satılabilir miktarı uyarı eşiğinin altına düştüğünde veya tükendiğinde, o anda tüm abone telefonlara bildirim gider; uygulama kapalıyken de. Eşiği Stok / Depo'da ürün kartından belirlersiniz (0 = yalnızca tükenince). Geciken alacak, vade ve ziyaret uyarıları uygulama içindeki zil simgesinde görünür.</p>
        {!pushSupported() && <div className="card small" style={{ marginBottom: 12 }}>Bu tarayıcı anlık bildirimi desteklemiyor.</div>}
        {isIOS() && !isStandalone() && <div className="card small" style={{ marginBottom: 12, background: 'var(--orange-bg)', borderColor: 'var(--orange-bg)' }}>iPhone'da bildirim için önce Safari'de <b>Paylaş → Ana Ekrana Ekle</b> yapın, sonra uygulamayı ana ekrandan açıp buradan bildirimleri açın.</div>}
        {!sync.enabled && <div className="card small" style={{ marginBottom: 12 }}>Abonelik buluta yazıldığı için önce <b>Bulut Senkron</b>'u bağlayın.</div>}
        <div className="stack">
          {pushOn
            ? <><button className="btn btn-ghost" onClick={testPush} disabled={pushBusy}>Test Bildirimi Gönder</button><button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={disablePush} disabled={pushBusy}>Bildirimleri Kapat</button></>
            : <button className="btn btn-primary" onClick={enablePush} disabled={pushBusy || !pushSupported()}>{pushBusy ? 'Açılıyor...' : 'Bildirimleri Aç'}</button>}
        </div>
        <p className="xs muted" style={{ marginTop: 12 }}>Bildirimi, değişikliği yapan cihaz üretir ve Vercel'deki /api/notify üzerinden tüm abone cihazlara iletilir. Veri girişi yapılan her cihazda Bulut Senkron bağlı olmalıdır.</p>
      </Sheet>

      <Sheet open={sheet === 'hakkinda'} onClose={() => setSheet(null)} title="Hakkında">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <img src="logo-greencup.png" alt="GreenCup" style={{ width: 140 }} />
          <div className="bold" style={{ marginTop: 10 }}>GreenCup Müşteri Takip</div>
          <div className="small muted">Müşteri Takip & Cari Yönetim Uygulaması · v0.2.0</div>
        </div>
      </Sheet>
    </div>
  );
}
