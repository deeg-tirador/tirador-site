import Layout from '../../components/Layout'
import ClassIcon from '../../components/ClassIcon'
import { getSession } from '../../lib/auth'
import { getLeaderboard, getAttendance } from '../../lib/sheets'
import { theme } from '../../lib/styles'

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

export default function MemberProfile({ user, member, attendanceCount, totalEvents, recentAttendance }) {
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

  if (member) {
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
    }
  }
}
