import { useMemo } from 'react'
import ClassIcon from './ClassIcon'
import PieChart from './PieChart'
import { theme } from '../lib/styles'

// Palette cycled for the job breakdown slices.
const JOB_COLORS = [
  '#f5c518', '#7f77dd', '#5dcaa5', '#d85a30', '#d4537e', '#eda100', '#378add',
  '#639922', '#e24b4a', '#9b59b6', '#3498db', '#e67e22', '#1abc9c', '#e84393',
]

const GUILD_CAP = 80

const ROLES = [
  { label: 'Support',    color: '#5dcaa5', classes: ['Bard', 'Gypsy', 'Priest'] },
  { label: 'PATK Class', color: '#e67e22', classes: ['Assassin', 'Champion', 'Doram', 'Lord Knight', 'Mastersmith', 'Paladin', 'Rebellion', 'Sniper'] },
  { label: 'MATK Class', color: '#378add', classes: ['Professor', 'Wizard'] },
]

function roleOf(cls) {
  const c = String(cls || '').trim().toLowerCase()
  for (const r of ROLES) {
    if (r.classes.some(x => x.toLowerCase() === c)) return r.label
  }
  return 'Other'
}

function daysAgo(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (isNaN(d)) return Infinity
  return (Date.now() - d.getTime()) / 86400000
}

const MEDALS = ['👑', '🥈', '🥉']
const PEDESTAL_H = [64, 96, 44]        // heights for display order [#2, #1, #3]
const DISPLAY_ORDER = [1, 0, 2]        // render #2, #1, #3 left→right

