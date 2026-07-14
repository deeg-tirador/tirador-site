import Layout from '../components/Layout'
import FeatherDistribution from '../components/FeatherDistribution'
import Dashboard from '../components/Dashboard'
import { getSession } from '../lib/auth'
import { getLeaderboard, getFeatherBidders, getCpGainsThisWeek } from '../lib/sheets'

export default function Home({ user, members, bidders, prizeBidders, cpGains }) {
  return (
    <Layout user={user}>
      <FeatherDistribution title="Guild League › Feathers" bidders={bidders} emptyText="No current active bidding" />
      <FeatherDistribution title="League Prize › Feathers" bidders={prizeBidders} emptyText="No current active bidding" />

      <Dashboard members={members} cpGains={cpGains} />
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const [members, bidders, prizeBidders, cpGains] = await Promise.all([
    getLeaderboard(),
    getFeatherBidders('FeatherDistribution'),
    getFeatherBidders('LeaguePrizeFeathers'),
    getCpGainsThisWeek(5),
  ])
  return {
    props: {
      user: session.user,
      members,
      bidders,
      prizeBidders,
      cpGains,
    }
  }
}
