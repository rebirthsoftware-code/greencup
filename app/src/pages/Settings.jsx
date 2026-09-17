import { useState } from 'react';
import { useStore } from '../store/store';
import { PageHeader, Sheet, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const Row = ({ icon: Icon, label, onClick, danger }) => (
  <button className="row pad" style={{ width: '100%', padding: '13px 0', color: danger ? 'var(--red)' : 'inherit' }} onClick={onClick}>
    <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Icon size={20} className={danger ? '' : 'muted'} />{label}</span>
    <Ic.ChevronRight size={18} className="muted" />
  </button>
);

export default function Settings() {
  const { state, updateSettings, reset } = useStore();
  const toast = useToast();
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
        <Row icon={Ic.Cloud} label="Yedekleme" onClick={() => setSheet('yedek')} />
        <Row icon={Ic.Bell} label="Bildirim Ayarları" onClick={() => setSheet('bildirim')} />
        <Row icon={Ic.Lock} label="Hesap Ayarları" onClick={() => toast('Giriş sistemi sonraki aşamada eklenecek')} />
        <Row icon={Ic.Info} label="Hakkında" onClick={() => setSheet('hakkinda')} />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <Row icon={Ic.Trash} label="Verileri Sıfırla (demo veriye dön)" danger onClick={() => { if (confirm('Tüm veriler silinip örnek veri yüklenecek. Emin misiniz?')) { reset(); toast('Veriler sıfırlandı'); } }} />
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

      <Sheet open={sheet === 'yedek'} onClose={() => setSheet(null)} title="Yedekleme">
        <p className="small muted" style={{ marginBottom: 12 }}>Veriler şu an bu cihazda saklanıyor. JSON olarak yedek alabilir, başka cihazda geri yükleyebilirsiniz.</p>
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
          <img src="/icons/icon-192.png" alt="" style={{ width: 64, borderRadius: 16 }} />
          <div className="bold" style={{ marginTop: 10 }}>GreenCup Müşteri Takip</div>
          <div className="small muted">Müşteri Takip & Cari Yönetim Uygulaması · v0.1.0</div>
        </div>
      </Sheet>
    </div>
  );
}
