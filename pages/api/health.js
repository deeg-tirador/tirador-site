// Diagnostic endpoint: reports env var status and Sheets connectivity
// without exposing any secret values. Safe to leave deployed.
import { getLeaderboard } from '../../lib/sheets'

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PRIVATE_KEY || ''
  const diagnostics = {
    env: {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_PRIVATE_KEY: {
        present: !!key,
        length: key.length,
        startsWithQuote: key.startsWith('"') || key.startsWith("'"),
        hasLiteralBackslashN: key.includes('\\n'),
        hasRealNewlines: key.includes('\n'),
        hasBeginHeader: key.includes('BEGIN PRIVATE KEY'),
      },
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
      DISCORD_REDIRECT_URI: !!process.env.DISCORD_REDIRECT_URI,
    },
  }

  try {
    const rows = await getLeaderboard()
    diagnostics.sheets = { ok: true, rowCount: rows.length }
  } catch (err) {
    diagnostics.sheets = { ok: false, error: err.message }
  }

  res.status(diagnostics.sheets.ok ? 200 : 500).json(diagnostics)
}
