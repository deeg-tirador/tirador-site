import Layout from '../../components/Layout'
import ClassIcon from '../../components/ClassIcon'
import { getSession } from '../../lib/auth'
import { getLeaderboard, getAttendance, getMemberHistory } from '../../lib/sheets'
import { theme } from '../../lib/styles'

// All chartable stats (matches the profile stat cards) + CP.
const GRAPH_STATS = [
  { key: 'cp',          label: 'Combat Power', color: '#f5c518' },
  { key: 'patk',        label: 'PATK',         color: '#7f77dd' },
  { key: 'matk',        label: 'MATK',         color: '#5dcaa5' },
  { key: 'pdef',        label: 'E.PDEF',       color: '#d85a30' },
  { key: 'mdef',        label: 'E.MDEF',       color: '#d4537e' },
  { key: 'pdmg',        label: 'PDMG',         color: '#eda100' },
  { key: 'mdmg',        label: 'MDMG',         color: '#378add' },
  { key: 'pdmgR',       label: 'PDMG.R',       color: '#639922' },
  { key: 'mdmgR',       label: 'MDMG.R',       color: '#e24b4a' },
  { key: 'ignorePdef',  label: 'Ignore PDEF',  color: '#9b59b6' },
  { key: 'ignoreMdef',  label: 'Ignore MDEF',  color: '#3498db' },
  { key: 'pvpDmg',      label: 'PVP DMG',      color: '#e67e22' },
  { key: 'pvpReduction',label: 'PVP Reduction',color: '#1abc9c' },
  { key: 'hp',          label: 'HP',           color: '#f87171' },
]

function fmt(n) {
  if (n === Math.round(n)) return Math.round(n).toLocaleString()
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// Small inline SVG line chart with area fill and latest-value / delta annotation.
function StatChart({ history, statKey, label, color }) {
  const vals = history.map(h => h[statKey])
  const hasData = vals.filter(v => v > 0).length >= 2
  const W = 260, H = 84, pad = 8

  let body
  if (!hasData) {
    body = <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textM, fontSize: 11 }}>Not enough data</div>
  } else {
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    const stepX = vals.length > 1 ? (W - pad * 2) / (vals.length - 1) : 0
    const pts = vals.map((v, i) => [pad + i * stepX, H - pad - ((v - min) / range) * (H - pad * 2)])
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
    const area = `M ${pts[0][0].toFixed(1)} ${H - pad} ` +
      pts.map(p => 'L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') +
      ` L ${pts[pts.length - 1][0].toFixed(1)} ${H - pad} Z`
    const gid = `grad-${statKey}`
    body = (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 1.6} fill={color} />
        ))}
      </svg>
    )
  }

  const first = vals.find(v => v > 0) || 0
  const last = [...vals].reverse().find(v => v > 0) || 0
  const delta = last - first
  const deltaColor = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : theme.textM

  return (
    <div className="chart-box">
      <div className="chart-head">
        <span className="chart-label">{label}</span>
        {hasData && (
          <span className="chart-delta" style={{ color: deltaColor }}>
            {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}{delta !== 0 ? fmt(delta) : '—'}
          </span>
        )}
      </div>
      <div className="chart-value" style={{ color }}>{fmt(last)}</div>
      {body}
    </div>
  )
}

const STAT_GROUPS = [
  {
    label: 'Offense',
    stats: [
      { key: 'patk', label: 'PATK' },
      { key: 'matk', label: 'MATK' },
      { key: 'pdmg', label: 'PDMG' },
      { key: 'mdmg', label: 'MDMG' },
    ]
  },
  {
    label: 'Defense',
    stats: [
      { key: 'pdef',  label: 'E.PDEF'   },
      { key: 'mdef',  label: 'E.MDEF'   },
      { key: 'pdmgR', label: 'PDMG.R'   },
      { key: 'mdmgR', label: 'MDMG.R'   },
    ]
  },
  {
    label: 'PVP',
    stats: [
      { key: 'ignorePdef',  label: 'Ignore PDEF'   },
      { key: 'ignoreMdef',  label: 'Ignore MDEF'   },
      { key: 'pvpDmg',      label: 'PVP DMG'       },
      { key: 'pvpReduction',label: 'PVP Reduction' },
    ]
  },
]

