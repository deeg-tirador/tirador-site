import { useState } from 'react'
import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getDistributions } from '../lib/sheets'
import { theme } from '../lib/styles'

export default function Distributions({ user, distributions, lastUpdated }) {
  const [filter, setFilter] = useState('all')

  const filtered = distributions.filter(d => {
    if (filter === 'feathers') return d.type?.toLowerCase().includes('feather')
    if (filter === 'cards') return d.type?.toLowerCase().includes('card')
    return true
  })

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .filter-row { display: flex; gap: 6px; margin-bottom: 14px; }
        .filt { font-size: 12px; color: ${theme.textB}; padding: 5px 14px; border-radius: 6px; border: 0.5px solid ${theme.border}; background: ${theme.bgCard}; cursor: pointer; }
        .filt.active { background: ${theme.bgSurf}; color: ${theme.gold}; border-color: ${theme.gold}; font-weight: 500; }
        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; color: ${theme.textM}; border-bottom: 0.5px solid ${theme.border}; font-weight: 500; background: ${theme.bgSurf}; }
        td { padding: 10px 12px; border-bottom: 0.5px solid ${theme.bgPage}; color: ${theme.textB}; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .dist-type { font-size: 11px; font-weight: 500; }
        .badge-feather { background: #e6f1fb20; color: #85b7eb; font-size: 10px; padding: 2px 7px; border-radius: 3px; border: 0.5px solid #185fa540; }
        .badge-card { background: #f5c51820; color: ${theme.gold}; font-size: 10px; padding: 2px 7px; border-radius: 3px; border: 0.5px solid ${theme.gold}40; }
        .event-name { color: ${theme.textH}; font-weight: 500; margin-bottom: 2px; }
        .event-items { font-size: 11px; color: ${theme.textM}; }
        .recipients { font-size: 11px; color: ${theme.textM}; margin-top: 4px; }
        .recipient-tag { display: inline-block; background: ${theme.bgSurf}; border: 0.5px solid ${theme.border}; border-radius: 3px; padding: 1px 6px; font-size: 10px; color: ${theme.textB}; margin: 2px 2px 0 0; }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .empty { text-align: center; padding: 40px; color: ${theme.textM}; font-size: 13px; }
        .date-col { color: ${theme.textM}; font-size: 11px; white-space: nowrap; }
      `}</style>

      <h1 className="page-title">Distribution history</h1>
      <p className="page-sub">Confirmed feather and card distributions</p>

      <div className="filter-row">
        {['all', 'feathers', 'cards'].map(f => (
          <button key={f} className={`filt${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="table-card">
        {filtered.length === 0 ? (
          <div className="empty">No distributions found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Event</th>
                <th>Items</th>
                <th>Recipients</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isFeather = d.type?.toLowerCase().includes('feather')
                const recipientList = d.recipients?.split(',').map(r => r.trim()).filter(Boolean) || []
                return (
                  <tr key={i}>
                    <td className="date-col">{d.timestamp?.split(' ')[0] || '—'}</td>
                    <td>
                      <span className={isFeather ? 'badge-feather' : 'badge-card'}>
                        {isFeather ? '🪶 Feathers' : '🎴 Cards'}
                      </span>
                    </td>
                    <td>
                      <div className="event-name">{d.event}</div>
                      <div className="event-items">{d.type}</div>
                    </td>
                    <td style={{ color: theme.textB }}>{d.items}</td>
                    <td>
                      <div>
                        {recipientList.slice(0, 8).map((r, j) => (
                          <span key={j} className="recipient-tag">{r}</span>
                        ))}
                        {recipientList.length > 8 && (
                          <span className="recipient-tag">+{recipientList.length - 8} more</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <div className="foot">Last updated: {lastUpdated} · {filtered.length} records</div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const rows = await getDistributions()
  const distributions = rows.map(r => ({
    timestamp: r['Timestamp'],
    type: r['Type'],
    event: r['Event'],
    recipients: r['Recipients'],
    items: r['Items'],
    notes: r['Notes'],
  })).reverse() // newest first

  return {
    props: {
      user: session.user,
      distributions,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    }
  }
}
