import { google } from 'googleapis'

function getPrivateKey() {
  // Preferred: base64-encoded PEM. Immune to newline/quote/paste mangling
  // because the value is a single line with no special characters.
  const b64 = process.env.GOOGLE_PRIVATE_KEY_BASE64
  if (b64) {
    const decoded = Buffer.from(b64.trim(), 'base64').toString('utf8')
    if (!decoded.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('GOOGLE_PRIVATE_KEY_BASE64 did not decode to a valid PEM key')
    }
    return decoded
  }

  let key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) {
    throw new Error('Neither GOOGLE_PRIVATE_KEY_BASE64 nor GOOGLE_PRIVATE_KEY is set')
  }
  key = key.trim()
  // Strip surrounding quotes (common when pasted from the service account JSON)
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  // Convert literal \n sequences to real newlines
  key = key.replace(/\\n/g, '\n')
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('GOOGLE_PRIVATE_KEY does not look like a valid PEM key (missing BEGIN header)')
  }
  return key
}

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    getPrivateKey(),
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  )
}

async function getSheet(tabName) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: tabName,
  })
  const [headers, ...rows] = res.data.values || []
  return rows.map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] || '' })
    return obj
  })
}

export async function getLeaderboard() {
  const rows = await getSheet('Sheet1')
  return rows
    .filter(r => r['Status'] !== 'Removed' && r['Status'] !== 'Pending')
    .map(r => ({
      userId: r['User ID'],
      username: r['Username'],
      displayName: r['Display Name'],
      class: r['Class'],
      cp: parseFloat(r['CP']) || 0,
      patk: parseFloat(r['PATK']) || 0,
      matk: parseFloat(r['MATK']) || 0,
      pdef: parseFloat(r['PDEF']) || 0,
      mdef: parseFloat(r['MDEF']) || 0,
      pdmg: parseFloat(r['PDMG']) || 0,
      mdmg: parseFloat(r['MDMG']) || 0,
      pdmgR: parseFloat(r['PDMG.R']) || 0,
      mdmgR: parseFloat(r['MDMG.R']) || 0,
      ignorePdef: parseFloat(r['IGNORE_PDEF']) || 0,
      ignoreMdef: parseFloat(r['IGNORE_MDEF']) || 0,
      pvpDmg: parseFloat(r['PVP_DMG']) || 0,
      pvpReduction: parseFloat(r['PVP_REDUCTION']) || 0,
      hp: parseFloat(r['HP']) || 0,
      screenshotUrl: r['Screenshot URL'],
      lastUpdated: r['Last Updated'],
      status: r['Status'] || 'Active',
    }))
}

export async function getAttendance() {
  return getSheet('Attendance')
}

export async function getPoints() {
  return getSheet('Points')
}

export async function getDistributions() {
  return getSheet('Distributions')
}

// Per-member stat history (time series) from the History tab, oldest first.
export async function getMemberHistory(userId) {
  let rows
  try {
    rows = await getSheet('History')
  } catch (err) {
    return []
  }
  const n = v => parseFloat(String(v ?? '').replace(/,/g, '').replace(/%/g, '')) || 0
  return rows
    .filter(r => String(r['User ID']) === String(userId))
    .map(r => ({
      ts: r['Timestamp'],
      date: String(r['Timestamp'] || '').split(' ')[0],
      cp: n(r['CP']),
      patk: n(r['PATK']), matk: n(r['MATK']),
      pdef: n(r['PDEF']), mdef: n(r['MDEF']),
      pdmg: n(r['PDMG']), mdmg: n(r['MDMG']),
      pdmgR: n(r['PDMG.R']), mdmgR: n(r['MDMG.R']),
      ignorePdef: n(r['IGNORE_PDEF']), ignoreMdef: n(r['IGNORE_MDEF']),
      pvpDmg: n(r['PVP_DMG']), pvpReduction: n(r['PVP_REDUCTION']),
      hp: n(r['HP']),
    }))
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
}

// Biggest CP gainers over the last 7 days, from the History tab.
// Gain = latest CP snapshot − the snapshot from ~7 days ago (or earliest if none older).
export async function getCpGainsThisWeek(limit = 5) {
  let rows
  try {
    rows = await getSheet('History')
  } catch (err) {
    return []
  }
  const num = v => parseFloat(String(v ?? '').replace(/,/g, '')) || 0
  const byUser = {}
  rows.forEach(r => {
    const uid = String(r['User ID'] || '')
    const t = new Date(r['Timestamp']).getTime()
    if (!uid || isNaN(t)) return
    ;(byUser[uid] ||= []).push({ t, cp: num(r['CP']), name: r['Display Name'] || r['Username'] || uid, uid })
  })
  const weekAgo = Date.now() - 7 * 86400000
  const gains = []
  Object.values(byUser).forEach(list => {
    list.sort((a, b) => a.t - b.t)
    const latest = list[list.length - 1]
    let baseline = list[0]
    for (const s of list) { if (s.t <= weekAgo) baseline = s }
    const gain = latest.cp - baseline.cp
    if (gain > 0) gains.push({ uid: latest.uid, name: latest.name, gain, cp: latest.cp })
  })
  gains.sort((a, b) => b.gain - a.gain)
  return gains.slice(0, limit)
}

// Manually-maintained feather distribution: one row per bidder (ranked order)
// with per-bidder LND/TNS slot counts. Tab: FeatherDistribution.
// Returns parsed [{ name, lnd, tns }] with admin rows and empty rows removed.
export async function getFeatherBidders(tabName = 'FeatherDistribution') {
  let rows
  try {
    rows = await getSheet(tabName)
  } catch (err) {
    // Tab may not exist yet — treat as no active distribution.
    return []
  }
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

export async function getCardQueue() {
  const rows = await getSheet('CardQueue')
  return rows.sort((a, b) => parseInt(a.Position) - parseInt(b.Position))
}