export default function MemberProfile({ user, member, attendanceCount, totalEvents, recentAttendance, history }) {
  if (!member) return (
    <Layout user={user}>
      <p style={{ color: theme.textM, padding: 40, textAlign: 'center' }}>Member not found.</p>
    </Layout>
  )

  return (
    <Layout user={user}>
      <style>{`
        .back { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; display: inline-flex; align-items: center; gap: 6px; }
        .profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 12px; padding: 20px; }
        .profile-name { font-size: 22px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .profile-class { font-size: 13px; color: ${theme.textM}; margin-bottom: 8px; }
        .profile-cp { font-size: 28px; font-weight: 500; color: ${theme.gold}; }
        .profile-cp-label { font-size: 11px; color: ${theme.textM}; }
        .profile-badge { font-size: 10px; padding: 2px 8px; border-radius: 3px; display: inline-block; }
        .stat-section { margin-bottom: 16px; }
        .section-label { font-size: 11px; font-weight: 500; color: ${theme.textM}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; }
        @media(min-width:600px) { .stat-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-box { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 8px; padding: 10px 12px; }
        .stat-lbl { font-size: 10px; color: ${theme.textM}; margin-bottom: 3px; }
        .stat-val { font-size: 16px; font-weight: 500; color: ${theme.textH}; }
        .att-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .att-header { padding: 12px; border-bottom: 0.5px solid ${theme.border}; display: flex; justify-content: space-between; align-items: center; background: ${theme.bgSurf}; }
        .att-title { font-size: 13px; font-weight: 500; color: ${theme.textH}; }
        .att-count { font-size: 13px; color: ${theme.gold}; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; color: ${theme.textM}; border-bottom: 0.5px solid ${theme.border}; font-weight: 500; }
        td { padding: 7px 12px; border-bottom: 0.5px solid ${theme.bgPage}; color: ${theme.textB}; }
        tr:last-child td { border-bottom: none; }
        .att-badge { background: #0a201020; color: #4ade80; font-size: 10px; padding: 1px 6px; border-radius: 3px; }
        .hp-box { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid #e24b4a; border-radius: 8px; padding: 10px 12px; }
        .chart-grid { display: grid; grid-template-columns: repeat(1,1fr); gap: 8px; }
        @media(min-width:600px) { .chart-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:900px) { .chart-grid { grid-template-columns: repeat(3,1fr); } }
        .chart-box { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 8px; padding: 10px 12px; }
        .chart-head { display: flex; justify-content: space-between; align-items: baseline; }
        .chart-label { font-size: 11px; color: ${theme.textM}; }
        .chart-delta { font-size: 10px; font-weight: 500; }
        .chart-value { font-size: 16px; font-weight: 500; margin: 2px 0 6px; }
        .growth-note { font-size: 11px; color: ${theme.textM}; padding: 20px; text-align: center; background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; }
      `}</style>

      <a href="/" className="back">← Back to leaderboard</a>

      <div className="profile-header">
        <ClassIcon className={member.class} size={64} />
        <div style={{ flex: 1 }}>
          <div className="profile-name">{member.displayName || member.username}</div>
          <div className="profile-class">{member.class}</div>
          <span className={`profile-badge ${member.status === 'Active' || !member.status ? '' : ''}`}
            style={{
              background: member.status !== 'Removed' ? '#0a201020' : '#20200a20',
              color: member.status !== 'Removed' ? '#4ade80' : '#f87171',
              border: `0.5px solid ${member.status !== 'Removed' ? '#1a402040' : '#40201a40'}`,
            }}>
            {member.status || 'Active'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="profile-cp-label">Combat Power</div>
          <div className="profile-cp">{member.cp.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: theme.textM, marginTop: 4 }}>
            Updated: {member.lastUpdated?.split(' ')[0] || '—'}
          </div>
        </div>
      </div>

      {STAT_GROUPS.map(group => (
        <div key={group.label} className="stat-section">
          <div className="section-label">{group.label}</div>
          <div className="stat-grid">
            {group.stats.map(s => (
              <div key={s.key} className="stat-box">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val">{(member[s.key] || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {member.hp > 0 && (
        <div className="stat-section">
          <div className="section-label">Health</div>
          <div className="hp-box">
            <div className="stat-lbl">HP</div>
            <div className="stat-val" style={{ fontSize: 20, color: '#f87171' }}>{member.hp.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="stat-section">
        <div className="section-label">Stat growth</div>
        {history && history.length >= 2 ? (
          <div className="chart-grid">
            {GRAPH_STATS.map(s => (
              <StatChart key={s.key} history={history} statKey={s.key} label={s.label} color={s.color} />
            ))}
          </div>
        ) : (
          <div className="growth-note">
            Not enough history yet — growth charts appear after 2+ stat updates via <code>/updatestats</code>.
          </div>
        )}
      </div>

      <div className="stat-section">
        <div className="section-label">Attendance</div>
        <div className="att-card">
          <div className="att-header">
            <span className="att-title">Event attendance</span>
            <span className="att-count">{attendanceCount}/{totalEvents} events</span>
          </div>
          {recentAttendance.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Event code</th>
                  <th>Event type</th>
                  <th>Date</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.slice(0, 20).map((a, i) => (
                  <tr key={i}>
                    <td>{a.codeUsed}</td>
                    <td><span className="att-badge">{a.eventType}</span></td>
                    <td style={{ fontSize: 11, color: theme.textM }}>{a.timestamp?.split(' ')[0]}</td>
                    <td style={{ color: theme.gold }}>+{a.pointsAwarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: 20, color: theme.textM, fontSize: 12, textAlign: 'center' }}>No attendance records found.</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ req, res, params }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const [members, attRows] = await Promise.all([getLeaderboard(), getAttendance()])
  const member = members.find(m => m.userId === params.id) || null

  let attendanceCount = 0
  let totalEvents = 0
  let recentAttendance = []
  let history = []

  if (member) {
    history = await getMemberHistory(params.id)
    const memberAtt = attRows.filter(r => r['User ID'] === params.id)
    recentAttendance = memberAtt
      .sort((a, b) => new Date(b['Timestamp']) - new Date(a['Timestamp']))
      .map(r => ({
        timestamp: r['Timestamp'],
        codeUsed: r['Code Used'],
        eventType: r['Event Type'],
        pointsAwarded: r['Points Awarded'],
      }))
    attendanceCount = memberAtt.length
    totalEvents = new Set(attRows.map(r => r['Code Used'])).size
  }

  return {
    props: {
      user: session.user,
      member,
      attendanceCount,
      totalEvents,
      recentAttendance,
      history,
    }
  }
}
