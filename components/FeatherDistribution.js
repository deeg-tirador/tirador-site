import { useMemo } from 'react'
import { theme } from '../lib/styles'

const SLOTS_PER_PAGE = 4
const ICON = { LND: '/icons/lnd.png', TNS: '/icons/tns.png' }

// Flat slot sequence: all LND slots first (each bidder maximized, in order),
// then all TNS slots.
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

// Renders the feather slot grid when a distribution is active, or an
// empty banner when not. `emptyText` customizes the inactive message.
export default function FeatherDistribution({ bidders = [], emptyText = 'No current active bidding' }) {
  const slots = useMemo(() => buildSlots(bidders), [bidders])
  const pages = useMemo(() => chunkPages(slots), [slots])
  const lndCount = slots.filter(s => s.type === 'LND').length
  const tnsCount = slots.filter(s => s.type === 'TNS').length
  const active = slots.length > 0

  return (
    <div className="fd">
      <style>{`
        .fd { margin-bottom: 20px; }
        .fd-summary { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-left: 2px solid ${theme.orange}; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: ${theme.textB}; margin-bottom: 8px; }
        .fd-summary b { color: ${theme.textH}; font-weight: 500; }
        .fd-rule { font-size: 11px; color: ${theme.textM}; margin-bottom: 12px; }
        .fd-legend { display: flex; flex-wrap: wrap; gap: 18px; margin-bottom: 12px; font-size: 12px; color: ${theme.textB}; align-items: center; }
        .fd-legend span { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
        .fd-leg-icon { width: 26px; height: 26px; vertical-align: middle; object-fit: contain; }
        .fd-card { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; overflow: hidden; }
        .fd-wrap { overflow-x: auto; }
        .fd table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
        .fd th, .fd td { padding: 8px 12px; border-bottom: 0.5px solid ${theme.bgPage}; border-right: 0.5px solid ${theme.bgPage}; text-align: center; }
        .fd th { font-size: 11px; color: ${theme.gold}; font-weight: 500; background: #f5c51820; }
        .fd th.fd-slot, .fd td.fd-slot { text-align: left; color: ${theme.textM}; font-size: 11px; background: ${theme.bgSurf}; position: sticky; left: 0; z-index: 1; min-width: 60px; }
        .fd tr:last-child td { border-bottom: none; }
        .fd-lnd { color: #85b7eb; font-weight: 500; }
        .fd-tns { color: #4ade80; font-weight: 500; }
        .fd-cell-empty { color: ${theme.bgSurf}; }
        .fd-icon { width: 24px; height: 24px; vertical-align: middle; margin-right: 7px; object-fit: contain; }
        .fd-foot { font-size: 10px; color: ${theme.textM}; padding: 8px 12px; border-top: 0.5px solid ${theme.border}; }
        .fd-empty { background: ${theme.bgCard}; border: 0.5px solid ${theme.border}; border-radius: 10px; padding: 18px 20px; text-align: center; color: ${theme.textM}; font-size: 13px; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; }
        .fd-head { font-size: 13px; font-weight: 500; color: ${theme.gold}; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .fd-live { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; display: inline-block; }
      `}</style>

      {!active ? (
        <div className="fd-empty">{emptyText}</div>
      ) : (
        <>
          <div className="fd-head"><span className="fd-live" /> Active feather distribution</div>
          <div className="fd-summary">
            <b>{lndCount} LND</b> + <b>{tnsCount} TNS</b> = <b>{slots.length} slots</b> → <b>{pages.length} pages</b> · {bidders.length} bidders
          </div>
          <p className="fd-rule">LND fills first, TNS continues after. Each bidder gets exactly their listed slots.</p>
          <div className="fd-legend">
            <span><img className="fd-leg-icon" src={ICON.LND} alt="" /> Light and Dark (LND)</span>
            <span><img className="fd-leg-icon" src={ICON.TNS} alt="" /> Time and Space (TNS)</span>
          </div>
          <div className="fd-card">
            <div className="fd-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="fd-slot">Slot</th>
                    {pages.map((_, pi) => <th key={pi}>Page {pi + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: SLOTS_PER_PAGE }).map((_, si) => (
                    <tr key={si}>
                      <td className="fd-slot">Slot {si + 1}</td>
                      {pages.map((page, pi) => {
                        const slot = page[si]
                        if (!slot) return <td key={pi} className="fd-cell-empty">—</td>
                        return (
                          <td key={pi} className={slot.type === 'LND' ? 'fd-lnd' : 'fd-tns'}>
                            <img className="fd-icon" src={ICON[slot.type]} alt={slot.type} />{slot.player}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
