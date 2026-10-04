import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { periodSummary } from '../store/selectors';
import { UNITS, periodRange, shiftPeriod, lastPeriods } from '../utils/period';
import { fmtMoney, fmtNum, today, downloadCsv } from '../utils/format';
import { PageHeader, Segmented, Empty } from '../components/ui';
import * as Ic from '../components/Icons';

const COUNT = { day: 7, week: 8, month: 12, year: 5 };

/** Bir bölüm: başlık, toplam, gruplanmış satırlar (başlangıçta ilk 5, "tümünü göster" ile açılır). */
function Section({ title, icon: Icon, total, count, rows, unit = 'kayıt', tone, empty, children }) {
  const [all, setAll] = useState(false);
  const list = all ? rows : rows.slice(0, 5);
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 6 }}>
        <div className="card-title" style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><span className={`tl-icon ${tone || ''}`} style={{ width: 30, height: 30 }}><Icon size={15} /></span>{title}</div>
        <span className={`num ${tone === 'pay' ? 'pos' : tone === 'neg' ? 'neg' : ''}`} style={{ fontSize: 16 }}>{fmtMoney(total)}</span>
      </div>
      {count != null && <div className="xs muted" style={{ marginBottom: 4 }}>{count} {unit}</div>}
      {children}
      {list.map((g) => (
        <div key={g.key} className="row pad small">
          <span style={{ minWidth: 0 }}><div className="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</div>{g.count > 1 && <div className="xs muted">{g.count} kayıt · ort. {fmtMoney(g.amount / g.count)}</div>}</span>
          <span className="num" style={{ whiteSpace: 'nowrap' }}>{fmtMoney(g.amount)}{total > 0 && <span className="xs muted" style={{ marginLeft: 6 }}>%{Math.round((g.amount / total) * 100)}</span>}</span>
        </div>
      ))}
      {rows.length === 0 && <div className="muted small" style={{ padding: '6px 0' }}>{empty || 'Bu dönemde kayıt yok.'}</div>}
      {rows.length > 5 && <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setAll(!all)}>{all ? 'Daha az göster' : `Tümünü göster (${rows.length})`}</button>}
    </div>
  );
}

