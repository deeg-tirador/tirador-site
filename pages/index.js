import Layout from '../components/Layout'
import Dashboard from '../components/Dashboard'
import { getSession } from '../lib/auth'
import { getLeaderboard, getCpGainsThisWeek } from '../lib/sheets'

export default function Home({ user, members, cpGains }) {
  return (
    <Layout user={user}>
      <Dashboard members={members} cpGains={cpGains} />
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const [members, cpGains] = await Promise.all([
    getLeaderboard(),
    getCpGainsThisWeek(5),
  ])
  return {
    props: {
      user: session.user,
      members,
      cpGains,
    }
  }
}
