import { google } from 'googleapis'

function getPrivateKey() {
  let key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) {
    throw new Error('GOOGLE_PRIVATE_KEY environment variable is not set')
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

export async function getCardQueue() {
  const rows = await getSheet('CardQueue')
  return rows.sort((a, b) => parseInt(a.Position) - parseInt(b.Position))
}
