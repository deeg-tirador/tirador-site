import { exchangeCode, getDiscordUser, getGuildMember, getSession } from '../../../lib/auth'

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.redirect('/login?error=no_code')

  try {
    // Exchange code for token
    const tokenData = await exchangeCode(code)
    if (!tokenData.access_token) return res.redirect('/login?error=token_failed')

    // Get Discord user
    const discordUser = await getDiscordUser(tokenData.access_token)
    if (!discordUser.id) return res.redirect('/login?error=user_failed')

    // Check guild membership and role
    const member = await getGuildMember(tokenData.access_token)
    if (!member || !member.roles) return res.redirect('/login?error=access_denied')

    // Fetch guild roles to find the ingame role ID
    const rolesRes = await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
    )
    const allRoles = await rolesRes.json()
    const requiredRole = allRoles.find(
      r => r.name.toLowerCase() === process.env.DISCORD_REQUIRED_ROLE.toLowerCase()
    )

    if (!requiredRole || !member.roles.includes(requiredRole.id)) {
      return res.redirect('/login?error=access_denied')
    }

    // Save session
    const session = await getSession(req, res)
    session.user = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: discordUser.avatar,
      accessToken: tokenData.access_token,
    }
    await session.save()

    res.redirect('/')
  } catch (err) {
    console.error('Auth error:', err)
    res.redirect('/login?error=server_error')
  }
}
