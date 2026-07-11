import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { getSession } from '../lib/auth'
import { getFeatherQueue } from '../lib/sheets'
import { theme } from '../lib/styles'

const SLOTS_PER_PAGE = 4

// Icon image files live in public/icons/. Save the gift-box images there.
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
        slots.push({ player, type, n: k + 1, limit })
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

export default function Feathers({ user, queue, lastUpdated }) {
  const [lnd, setLnd] = useState(30)
  const [tns, setTns] = useState(20)
  const [limitLnd, setLimitLnd] = useState(3)
  const [limitTns, setLimitTns] = useState(2)

  const slots = useMemo(
    () => buildSlots(queue, num(lnd), num(tns), num(limitLnd), num(limitTns)),
    [queue, lnd, tns, limitLnd, limitTns]
  )
  const pages = useMemo(() => chunkPages(slots), [slots])

  const totalSlots = slots.length
  const lndCount = slots.filter(s => s.type === 'LND').length
  const tnsCount = slots.filter(s => s.type === 'TNS').length

  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .controls { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .ctrl { display: flex; flex-direction: column; gap: 3px; }
        .ctrl label { font-size: 10px; color: ${theme.textM}; }
        .ctrl input { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 6px; padding: 6px 8px; font-size: 12px; color: ${theme.textH}; width: 90px; }
        .summary { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: ${theme.textB}; margin-bottom: 8px; }
        .summary b { color: ${theme.textH}; font-weight: 500; }
        .rule { font-size: 11px; color: ${theme.textM}; margin-bottom: 14px; }
        .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 11px; color: ${theme.textM}; align-items: center; }
        .leg-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
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
        .leg-icon { width: 16px; height: 16px; vertical-align: middle; object-fit: contain; }
        .foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .empty { text-align: center; padding: 40px; color: ${theme.textM}; font-size: 13px; }
      `}</style>

      <h1 className="page-title">Feather distribution</h1>
      <p className="page-sub">Combined LND + TNS slot allocation — queue ranked by Total Points</p>

      <div className="controls">
        <div className="ctrl"><label>LND slots</label><input type="number" min="0" value={lnd} onChange={e => setLnd(e.target.value)} /></div>
        <div className="ctrl"><label>TNS slots</label><input type="number" min="0" value={tns} onChange={e => setTns(e.target.value)} /></div>
        <div className="ctrl"><label>LND limit / player</label><input type="number" min="1" value={limitLnd} onChange={e => setLimitLnd(e.target.value)} /></div>
        <div className="ctrl"><label>TNS limit / player</label><input type="number" min="1" value={limitTns} onChange={e => setLimitTns(e.target.value)} /></div>
      </div>

      <div className="summary">
        <b>{lndCount} LND</b> (limit {num(limitLnd)} each) + <b>{tnsCount} TNS</b> (limit {num(limitTns)} each) = <b>{totalSlots} slots</b> total → <b>{pages.length} pages</b>
      </div>
      <p className="rule">Each player gets exactly their limit — no more, no less. LND fills first, TNS continues after.</p>

      <div className="legend">
        <span><img className="leg-icon" src={ICON.LND} alt="" /> Light and Dark (LND)</span>
        <span><img className="leg-icon" src={ICON.TNS} alt="" /> Time and Space (TNS)</span>
      </div>

      <div className="table-card">
        {queue.length === 0 ? (
          <div className="empty">No players found in the Points tab.</div>
        ) : (
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
        )}
        <div className="foot">Queue: {queue.length} players · Last updated: {lastUpdated}</div>
      </div>
    </Layout>
  )
}

function num(v) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const queue = await getFeatherQueue()
  return {
    props: {
      user: session.user,
      queue,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    },
  }
}
