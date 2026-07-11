import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getCardQueue } from '../lib/sheets'
import { theme } from '../lib/styles'

export default function CardQueue({ user, queue, lastUpdated }) {
  const received = queue.filter(m => m.received === 'Y')
  const notReceived = queue.filter(m => m.received !== 'Y')

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 16px; }
        .stat-box { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 12px; }
        .stat-lbl { font-size: 11px; color: ${theme.textM}; margin-bottom: 4px; }
        .stat-val { font-size: 22px; font-weight: 500; color: ${theme.textH}; }
        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; color: ${theme.textM}; border-bottom: 0.5px solid ${theme.border}; font-weight: 500; background: ${theme.bgSurf}; }
        td { padding: 8px 12px; border-bottom: 0.5px solid ${theme.bgPage}; color: ${theme.textB}; }
        tr:last-child td { border-bottom: none; }
        .pos { color: ${theme.gold}; font-weight: 500; }
        .next-badge { background: ${theme.orange}20; color: ${theme.orange}; font-size: 10px; padding: 1px 6px; border-radius: 3px; border: 0.5px solid ${theme.orange}40; }
        .badge-y { background: #0a201020; color: #4ade80; font-size: 10px; padding: 2px 7px; border-radius: 3px; }
        .badge-n { background: #20200a20; color: ${theme.gold}; font-size: 10px; padding: 2px 7px; border-radius: 3px; }
        .member-name { color: ${theme.textH}; font-weight: 500; }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .added { font-size: 11px; color: ${theme.textM}; }
      `}</style>

      <h1 className="page-title">Card queue</h1>
      <p className="page-sub">Current rotation order for card distribution</p>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-lbl">Total in queue</div>
          <div className="stat-val">{queue.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Not yet received</div>
          <div className="stat-val">{notReceived.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Already received</div>
          <div className="stat-val">{received.length}</div>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Received</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((m, i) => (
              <tr key={m.userId || i}>
                <td><span className="pos">{m.position}</span></td>
                <td>
                  <span className="member-name">{m.displayName || m.username}</span>
                  {i === 0 && <span className="next-badge" style={{ marginLeft: 8 }}>Next up</span>}
                </td>
                <td>
                  <span className={m.received === 'Y' ? 'badge-y' : 'badge-n'}>
                    {m.received === 'Y' ? 'Received' : 'Pending'}
                  </span>
                </td>
                <td><span className="added">{m.addedAt?.split(' ')[0] || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="foot">Last updated: {lastUpdated} · {queue.length} members in queue</div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const rows = await getCardQueue()
  const queue = rows.map(r => ({
    position: r['Position'],
    userId: r['User ID'],
    username: r['Username'],
    displayName: r['Display Name'],
    addedAt: r['Added At'],
    received: r['Received'],
  }))

  return {
    props: {
      user: session.user,
      queue,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    }
  }
}
