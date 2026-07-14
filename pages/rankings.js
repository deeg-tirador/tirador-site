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
  { key: 'ignorePdef',  label: 'IGN.PDEF'     },
  { key: 'ignoreMdef',  label: 'IGN.MDEF'     },
  { key: 'pvpDmg',      label: 'PVP DMG'      },
  { key: 'pvpReduction',label: 'PVP RED'      },
  { key: 'hp',          label: 'HP'           },
]

export default function Rankings({ user, members }) {
  const classes = useMemo(
    () => [...new Set(members.map(m => m.class).filter(Boolean))].sort(),
    [members]
  )
  const [cls, setCls] = useState('ALL')
  const [sortKey, setSortKey] = useState('cp')

  const pool = useMemo(
    () => (cls === 'ALL' ? members : members.filter(m => m.class === cls)),
    [members, cls]
  )

  const sorted = useMemo(
    () => [...pool].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)),
    [pool, sortKey]
  )

  // Highest value per stat column, for highlighting.
  const maxByStat = useMemo(() => {
    const m = {}
    STATS.forEach(s => { m[s.key] = Math.max(0, ...pool.map(p => p[s.key] || 0)) })
    return m
  }, [pool])

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .filter-label { font-size: 12px; color: ${theme.textM}; }
        .class-select { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 6px; padding: 7px 10px; font-size: 13px; color: ${theme.textH}; min-width: 180px; }
        .count { font-size: 11px; color: ${theme.textM}; }
        .hint { font-size: 11px; color: ${theme.textM}; margin-left: auto; }

        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .table-wrap { overflow-x: auto; scrollbar-width: auto; scrollbar-color: ${theme.gold} ${theme.bgSurf}; }
        .table-wrap::-webkit-scrollbar { height: 14px; }
        .table-wrap::-webkit-scrollbar-track { background: ${theme.bgSurf}; border-radius: 7px; }
        .table-wrap::-webkit-scrollbar-thumb { background: ${theme.gold}; border-radius: 7px; border: 3px solid ${theme.bgSurf}; }
        .table-wrap::-webkit-scrollbar-thumb:hover { background: ${theme.orange}; }

        table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
        th, td { padding: 7px 10px; border-bottom: 0.5px solid ${theme.bgPage}; text-align: right; }
        th { font-size: 10px; color: ${theme.textM}; background: ${theme.bgSurf}; font-weight: 500; cursor: pointer; user-select: none; border-bottom: 0.5px solid ${theme.border}; }
        th:hover { color: ${theme.gold}; }
        th.sorted { color: ${theme.gold}; }
        th.rank-col, td.rank-col { text-align: center; width: 34px; color: ${theme.textM}; }
        th.member-col, td.member-col { text-align: left; position: sticky; left: 0; z-index: 1; min-width: 150px; background: ${theme.bgSurf}; }
        td.member-col { background: ${theme.bgCard}; }
        .member-cell { display: flex; align-items: center; gap: 8px; }
        .member-name { color: ${theme.textH}; font-weight: 500; }
        tr:hover td { filter: brightness(1.12); }
        tr:hover td.member-col { cursor: pointer; }
        td.leader { color: ${theme.gold}; font-weight: 600; }
        td.zero { color: ${theme.textM}; }
        .sort-arrow { margin-left: 3px; }
      `}</style>

      <h1 className="page-title">Class rankings</h1>
      <p className="page-sub">Every stat in one table — filter by class, click a column to sort</p>

      <div className="filter-row">
        <span className="filter-label">Class:</span>
        <select className="class-select" value={cls} onChange={e => setCls(e.target.value)}>
          <option value="ALL">All classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="count">{pool.length} member{pool.length === 1 ? '' : 's'}</span>
        <span className="hint">Gold = class leader · scroll → for more stats</span>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th className="member-col">Member</th>
                {STATS.map(s => (
                  <th
                    key={s.key}
                    className={sortKey === s.key ? 'sorted' : ''}
                    onClick={() => setSortKey(s.key)}
                  >
                    {s.label}{sortKey === s.key ? <span className="sort-arrow">▼</span> : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr key={m.userId} onClick={() => window.location.href = `/member/${m.userId}`}>
                  <td className="rank-col">{i + 1}</td>
                  <td className="member-col">
                    <div className="member-cell">
                      <ClassIcon className={m.class} size={22} />
                      <span className="member-name">{m.displayName || m.username}</span>
                    </div>
                  </td>
                  {STATS.map(s => {
                    const v = m[s.key] || 0
                    const isLeader = v > 0 && v === maxByStat[s.key]
                    return (
                      <td key={s.key} className={isLeader ? 'leader' : (v === 0 ? 'zero' : '')}>
                        {v.toLocaleString()}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