export default function Dashboard({ members, cpGains = [] }) {
  const stats = useMemo(() => {
    const total = members.length
    const cps = members.map(m => m.cp || 0)
    const topCp = Math.max(0, ...cps)
    const avgCp = total ? Math.round(cps.reduce((s, v) => s + v, 0) / total) : 0
    const updatedThisWeek = members.filter(m => daysAgo(m.lastUpdated) <= 7).length

    const top3 = [...members].filter(m => (m.cp || 0) > 0).sort((a, b) => b.cp - a.cp).slice(0, 3)

    const classCounts = {}
    members.forEach(m => { const c = m.class || 'Unknown'; classCounts[c] = (classCounts[c] || 0) + 1 })
    const jobs = Object.entries(classCounts).sort((a, b) => b[1] - a[1])
    const maxJob = Math.max(1, ...jobs.map(j => j[1]))

    const roleCounts = { Support: 0, 'PATK Class': 0, 'MATK Class': 0, Other: 0 }
    members.forEach(m => { roleCounts[roleOf(m.class)]++ })
    const roleData = [
      { label: 'Support', value: roleCounts['Support'], color: '#5dcaa5' },
      { label: 'PATK Class', value: roleCounts['PATK Class'], color: '#e67e22' },
      { label: 'MATK Class', value: roleCounts['MATK Class'], color: '#378add' },
      { label: 'Other', value: roleCounts['Other'], color: '#8a8a99' },
    ]
    const jobData = jobs.map(([label, value], i) => ({ label, value, color: JOB_COLORS[i % JOB_COLORS.length] }))

    return { total, topCp, avgCp, updatedThisWeek, top3, jobs, maxJob, roleData, jobData }
  }, [members])

  const classByUid = useMemo(() => {
    const m = {}
    members.forEach(x => { m[x.userId] = x.class })
    return m
  }, [members])

  const roleColor = label => ROLES.find(r => r.label === label)?.color || theme.textM

  return (
    <div className="dash">
      <style>{`
        .dash { margin-bottom: 22px; }

        .podium { display: flex; justify-content: center; align-items: flex-end; gap: 10px; margin-bottom: 18px; }
        .pod-col { flex: 1; max-width: 200px; display: flex; flex-direction: column; align-items: center; }
        .pod-medal { font-size: 22px; line-height: 1; }
        .pod-cp { font-size: 16px; font-weight: 600; color: ${theme.gold}; margin: 4px 0 6px; }
        .pod-stand { width: 100%; border-radius: 8px 8px 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 6px; border: 0.5px solid ${theme.border}; border-bottom: none; }
        .pod-rank { font-size: 20px; font-weight: 700; }
        .pod-who { display: flex; align-items: center; gap: 6px; padding: 8px 6px 0; }
        .pod-name { font-size: 12px; color: ${theme.textH}; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }

        .tiles { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 12px; }
        @media(min-width:720px){ .tiles { grid-template-columns: repeat(4,1fr); } }
        .tile { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 10px; padding: 12px 14px; }
        .tile-lbl { font-size: 11px; color: ${theme.textM}; margin-bottom: 4px; }
        .tile-val { font-size: 24px; font-weight: 500; color: ${theme.textH}; line-height: 1.1; }
        .tile-sub { font-size: 11px; color: ${theme.textM}; margin-top: 3px; }
        .tile-cap { color: ${theme.gold}; }

        .cols { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
        @media(min-width:720px){ .cols { grid-template-columns: 1fr 1fr; } }
        .panel { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; padding: 14px; }
        .panel-h { font-size: 12px; font-weight: 500; color: ${theme.textM}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }

        .role-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .role-row:last-child { margin-bottom: 0; }
        .role-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .role-name { font-size: 12px; color: ${theme.textB}; width: 92px; flex-shrink: 0; }
        .role-bar-track { flex: 1; height: 8px; background: ${theme.bgSurf}; border-radius: 4px; overflow: hidden; }
        .role-bar { height: 100%; border-radius: 4px; }
        .role-count { font-size: 13px; font-weight: 500; color: ${theme.textH}; width: 28px; text-align: right; flex-shrink: 0; }

        .gain-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 0.5px solid ${theme.bgPage}; }
        .gain-row:last-child { border-bottom: none; }
        .gain-pos { font-size: 11px; color: ${theme.textM}; width: 16px; text-align: center; flex-shrink: 0; }
        .gain-name { font-size: 12px; color: ${theme.textH}; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gain-val { font-size: 12px; color: #4ade80; font-weight: 600; flex-shrink: 0; }
        .gain-cp { font-size: 10px; color: ${theme.textM}; flex-shrink: 0; }
        .empty { font-size: 11px; color: ${theme.textM}; text-align: center; padding: 12px 0; }

        .job-panel { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; padding: 14px; }
        .job-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .job-row:last-child { margin-bottom: 0; }
        .job-name { font-size: 11px; color: ${theme.textB}; width: 96px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .job-bar-track { flex: 1; height: 10px; background: ${theme.bgSurf}; border-radius: 3px; overflow: hidden; }
        .job-bar { height: 100%; background: ${theme.gold}; border-radius: 3px; }
        .job-count { font-size: 11px; color: ${theme.textM}; width: 22px; text-align: right; flex-shrink: 0; }
      `}</style>

      {/* Top 3 CP podium */}
      {stats.top3.length > 0 && (
        <div className="podium">
          {DISPLAY_ORDER.map((rankIdx, slot) => {
            const m = stats.top3[rankIdx]
            if (!m) return <div key={slot} className="pod-col" />
            const medalColor = ['#f5c518', '#a8a9ad', '#cd7f32'][rankIdx]
            return (
              <div key={slot} className="pod-col">
                <div className="pod-medal">{MEDALS[rankIdx]}</div>
                <div className="pod-cp">{m.cp.toLocaleString()}</div>
                <div
                  className="pod-stand"
                  style={{ height: PEDESTAL_H[slot], background: `${medalColor}18`, borderTop: `2px solid ${medalColor}` }}
                >
                  <span className="pod-rank" style={{ color: medalColor }}>#{rankIdx + 1}</span>
                </div>
                <div className="pod-who">
                  <ClassIcon className={m.class} size={22} />
                  <span className="pod-name">{m.displayName || m.username}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tiles */}
      <div className="tiles">
        <div className="tile">
          <div className="tile-lbl">Members</div>
          <div className="tile-val">{stats.total}<span className="tile-cap"> / {GUILD_CAP}</span></div>
          <div className="tile-sub">{Math.max(0, GUILD_CAP - stats.total)} slots open</div>
        </div>
        <div className="tile">
          <div className="tile-lbl">Guild average CP</div>
          <div className="tile-val">{stats.avgCp.toLocaleString()}</div>
        </div>
        <div className="tile">
          <div className="tile-lbl">Top CP</div>
          <div className="tile-val">{stats.topCp.toLocaleString()}</div>
        </div>
        <div className="tile">
          <div className="tile-lbl">Updates this week</div>
          <div className="tile-val">{stats.updatedThisWeek}</div>
          <div className="tile-sub">of {stats.total} members</div>
        </div>
      </div>

      {/* Role breakdown + CP gainers */}
      <div className="cols">
        <div className="panel">
          <div className="panel-h">Role breakdown</div>
          <PieChart data={stats.roleData} centerLabel="members" />
        </div>

        <div className="panel">
          <div className="panel-h">Biggest CP gainers this week</div>
          {cpGains.length === 0 ? (
            <div className="empty">No stat updates in the last 7 days yet.</div>
          ) : (
            cpGains.map((g, i) => (
              <div
                key={g.uid}
                className="gain-row"
                onClick={() => window.location.href = `/member/${g.uid}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="gain-pos">{i + 1}</span>
                <ClassIcon className={classByUid[g.uid]} size={20} />
                <span className="gain-name">{g.name}</span>
                <span className="gain-val">+{g.gain.toLocaleString()}</span>
                <span className="gain-cp">→ {g.cp.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Job breakdown */}
      <div className="job-panel">
        <div className="panel-h">Job breakdown</div>
        <PieChart data={stats.jobData} centerLabel="members" size={170} />
      </div>
    </div>
  )
}
