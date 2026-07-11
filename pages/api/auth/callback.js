import { exchangeCode, getDiscordUser, getGuildMember, getSession } from '../../../lib/auth'

const REQUIRED_ROLE_ID = '1514195997729751160'

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.redirect('/login?error=no_code')

  try {
    const tokenData = await exchangeCode(code)
    if (!tokenData.access_token) return res.redirect('/login?error=token_failed')

    const discordUser = await getDiscordUser(tokenData.access_token)
    if (!discordUser.id) return res.redirect('/login?error=user_failed')

    const member = await getGuildMember(tokenData.access_token)
    console.log('Member:', JSON.stringify(member))

    const hasRole = member?.roles?.includes(REQUIRED_ROLE_ID)
    console.log('Has role:', hasRole)

    if (!hasRole) return res.redirect('/login?error=access_denied')

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