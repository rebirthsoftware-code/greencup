import { useState } from 'react';
import { fmtMoney } from '../utils/format';

// Aylık iki serili çubuk grafik (inline SVG). Renkler: marka yeşili + mavi (CVD doğrulandı).
const SERIES = [{ key: 'sales', label: 'Satış', color: '#0E6B3F' }, { key: 'payments', label: 'Tahsilat', color: '#2A6FDB' }];

export default function BarChart({ data, height = 180 }) {
  const [hover, setHover] = useState(null);
  const W = 360, H = height, padL = 8, padR = 8, padT = 22, padB = 24;
  const max = Math.max(1, ...data.flatMap((d) => SERIES.map((s) => d[s.key])));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const groupW = (W - padL - padR) / data.length;
  const barW = Math.min(22, (groupW - 12) / SERIES.length);
  const y = (v) => padT + (H - padT - padB) * (1 - v / top);
  const short = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Aylık satış ve tahsilat">
        {[0.5, 1].map((f) => <g key={f}><line x1={padL} x2={W - padR} y1={y(top * f)} y2={y(top * f)} stroke="var(--border)" /><text x={padL} y={y(top * f) - 4} fontSize="10" fill="var(--text-3)">₺{short(top * f)}</text></g>)}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {data.map((d, i) => {
          const gx = padL + i * groupW + (groupW - barW * SERIES.length - 2) / 2;
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
              <rect x={padL + i * groupW} y={padT} width={groupW} height={H - padT - padB} fill="transparent" />
              {SERIES.map((s, k) => {
                const v = d[s.key]; const h = Math.max(0, y(0) - y(v));
                return <rect key={s.key} x={gx + k * (barW + 2)} y={y(v)} width={barW} height={h} rx={h > 4 ? 4 : 0} fill={s.color} opacity={hover == null || hover === i ? 1 : 0.45} />;
              })}
              <text x={padL + i * groupW + groupW / 2} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--text-2)">{d.label}</text>
            </g>
          );
        })}
        {hover != null && (() => {
          const d = data[hover]; const cx = padL + hover * groupW + groupW / 2; const bw = 118; const bx = Math.min(W - padR - bw, Math.max(padL, cx - bw / 2));
          return (
            <g>
              <rect x={bx} y={2} width={bw} height={40} rx="6" fill="var(--text)" />
              {SERIES.map((s, k) => <text key={s.key} x={bx + 8} y={17 + k * 15} fontSize="11" fill="var(--bg)"><tspan fill={s.color}>■</tspan> {s.label}: {fmtMoney(d[s.key])}</text>)}
            </g>
          );
        })()}
      </svg>
      <div className="chart-legend">{SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}</div>
    </div>
  );
}
