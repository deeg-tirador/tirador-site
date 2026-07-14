import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import ClassIcon from '../components/ClassIcon'
import { getSession } from '../lib/auth'
import { getLeaderboard } from '../lib/sheets'
import { theme } from '../lib/styles'

const STATS = [
  { key: 'cp',          label: 'CP'           },
  { key: 'patk',        label: 'PATK'         },
  { key: 'matk',        label: 'MATK'         },
  { key: 'pdef',        label: 'E.PDEF'       },
  { key: 'mdef',        label: 'E.MDEF'       },
  { key: 'pdmg',        label: 'PDMG'         },
  { key: 'mdmg',        label: 'MDMG'         },
  { key: 'pdmgR',       label: 'PDMG.R'       },
  { key: 'mdmgR',       label: 'MDMG.R'       },
  { key: 'ignorePdef',  label: 'Ignore PDEF'  },
  { key: 'ignoreMdef',  label: 'Ignore MDEF'  },
  { key: 'pvpDmg',      label: 'PVP DMG'      },
  { key: 'pvpReduction',label: 'PVP Reduction'},
  { key: 'hp',          label: 'HP'           },
]

const TOP_N = 5
const MEDALS = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default function Rankings({ user, members }) {
  const classes = useMemo(
    () => [...new Set(members.map(m => m.class).filter(Boolean))].sort(),
    [members]
  )
  const [cls, setCls] = useState('ALL')

  const pool = useMemo(
    () => (cls === 'ALL' ? members : members.filter(m => m.class === cls)),
    [members, cls]
  )

  const rankings = useMemo(() => STATS.map(stat => {
    const ranked = [...pool]
      .filter(m => (m[stat.key] || 0) > 0)
      .sort((a, b) => (b[stat.key] || 0) - (a[stat.key] || 0))
      .slice(0, TOP_N)
    return { stat, ranked }
  }), [pool])

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .filter-label { font-size: 12px; color: ${theme.textM}; }
        .class-select { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 6px; padding: 7px 10px; font-size: 13px; color: ${theme.textH}; min-width: 180px; }
        .count { font-size: 11px; color: ${theme.textM}; }
        .rank-grid { display: grid; grid-template-columns: repeat(1,1fr); gap: 10px; }
        @media(min-width:600px) { .rank-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:960px) { .rank-grid { grid-template-columns: repeat(3,1fr); } }
        .rank-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .rank-head { padding: 8px 12px; font-size: 12px; font-weight: 500; color: ${theme.gold}; background: #f5c51820; border-bottom: 0.5px solid ${theme.border}; }
        .rank-row { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 0.5px solid ${theme.bgPage}; }
        .rank-row:last-child { border-bottom: none; }
        .rank-pos { font-size: 11px; color: ${theme.textM}; width: 20px; text-align: center; flex-shrink: 0; }
        .rank-name { font-size: 12px; color: ${theme.textH}; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rank-val { font-size: 12px; color: ${theme.gold}; font-weight: 500; flex-shrink: 0; }
        .rank-empty { padding: 14px 12px; font-size: 11px; color: ${theme.textM}; text-align: center; }
      `}</style>

      <h1 className="page-title">Class rankings</h1>
      <p className="page-sub">Pick a class to see the top members for every stat</p>

      <div className="filter-row">
        <span className="filter-label">Class:</span>
        <select className="class-select" value={cls} onChange={e => setCls(e.target.value)}>
          <option value="ALL">All classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="count">{pool.length} member{pool.length === 1 ? '' : 's'}</span>
      </div>

      <div className="rank-grid">
        {rankings.map(({ stat, ranked }) => (
          <div key={stat.key} className="rank-card">
            <div className="rank-head">{stat.label}</div>
            {ranked.length === 0 ? (
              <div className="rank-empty">No data</div>
            ) : (
              ranked.map((m, i) => (
                <div
                  key={m.userId}
                  className="rank-row"
                  onClick={() => window.location.href = `/member/${m.userId}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="rank-pos">{MEDALS[i] || i + 1}</span>
                  <ClassIcon className={m.class} size={20} />
                  <span className="rank-name">{m.displayName || m.username}</span>
                  <span className="rank-val">{(m[stat.key] || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        ))}
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
    },
  }
}
