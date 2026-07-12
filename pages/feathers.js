import { useMemo } from 'react'
import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getFeatherBidders } from '../lib/sheets'
import { theme } from '../lib/styles'

const SLOTS_PER_PAGE = 4

// Icon image files live in public/icons/.
const ICON = { LND: '/icons/lnd.png', TNS: '/icons/tns.png' }

// Build the flat slot sequence from per-bidder counts:
// all LND slots first (each bidder maximized, in order), then all TNS slots.
function buildSlots(bidders) {
  const slots = []
  bidders.forEach(b => {
    for (let i = 0; i < b.lnd; i++) slots.push({ player: b.name, type: 'LND' })
  })
  bidders.forEach(b => {
    for (let i = 0; i < b.tns; i++) slots.push({ player: b.name, type: 'TNS' })
  })
  return slots
}

function chunkPages(slots) {
  const pages = []
  for (let i = 0; i < slots.length; i += SLOTS_PER_PAGE) {
    pages.push(slots.slice(i, i + SLOTS_PER_PAGE))
  }
  return pages
}

export default function Feathers({ user, bidders, lastUpdated }) {
  const slots = useMemo(() => buildSlots(bidders), [bidders])
  const pages = useMemo(() => chunkPages(slots), [slots])

  const lndCount = slots.filter(s => s.type === 'LND').length
  const tnsCount = slots.filter(s => s.type === 'TNS').length
  const active = slots.length > 0

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .summary { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: ${theme.textB}; margin-bottom: 8px; }
        .summary b { color: ${theme.textH}; font-weight: 500; }
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
        .empty code { background: ${theme.bgSurf}; padding: 1px 6px; border-radius: 3px; color: ${theme.textB}; }
      `}</style>

      <h1 className="page-title">Feather distribution</h1>
      <p className="page-sub">Combined LND + TNS slot allocation</p>

      {!active ? (
        <div className="table-card">
          <div className="empty">
            <b>No active distribution</b>
            Add bidders to the <code>FeatherDistribution</code> tab in the Google Sheet (columns: Bidder, LND, TNS) and the slot table will appear here.
          </div>
        </div>
      ) : (
        <>
          <div className="summary">
            <b>{lndCount} LND</b> + <b>{tnsCount} TNS</b> = <b>{slots.length} slots</b> total → <b>{pages.length} pages</b> · {bidders.length} bidders
          </div>
          <p className="rule">Each bidder gets exactly their listed slots. LND fills first, TNS continues after.</p>

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
            <div className="foot">Last updated: {lastUpdated}</div>
          </div>
        </>
      )}
    </Layout>
  )
}

// Parse the FeatherDistribution tab rows into { name, lnd, tns }, ranked order preserved.
function parseBidders(rows) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const nameKey = headers.find(h => /bidder|name|player|ign|member|user/i.test(h)) || headers[0]
  const lndKey = headers.find(h => /lnd/i.test(h))
  const tnsKey = headers.find(h => /tns/i.test(h))

  return rows
    .map(r => ({
      name: String(r[nameKey] || '').trim(),
      lnd: parseInt(r[lndKey], 10) || 0,
      tns: parseInt(r[tnsKey], 10) || 0,
    }))
    .filter(b => b.name && !/admin/i.test(b.name) && (b.lnd > 0 || b.tns > 0))
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const rows = await getFeatherBidders()
  const bidders = parseBidders(rows)

  return {
    props: {
      user: session.user,
      bidders,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    },
  }
}
