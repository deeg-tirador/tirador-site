import { getIronSession } from 'iron-session'

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'tirador_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions)
}

export function getDiscordAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.members.read',
  })
  return `https://discord.com/api/oauth2/authorize?${params}`
}

export async function exchangeCode(code) {
  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    }),
  })
  return res.json()
}

export async function getDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

export async function getGuildMember(accessToken) {
  const res = await fetch(
    `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  return res.json()
}

export async function hasRequiredRole(accessToken) {
  const member = await getGuildMember(accessToken)
  if (!member || !member.roles) return false

  // Get all roles from guild to find the ingame role ID
  const rolesRes = await fetch(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/roles`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  )
  const allRoles = await rolesRes.json()
  const requiredRole = allRoles.find(
    r => r.name.toLowerCase() === process.env.DISCORD_REQUIRED_ROLE.toLowerCase()
  )
  if (!requiredRole) return false
  return member.roles.includes(requiredRole.id)
}

export async function requireAuth(req, res) {
  const session = await getSession(req, res)
  if (!session.user) {
    res.redirect('/login')
    return null
  }
  return session.user
}
