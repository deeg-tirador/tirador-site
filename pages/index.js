import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import ClassIcon from '../components/ClassIcon'
import { getSession } from '../lib/auth'
import { getLeaderboard } from '../lib/sheets'
import { theme } from '../lib/styles'

const STATS = [
  { key: 'cp',          label: 'CP'        },
  { key: 'patk',        label: 'PATK'      },
  { key: 'matk',        label: 'MATK'      },
  { key: 'pdef',        label: 'E.PDEF'    },
  { key: 'mdef',        label: 'E.MDEF'    },
  { key: 'pdmg',        label: 'PDMG'      },
  { key: 'mdmg',        label: 'MDMG'      },
  { key: 'pdmgR',       label: 'PDMG.R'    },
  { key: 'mdmgR',       label: 'MDMG.R'    },
  { key: 'ignorePdef',  label: 'IGN.PDEF'  },
  { key: 'ignoreMdef',  label: 'IGN.MDEF'  },
  { key: 'pvpDmg',      label: 'PVP DMG'   },
  { key: 'pvpReduction',label: 'PVP RED'   },
  { key: 'hp',          label: 'HP'        },
]

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 86400) return 'Today'
  if (diff < 172800) return 'Yesterday'
  const days = Math.floor(diff / 86400)
  return `${days} days ago`
}

export default function Leaderboard({ members, user, lastUpdated }) {
  const [activeStat, setActiveStat] = useState('cp')
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => {
    return [...members]
      .filter(m => m.displayName.toLowerCase().includes(search.toLowerCase()) ||
                   m.username.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b[activeStat] || 0) - (a[activeStat] || 0))
  }, [members, activeStat, search])

  const activeLabel = STATS.find(s => s.key === activeStat)?.label

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 16px; }
        @media(max-width:600px) { .stat-grid { grid-template-columns: repeat(2,1fr); } }
        .stat-box { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 12px; }
        .stat-lbl { font-size: 11px; color: ${theme.textM}; margin-bottom: 4px; }
        .stat-val { font-size: 22px; font-weight: 500; color: ${theme.textH}; }
        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .search-wrap { padding: 10px 12px; border-bottom: 0.5px solid ${theme.border}; }
        .search-input { background: ${theme.bgPage}; border: 0.5px solid ${theme.border}; border-radius: 6px; padding: 7px 10px; font-size: 12px; color: ${theme.textH}; width: 100%; }
        .search-input::placeholder { color: ${theme.textM}; }
        .tabs { display: flex; background: ${theme.bgSurf}; border-bottom: 0.5px solid ${theme.border}; overflow-x: auto; padding: 0 12px; scrollbar-width: none; }
        .tabs::-webkit-scrollbar { display: none; }
        .tab { font-size: 12px; color: ${theme.textB}; padding: 10px 12px; border: none; border-bottom: 2px solid transparent; background: none; cursor: pointer; white-space: nowrap; }
        .tab.active { color: ${theme.gold}; border-bottom-color: ${theme.gold}; font-weight: 500; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 500px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; color: ${theme.textM}; border-bottom: 0.5px solid ${theme.border}; font-weight: 500; }
        td { padding: 8px 12px; border-bottom: 0.5px solid ${theme.bgSurf}; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: ${theme.bgSurf}; cursor: pointer; }
        .member-cell { display: flex; align-items: center; gap: 8px; }
        .member-name { color: ${theme.textH}; font-weight: 500; font-size: 12px; }
        .member-class { color: ${theme.textM}; font-size: 10px; margin-top: 1px; }
        .stat-val-cell { color: ${theme.gold}; font-weight: 500; }
        .badge-active { background: #0a2010; color: #4ade80; font-size: 10px; padding: 2px 7px; border-radius: 3px; }
        .badge-inactive { background: #200a0a; color: #f87171; font-size: 10px; padding: 2px 7px; border-radius: 3px; }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .rank-gold { color: ${theme.gold}; font-weight: 500; }
        .rank-silver { color: #a8a9ad; font-weight: 500; }
        .rank-bronze { color: #cd7f32; font-weight: 500; }
        .rank-num { color: ${theme.textM}; }
      `}</style>

      <h1 className="page-title">Leaderboard</h1>
      <p className="page-sub">Power stats rankings — all members</p>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-lbl">Total members</div>
          <div className="stat-val">{members.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Top CP</div>
          <div className="stat-val">{Math.max(...members.map(m => m.cp)).toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Guild avg CP</div>
          <div className="stat-val">{Math.round(members.reduce((s, m) => s + m.cp, 0) / members.length).toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Updated today</div>
          <div className="stat-val">{members.filter(m => timeAgo(m.lastUpdated) === 'Today').length}</div>
        </div>
      </div>

      <div className="table-card">
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search member name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          {STATS.map(s => (
            <button
              key={s.key}
              className={`tab${activeStat === s.key ? ' active' : ''}`}
              onClick={() => setActiveStat(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>{activeLabel}</th>
                <th>Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr key={m.userId} onClick={() => window.location.href = `/member/${m.userId}`}>
                  <td>
                    {i === 0 ? <span className="rank-gold">👑 1</span> :
                     i === 1 ? <span className="rank-silver">🥈 2</span> :
                     i === 2 ? <span className="rank-bronze">🥉 3</span> :
                     <span className="rank-num">{i + 1}</span>}
                  </td>
                  <td>
                    <div className="member-cell">
                      <ClassIcon className={m.class} size={26} />
                      <div>
                        <div className="member-name">{m.displayName || m.username}</div>
                        <div className="member-class">{m.class}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="stat-val-cell">{(m[activeStat] || 0).toLocaleString()}</span></td>
                  <td style={{ color: theme.textM, fontSize: 11 }}>{timeAgo(m.lastUpdated)}</td>
                  <td>
                    <span className={m.status === 'Active' || !m.status ? 'badge-active' : 'badge-inactive'}>
                      {m.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="foot">Last updated: {lastUpdated}</div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const members = await getLeaderboard()
  return {
    props: {
      user: session.user,
      members,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    }
  }
}
