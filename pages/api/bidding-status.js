import { getSession } from '../../lib/auth'
import { getFeatherBidders } from '../../lib/sheets'

// Reports whether any feather distribution is currently active.
export default async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session.user) return res.status(200).json({ active: false })

  // Let the browser reuse this for 30s so per-navigation polling doesn't
  // add load during events.
  res.setHeader('Cache-Control', 'private, max-age=30')

  try {
    const [a, b] = await Promise.all([
      getFeatherBidders('FeatherDistribution'),
      getFeatherBidders('LeaguePrizeFeathers'),
    ])
    res.status(200).json({ active: a.length > 0 || b.length > 0 })
  } catch (err) {
    res.status(200).json({ active: false })
  }
}
