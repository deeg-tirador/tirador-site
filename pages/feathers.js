import Layout from '../components/Layout'
import FeatherDistribution from '../components/FeatherDistribution'
import { getSession } from '../lib/auth'
import { getFeatherBidders } from '../lib/sheets'
import { theme } from '../lib/styles'

export default function Feathers({ user, bidders, lastUpdated }) {
  return (
    <Layout user={user}>
      <style>{`
        .page-title { font-size: 20px; font-weight: 500; color: ${theme.textH}; margin-bottom: 4px; }
        .page-sub { font-size: 12px; color: ${theme.textM}; margin-bottom: 16px; }
        .foot { font-size: 10px; color: ${theme.textM}; margin-top: 10px; }
      `}</style>

      <h1 className="page-title">Feather distribution</h1>
      <p className="page-sub">Combined LND + TNS slot allocation</p>

      <FeatherDistribution
        bidders={bidders}
        emptyText="No current active bidding"
      />

      <p className="foot">Last updated: {lastUpdated}</p>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res)
  if (!session.user) return { redirect: { destination: '/login', permanent: false } }

  const bidders = await getFeatherBidders()
  return {
    props: {
      user: session.user,
      bidders,
      lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    },
  }
}
