import { theme } from '../lib/styles'

// Donut chart with a full legend. Every label is listed in the legend
// (name — count · %), so nothing is hidden even with many small slices.
export default function PieChart({ data, size = 150, thickness = 24, centerLabel }) {
  const items = data.filter(d => d.value > 0)
  const total = items.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r

  let offset = 0
  const segments = items.map(d => {
    const len = (d.value / total) * c
    const seg = { ...d, dash: len, off: offset }
    offset += len
    return seg
  })

  return (
    <div className="pie">
      <style>{`
        .pie { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .pie-svg { flex-shrink: 0; }
        .pie-center-num { font-size: 20px; font-weight: 600; fill: ${theme.textH}; }
        .pie-center-lbl { font-size: 9px; fill: ${theme.textM}; text-transform: uppercase; letter-spacing: 0.05em; }
        .pie-legend { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 130px; }
        .pie-leg-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .pie-swatch { width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; }
        .pie-leg-name { color: ${theme.textB}; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pie-leg-val { color: ${theme.textH}; font-weight: 500; flex-shrink: 0; }
        .pie-leg-pct { color: ${theme.textM}; font-size: 11px; width: 40px; text-align: right; flex-shrink: 0; }
      `}</style>

      <svg className="pie-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.bgSurf} strokeWidth={thickness} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={-s.off}
            />
          ))}
        </g>
        <text x="50%" y="48%" textAnchor="middle" className="pie-center-num">{total}</text>
        {centerLabel && <text x="50%" y="60%" textAnchor="middle" className="pie-center-lbl">{centerLabel}</text>}
      </svg>

      <div className="pie-legend">
        {data.map(d => {
          const pct = total ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={d.label} className="pie-leg-row">
              <span className="pie-swatch" style={{ background: d.color }} />
              <span className="pie-leg-name">{d.label}</span>
              <span className="pie-leg-val">{d.value}</span>
              <span className="pie-leg-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
