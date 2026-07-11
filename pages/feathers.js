import { useMemo } from 'react'
import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getDistributions } from '../lib/sheets'
import { theme } from '../lib/styles'

const SLOTS_PER_PAGE = 4

// Icon image files live in public/icons/.
const ICON = { LND: '/icons/lnd.png', TNS: '/icons/tns.png' }

// Build the flat slot sequence: LND first (each player maximized to limitLnd),
// then TNS starting from queue position 1 again (each maximized to limitTns).
function buildSlots(queue, lnd, tns, limitLnd, limitTns) {
  const slots = []
  if (!queue.length) return slots

  const fillPhase = (total, limit, type) => {
    let filled = 0
    let qi = 0
    while (filled < total && limit > 0) {
      const player = queue[qi % queue.length]
      const take = Math.min(limit, total - filled)
      for (let k = 0; k < take; k++) {
        slots.push({ player, type })
        filled++
      }
      qi++
    }
  }

  fillPhase(lnd, limitLnd, 'LND')
  fillPhase(tns, limitTns, 'TNS')
  return slots
}

function chunkPages(slots) {
  const pages = []
  for (let i = 0; i < slots.length; i += SLOTS_PER_PAGE) {
    pages.push(slots.slice(i, i + SLOTS_PER_PAGE))
  }
  return pages
}

export default function Feathers({ user, distribution, lastUpdated }) {
  const slots = useMemo(() => {
    if (!distribution) return []
    const { lnd, tns, limitLnd, limitTns, queue } = distribution
    return buildSlots(queue, lnd, tns, limitLnd, limitTns)
  }, [distribution])

  const pages = useMemo(() => chunkPages(slots), [slots])

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .summary { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: ${theme.textB}; margin-bottom: 8px; }
        .summary b { color: ${theme.textH}; font-weight: 500; }
        .meta { font-size: 11px; color: ${theme.textM}; margin-bottom: 14px; }
        .meta .tag { color: ${theme.gold}; font-weight: 500; }
        .rule { font-size: 11px; color: ${theme.textM}; margin-bottom: 14px; }
        .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 11px; color: ${theme.textM}; align-items: center; }
        .leg-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
        .leg-icon { width: 16px; height: 16px; vertical-align: middle; object-fit: contain; }
        .table-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .table-wrap { overflow-x: auto; }
        table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
        th, td { padding: 8px 12px; border-bottom: 0.5px solid ${theme.bgPage}; border-right: 0.5px solid ${theme.bgPage}; text-align: center; }
        th { font-size: 11px; color: ${theme.gold}; font-weight: 500; background: #f5c51820; }
        th.slot-col, td.slot-col { text-align: left; color: ${theme.textM}; font-size: 11px; background: ${theme.bgSurf}; position: sticky; left: 0; z-index: 1; min-width: 60px; }
        tr:last-child td { border-bottom: none; }
        .cell-lnd { color: #85b7eb; font-weight: 500; }
        .cell-tns { color: #4ade80; font-weight: 500; }
        .cell-empty { color: ${theme.bgSurf}; }
        .cell-icon { width: 16px; height: 16px; vertical-align: middle; margin-right: 5px; object-fit: contain; }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .empty { text-align: center; padding: 48px 24px; color: ${theme.textM}; font-size: 13px; }
        .empty b { color: ${theme.textB}; display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; }
      `}</style>

      <h1 className="page-title">Feather distribution</h1>
      <p className="page-sub">Combined LND + TNS slot allocation</p>

      {!distribution ? (
        <div className="table-card">
          <div className="empty">
            <b>No active distribution</b>
            Run <code>/confirmdistribution</code> in Discord to publish one — the slot table will appear here.
          </div>
        </div>
      ) : (
        <>
          <div className="summary">
            <b>{distribution.lndCount} LND</b> (limit {distribution.limitLnd} each) + <b>{distribution.tnsCount} TNS</b> (limit {distribution.limitTns} each) = <b>{slots.length} slots</b> total → <b>{pages.length} pages</b>
          </div>
          <p className="meta">
            <span className="tag">{distribution.type}</span>
            {distribution.event ? ` · Event ${distribution.event}` : ''}
            {distribution.timestamp ? ` · ${distribution.timestamp}` : ''}
          </p>
          <p className="rule">Each player gets exactly their limit — no more, no less. LND fills first, TNS continues after.</p>

          <div className="legend">
            <span><img className="leg-icon" src={ICON.LND} alt="" /> Light and Dark (LND)</span>
            <span><img className="leg-icon" src={ICON.TNS} alt="" /> Time and Space (TNS)</span>
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="slot-col">Slot</th>
                    {pages.map((_, pi) => (
                      <th key={pi}>Pg {pi + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: SLOTS_PER_PAGE }).map((_, si) => (
                    <tr key={si}>
                      <td className="slot-col">Slot {si + 1}</td>
                      {pages.map((page, pi) => {
                        const slot = page[si]
                        if (!slot) return <td key={pi} className="cell-empty">—</td>
                        return (
                          <td key={pi} className={slot.type === 'LND' ? 'cell-lnd' : 'cell-tns'}>
                            <img className="cell-icon" src={ICON[slot.type]} alt={slot.type} />{slot.player}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="foot">{distribution.queue.length} bidders · Last updated: {lastUpdated}</div>
          </div>
        </>
      )}
    </Layout>
  )
}

// Parse the confirmed Feathers row from the Distributions tab into grid inputs.
// Items column looks like: "30 LND (limit 3), 20 TNS (limit 2)"
// Recipients column is the ranked bidder list, e.g. "🛡️ Admin Fee, Bananaa, aremes, ..."
function parseDistribution(row) {
  const items = row.items || ''
  const lndMatch = items.match(/(\d+)\s*LND\s*\(\s*limit\s*(\d+)\s*\)/i)
  const tnsMatch = items.match(/(\d+)\s*TNS\s*\(\s*limit\s*(\d+)\s*\)/i)
  if (!lndMatch && !tnsMatch) return null

  const lnd = lndMatch ? parseInt(lndMatch[1], 10) : 0
  const limitLnd = lndMatch ? parseInt(lndMatch[2], 10) : 1
  const tns = tnsMatch ? parseInt(tnsMatch[1], 10) : 0
  const limitTns = tnsMatch ? parseInt(tnsMatch[2], 10) : 1

  // Ranked bidder queue, excluding the deactivated admin slot.
  const queue = String(row.recipients || '')
    .split(',')
    .map(r => r.trim())
    .filter(r => r && !/admin/i.test(r))

  const slots = buildSlots(queue, lnd, tns, limitLnd, limitTns)
  return {
    lnd, tns, limitLnd, limitTns, queue,
    lndCount: slots.filter(s => s.type === 'LND').length,
    tnsCount: slots.filter(s => s.type === 'TNS').length,
    type: row.type || 'Feathers',
    event: row.event || '',
    timestamp: row.timestamp || '',
  }
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const rows = await getDistributions()
  // Most recent confirmed Feathers distribution (rows are chronological).
  const featherRow = [...rows].reverse().find(r => /feather/i.test(r['Type'] || ''))

  let distribution = null
  if (featherRow) {
    distribution = parseDistribution({
      type: featherRow['Type'],
      event: featherRow['Event'],
      recipients: featherRow['Recipients'],
      items: featherRow['Items'],
      timestamp: featherRow['Timestamp'],
    })
  }

  return {
    props: {
      user: session.user,
      distribution,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    },
  }
}
