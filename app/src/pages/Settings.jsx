import { useState } from 'react';
import { useStore } from '../store/store';
import { useSync, DEFAULT_CFG } from '../store/sync';
import { testConnection } from '../store/github';
import { PageHeader, Sheet, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const Row = ({ icon: Icon, label, onClick, danger }) => (
  <button className="row pad" style={{ width: '100%', padding: '13px 0', color: danger ? 'var(--red)' : 'inherit' }} onClick={onClick}>
    <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Icon size={20} className={danger ? '' : 'muted'} />{label}</span>
    <Ic.ChevronRight size={18} className="muted" />
  </button>
);

export default function Settings() {
  const { state, updateSettings, reset, clearAll } = useStore();
  const sync = useSync();
  const toast = useToast();
  const [sc, setSc] = useState(sync.cfg || DEFAULT_CFG);
  const [testing, setTesting] = useState(false);
  const setScField = (k) => (e) => setSc({ ...sc, [k]: e.target.value.trim() });

  const testSync = async () => {
    setTesting(true);
    try {
      const r = await testConnection(sc);
      toast(r.canWrite ? `Bağlandı: ${r.name}` : `Bağlandı ama yazma izni yok: ${r.name}`);
    } catch (e) { toast(`Bağlantı hatası: ${e.message}`); } finally { setTesting(false); }
  };
  const saveSync = () => { sync.setCfg(sc); toast('Senkron açıldı, veriler yükleniyor...'); setSheet(null); };
  const removeSync = () => { if (confirm('Bulut bağlantısı kaldırılsın mı? Veriler cihazda kalır.')) { sync.setCfg(null); setSc(DEFAULT_CFG); toast('Bağlantı kaldırıldı'); } };
  const lastSyncText = sync.meta.lastSync ? new Date(sync.meta.lastSync).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  const syncLabel = !sync.enabled ? 'Kapalı' : sync.status === 'syncing' ? 'Senkronize ediliyor...' : sync.status === 'error' ? `Hata: ${sync.error}` : sync.status === 'offline' ? 'Çevrimdışı, bekliyor' : sync.meta.dirty ? 'Bekleyen değişiklik var' : lastSyncText ? `Güncel · ${lastSyncText}` : 'Hazır';
  const [sheet, setSheet] = useState(null);
  const [f, setF] = useState(state.settings);

  const saveProfile = () => { updateSettings(f); toast('Kaydedildi'); setSheet(null); };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `greencup-yedek-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Yedek indirildi');
  };
  const importJson = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    file.text().then((txt) => { localStorage.setItem('greencup.app.v1', txt); location.reload(); }).catch(() => toast('Dosya okunamadı'));
  };

  return (
    <div className="page">
      <PageHeader title="Ayarlar" to="/daha" />
      <button className="card row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSheet('profil')}>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="avatar" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Ic.User size={22} /></span>
          <span><div className="bold">{state.settings.userName}</div><div className="small muted">{state.settings.userEmail}</div></span>
        </span><Ic.ChevronRight size={18} className="muted" />
      </button>
      <div className="card" style={{ marginTop: 12 }}>
        <Row icon={Ic.Building} label="Firma Bilgileri" onClick={() => setSheet('firma')} />
        <Row icon={Ic.Users} label="Kullanıcı Yönetimi" onClick={() => toast('Çoklu kullanıcı için sunucu bağlantısı gerekiyor (sonraki aşama)')} />
        <Row icon={Ic.Cloud} label={`Bulut Senkron (GitHub) · ${sync.enabled ? (sync.status === 'error' ? 'Hata' : 'Açık') : 'Kapalı'}`} onClick={() => setSheet('sync')} />
        <Row icon={Ic.FileText} label="Yedekleme (JSON)" onClick={() => setSheet('yedek')} />
        <Row icon={Ic.Bell} label="Bildirim Ayarları" onClick={() => setSheet('bildirim')} />
        <Row icon={Ic.Lock} label="Hesap Ayarları" onClick={() => toast('Giriş sistemi sonraki aşamada eklenecek')} />
        <Row icon={Ic.Info} label="Hakkında" onClick={() => setSheet('hakkinda')} />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <Row icon={Ic.Trash} label="Tümünü Temizle (boş başla)" danger onClick={() => {
          if (confirm('Tüm müşteriler, hareketler, ürünler, kasa ve ödemeler silinecek. Bulut senkron açıksa buluttaki veri de temizlenir. Emin misiniz?')) { clearAll(); toast('Tüm veriler temizlendi'); }
        }} />
        <Row icon={Ic.Box} label="Örnek Veriyi Yükle" onClick={() => { if (confirm('Mevcut veriler silinip örnek (demo) veri yüklenecek. Emin misiniz?')) { reset(); toast('Örnek veri yüklendi'); } }} />
      </div>

      <Sheet open={sheet === 'profil' || sheet === 'firma'} onClose={() => setSheet(null)} title={sheet === 'firma' ? 'Firma Bilgileri' : 'Profil'}>
        {sheet === 'profil' ? (
          <>
            <div className="field"><label>Ad Soyad</label><div className="input"><input value={f.userName} onChange={(e) => setF({ ...f, userName: e.target.value })} /></div></div>
            <div className="field"><label>E-posta</label><div className="input"><input value={f.userEmail} onChange={(e) => setF({ ...f, userEmail: e.target.value })} /></div></div>
          </>
        ) : (
          <>
            <div className="field"><label>Firma Adı</label><div className="input"><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div></div>
            <div className="field"><label>KDV Oranı (%)</label><div className="input"><input inputMode="numeric" value={f.kdv} onChange={(e) => setF({ ...f, kdv: parseInt(e.target.value || '0', 10) })} /></div></div>
            <div className="field"><label>Gecikme Eşiği (gün)</label><div className="input"><input inputMode="numeric" value={f.overdueDays} onChange={(e) => setF({ ...f, overdueDays: parseInt(e.target.value || '0', 10) })} /></div></div>
          </>
        )}
        <button className="btn btn-primary" onClick={saveProfile}>Kaydet</button>
      </Sheet>

      <Sheet open={sheet === 'sync'} onClose={() => setSheet(null)} title="Bulut Senkron (GitHub)">
        <p className="small muted" style={{ marginBottom: 10 }}>
          Veriler GitHub'daki repoda, <b>{sc.branch}</b> dalındaki <b>{sc.path}</b> dosyasında saklanır. Her değişiklik otomatik olarak oraya
          yazılır; başka bir cihazda aynı ayarları girince aynı veri gelir.
        </p>
        <div className="card small" style={{ marginBottom: 14, background: 'var(--green-light)', borderColor: 'var(--green-soft)' }}>
          <div className="bold">Durum: {syncLabel}</div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Kullanıcı / Org</label><div className="input"><input value={sc.owner} onChange={setScField('owner')} autoCapitalize="off" /></div></div>
          <div className="field"><label>Repo</label><div className="input"><input value={sc.repo} onChange={setScField('repo')} autoCapitalize="off" /></div></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Dal</label><div className="input"><input value={sc.branch} onChange={setScField('branch')} autoCapitalize="off" /></div></div>
          <div className="field"><label>Dosya</label><div className="input"><input value={sc.path} onChange={setScField('path')} autoCapitalize="off" /></div></div>
        </div>
        <div className="field"><label>Erişim Token'ı</label>
          <div className="input"><input type="password" value={sc.token} onChange={setScField('token')} placeholder="github_pat_..." autoCapitalize="off" autoComplete="off" /></div>
          <span className="xs muted">GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → yalnızca bu repo, <b>Contents: Read and write</b>. Token sadece bu cihazda saklanır.</span>
        </div>
        <div className="stack">
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={testSync} disabled={testing || !sc.token}>{testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}</button>
            <button className="btn btn-primary" onClick={saveSync} disabled={!sc.token || !sc.owner || !sc.repo}>Kaydet ve Bağla</button>
          </div>
          {sync.enabled && (
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => sync.pull({ force: true })}>Buluttan Al</button>
              <button className="btn btn-ghost" onClick={() => sync.push()}>Buluta Gönder</button>
            </div>
          )}
          {sync.enabled && <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={removeSync}>Bağlantıyı Kaldır</button>}
        </div>
      </Sheet>

      <Sheet open={sheet === 'yedek'} onClose={() => setSheet(null)} title="Yedekleme">
        <p className="small muted" style={{ marginBottom: 12 }}>Bulut senkron kapalıysa veriler yalnızca bu cihazda saklanır. JSON olarak yedek alabilir, başka cihazda geri yükleyebilirsiniz.</p>
        <div className="stack">
          <button className="btn btn-primary" onClick={exportJson}>Yedek İndir (JSON)</button>
          <label className="btn btn-ghost">Yedekten Geri Yükle<input type="file" accept="application/json" hidden onChange={importJson} /></label>
        </div>
      </Sheet>

      <Sheet open={sheet === 'bildirim'} onClose={() => setSheet(null)} title="Bildirim Ayarları">
        <p className="small muted">Geciken ödeme ve ziyaret hatırlatmaları, uygulama sunucuya bağlandığında anlık bildirim olarak gelecek. Şu an "Bugün" kartında gösteriliyor.</p>
      </Sheet>

      <Sheet open={sheet === 'hakkinda'} onClose={() => setSheet(null)} title="Hakkında">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <img src="icons/icon-192.png" alt="" style={{ width: 64, borderRadius: 16 }} />
          <div className="bold" style={{ marginTop: 10 }}>GreenCup Müşteri Takip</div>
          <div className="small muted">Müşteri Takip & Cari Yönetim Uygulaması · v0.1.0</div>
        </div>
      </Sheet>
    </div>
  );
}