export default function Summary() {
  const { state } = useStore();
  const [params] = useSearchParams();
  const [unit, setUnit] = useState(params.get('d') || 'month');
  const [anchor, setAnchor] = useState(today());
  const range = periodRange(unit, anchor);
  const sum = useMemo(() => periodSummary(state, range.from, range.to), [state, range.from, range.to]);
  const series = useMemo(() => lastPeriods(unit, anchor, COUNT[unit]).map((p) => ({ ...p, s: periodSummary(state, p.from, p.to) })), [state, unit, anchor]);
  const isCurrent = range.to >= today();
  const [tab, setTab] = useState('acc'); // tahsilat kırılımı: hesap | müşteri

  const exportCsv = () => {
    const head = ['Dönem', 'Başlangıç', 'Bitiş', 'Satış', 'Tahsilat', 'Diğer Giriş', 'Gider', 'Net'];
    const rows = series.map((p) => [p.short, p.from, p.to, p.s.sales.total, p.s.payments.total, p.s.otherIn.total, p.s.expenses.total, p.s.net].map((v) => (typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v)));
    rows.push([], ['Seçili dönem', range.from, range.to], ['Giderler (başlığa göre)'], ...sum.expenses.byTitle.map((g) => [g.label, g.count, g.amount.toFixed(2).replace('.', ',')]), ['Tahsilatlar (hesaba göre)'], ...sum.payments.byAccount.map((g) => [g.label, g.count, g.amount.toFixed(2).replace('.', ',')]), ['Satışlar (müşteriye göre)'], ...sum.sales.byCustomer.map((g) => [g.label, g.count, g.amount.toFixed(2).replace('.', ',')]));
    downloadCsv(`gelir-gider_${UNITS.find((u) => u.value === unit).label}_${range.from}_${range.to}.csv`, [head, ...rows]);
  };
  const max = Math.max(1, ...series.map((p) => Math.max(p.s.cashIn, p.s.cashOut)));

  return (
    <div className="page">
      <PageHeader title="Gelir-Gider Özeti" to="/daha" right={<button className="icon-btn" onClick={exportCsv} aria-label="CSV indir"><Ic.FileText size={18} /></button>} />
      <Segmented value={unit} onChange={(v) => { setUnit(v); setAnchor(today()); }} options={UNITS} light />
      <div className="row" style={{ margin: '12px 0 10px' }}>
        <button className="icon-btn" onClick={() => setAnchor(shiftPeriod(unit, anchor, -1))} aria-label="Önceki dönem"><Ic.ChevronLeft size={20} /></button>
        <div style={{ textAlign: 'center' }}><div className="bold" style={{ fontSize: 16 }}>{range.label}</div>{!isCurrent && <button className="xs" style={{ color: 'var(--green)', fontWeight: 700 }} onClick={() => setAnchor(today())}>Bugüne dön</button>}</div>
        <button className="icon-btn" onClick={() => setAnchor(shiftPeriod(unit, anchor, 1))} aria-label="Sonraki dönem" disabled={isCurrent}><Ic.ChevronRight size={20} /></button>
      </div>

      <div className="grid-2">
        <div className="stat" style={{ minHeight: 0 }}><div className="stat-head"><span className="stat-icon"><Ic.Truck size={14} /></span>Satış</div><div className="stat-value" style={{ fontSize: 22 }}>{fmtMoney(sum.sales.total)}</div><div className="stat-sub">{sum.sales.count} satış{sum.sales.invoiced > 0 ? ` · ${fmtMoney(sum.sales.invoiced)} faturalı` : ''}</div></div>
        <div className="stat" style={{ minHeight: 0, background: 'linear-gradient(135deg, var(--blue), #1d4ed8)' }}><div className="stat-head"><span className="stat-icon"><Ic.Cash size={14} /></span>Tahsilat</div><div className="stat-value" style={{ fontSize: 22 }}>{fmtMoney(sum.payments.total)}</div><div className="stat-sub">{sum.payments.count} tahsilat{sum.otherIn.total > 0 ? ` · +${fmtMoney(sum.otherIn.total)} diğer giriş` : ''}</div></div>
        <div className="stat" style={{ minHeight: 0, background: 'linear-gradient(135deg, #b91c1c, #ef4444)' }}><div className="stat-head"><span className="stat-icon"><Ic.ArrowUp size={14} /></span>Gider</div><div className="stat-value" style={{ fontSize: 22 }}>{fmtMoney(sum.expenses.total)}</div><div className="stat-sub">{sum.expenses.count} ödeme</div></div>
        <div className="stat" style={{ minHeight: 0, background: sum.net >= 0 ? 'linear-gradient(135deg, #0f766e, #14b8a6)' : 'linear-gradient(135deg, #7c2d12, #ea580c)' }}><div className="stat-head"><span className="stat-icon"><Ic.Wallet size={14} /></span>Net Kasa</div><div className="stat-value" style={{ fontSize: 22 }}>{fmtMoney(sum.net, true)}</div><div className="stat-sub">giriş {fmtMoney(sum.cashIn)} − çıkış {fmtMoney(sum.cashOut)}</div></div>
      </div>

      <h2 className="section-title">Son {COUNT[unit]} {UNITS.find((u) => u.value === unit).label.replace('lık', '').replace('lik', '').toLocaleLowerCase('tr-TR')}{unit === 'day' ? ' gün' : unit === 'week' ? ' hafta' : unit === 'month' ? ' ay' : ' yıl'}</h2>
      <div className="card" style={{ padding: '6px 12px' }}>
        <table className="table" style={{ fontSize: 13 }}>
          <thead><tr><th>Dönem</th><th>Satış</th><th>Tahsilat</th><th>Gider</th><th>Net</th></tr></thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.from} onClick={() => setAnchor(p.from)} style={p.from === range.from ? { background: 'var(--green-light)' } : {}}>
                <td className="name" style={{ display: 'table-cell' }}>{p.short}<div style={{ display: 'flex', gap: 2, marginTop: 3, height: 4 }}><i style={{ width: `${(p.s.cashIn / max) * 60}%`, background: 'var(--blue)', borderRadius: 2 }} /><i style={{ width: `${(p.s.cashOut / max) * 60}%`, background: 'var(--red)', borderRadius: 2 }} /></div></td>
                <td>{fmtNum(Math.round(p.s.sales.total))}</td><td className="pos">{fmtNum(Math.round(p.s.payments.total + p.s.otherIn.total))}</td><td className="neg">{fmtNum(Math.round(p.s.expenses.total))}</td><td className={`bold ${p.s.net < 0 ? 'neg' : ''}`}>{fmtNum(Math.round(p.s.net))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="xs muted" style={{ padding: '6px 2px' }}>Satıra dokununca o dönemin ayrıntısı açılır. Tutarlar ₺, yuvarlanmış.</div>
      </div>

      <h2 className="section-title">{range.label} · Bölümler</h2>
      <Section title="Satışlar" icon={Ic.Truck} total={sum.sales.total} count={sum.sales.count} unit="satış" rows={sum.sales.byCustomer} empty="Bu dönemde satış yok.">
        {sum.sales.cashSales > 0 && <div className="xs muted" style={{ marginBottom: 4 }}>Peşin {fmtMoney(sum.sales.cashSales)} · vadeli {fmtMoney(sum.sales.total - sum.sales.cashSales)}{sum.debts.total > 0 ? ` · ayrıca ${fmtMoney(sum.debts.total)} elle borç kaydı` : ''}</div>}
      </Section>
      <Section title="Tahsilatlar" icon={Ic.Cash} tone="pay" total={sum.payments.total} count={sum.payments.count} unit="tahsilat" rows={tab === 'acc' ? sum.payments.byAccount : sum.payments.byCustomer} empty="Bu dönemde tahsilat yok.">
        <div className="chips" style={{ marginBottom: 6 }}><button className={`chip ${tab === 'acc' ? 'active' : ''}`} onClick={() => setTab('acc')}>Hesaba göre</button><button className={`chip ${tab === 'cus' ? 'active' : ''}`} onClick={() => setTab('cus')}>Müşteriye göre</button></div>
      </Section>
      <Section title="Giderler" icon={Ic.ArrowUp} tone="neg" total={sum.expenses.total} count={sum.expenses.count} unit="ödeme" rows={sum.expenses.byTitle} empty="Bu dönemde gider yok.">
        {sum.expenses.byAccount.length > 0 && <div className="xs muted" style={{ marginBottom: 4 }}>Hesaba göre: {sum.expenses.byAccount.map((g) => `${g.label} ${fmtMoney(g.amount)}`).join(' · ')}</div>}
      </Section>
      {sum.otherIn.total > 0 && <Section title="Diğer Kasa Girişleri" icon={Ic.ArrowDown} tone="pay" total={sum.otherIn.total} count={sum.otherIn.count} unit="hareket" rows={sum.otherIn.byTitle} />}
      {sum.sales.count + sum.payments.count + sum.expenses.count + sum.otherIn.count === 0 && <Empty icon={Ic.BarChart}>Bu dönemde hareket yok. Ok tuşlarıyla başka döneme geçin.</Empty>}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={exportCsv}>Excel (CSV) İndir</button>
        <Link to="/daha/raporlar" className="btn btn-outline">Ayrıntılı Raporlar</Link>
      </div>
    </div>
  );
}
