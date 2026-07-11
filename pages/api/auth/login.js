import { getDiscordAuthUrl } from '../../../lib/auth'

export default function handler(req, res) {
  res.redirect(getDiscordAuthUrl())
}
