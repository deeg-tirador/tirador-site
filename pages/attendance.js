import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getAttendance, getLeaderboard } from '../lib/sheets'
import { theme } from '../lib/styles'

export default function Attendance({ user, members, eventCodes, matrix, lastUpdated }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return members
    return members.filter(m => m.toLowerCase().includes(search.toLowerCase()))
  }, [members, search])

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .search-wrap { margin-bottom: 12px; }
        .search-input { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 6px; padding: 7px 12px; font-size: 12px; color: ${theme.textH}; width: 100%; max-width: 320px; }
        .search-input::placeholder { color: ${theme.textM}; }
        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .table-wrap { overflow-x: auto; }
        table { border-collapse: collapse; font-size: 11px; white-space: nowrap; }
        th { padding: 8px 10px; font-size: 10px; color: ${theme.textM}; border-bottom: 0.5px solid ${theme.border}; font-weight: 500; background: ${theme.bgSurf}; text-align: center; }
        th.member-col { text-align: left; min-width: 140px; position: sticky; left: 0; background: ${theme.bgSurf}; z-index: 1; }
        th.total-col { min-width: 60px; background: ${theme.bgSurf}; }
        th.event-col { background: #f5c51820; color: ${theme.gold}; min-width: 72px; }
        td { padding: 6px 10px; border-bottom: 0.5px solid ${theme.bgPage}; text-align: center; }
        td.member-col { text-align: left; color: ${theme.textB}; font-weight: 500; background: ${theme.bgCard}; position: sticky; left: 0; z-index: 1; }
        td.total-col { color: ${theme.textB}; font-weight: 500; }
        td.attended { background: #c6efce20; color: #4ade80; font-weight: 500; }
        td.absent { background: #ffc7ce15; color: ${theme.bgPage}; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { filter: brightness(1.1); }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 11px; color: ${theme.textM}; align-items: center; }
        .leg-dot { width: 12px; height: 12px; border-radius: 2px; }
      `}</style>

      <h1 className="page-title">Attendance matrix</h1>
      <p className="page-sub">✓ = attended · {eventCodes.length} events total</p>

      <div className="legend">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="leg-dot" style={{ background: '#c6efce' }} />
          Attended
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="leg-dot" style={{ background: '#ffc7ce' }} />
          Absent
        </div>
      </div>

      <div className="search-wrap">
        <input
          className="search-input"
          placeholder="Search member..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="member-col">Member</th>
                <th className="total-col">Total</th>
                {eventCodes.map(code => (
                  <th key={code} className="event-col">{code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const row = matrix[member] || {}
                const count = eventCodes.filter(c => row[c]).length
                const total = `${count}/${eventCodes.length}`
                return (
                  <tr key={member}>
                    <td className="member-col">{member}</td>
                    <td className="total-col">{total}</td>
                    {eventCodes.map(code => (
                      <td key={code} className={row[code] ? 'attended' : 'absent'}>
                        {row[code] ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                )
              })}
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

  const [attRows, memberRows] = await Promise.all([getAttendance(), getLeaderboard()])

  // Build unique event codes from Code Used column
  const eventCodes = [...new Set(attRows.map(r => r['Code Used']).filter(Boolean))]

  // Build member list from leaderboard
  const members = memberRows.map(m => m.displayName || m.username)

  // Build attendance lookup
  const matrix = {}
  attRows.forEach(r => {
    const name = r['Display Name']
    const code = r['Code Used']
    if (!name || !code) return
    if (!matrix[name]) matrix[name] = {}
    matrix[name][code] = true
  })

  return {
    props: {
      user: session.user,
      members,
      eventCodes,
      matrix,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    }
  }
}
