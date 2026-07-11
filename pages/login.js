import Head from 'next/head'
import Image from 'next/image'
import { getDiscordAuthUrl } from '../lib/auth'
import { globalStyles, theme } from '../lib/styles'

export default function Login({ authUrl, error }) {
  return (
    <>
      <Head>
        <title>Tirador ROOC — Login</title>
        <link rel="icon" href="/logo.png" />
      </Head>
      <style>{globalStyles}</style>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: ${theme.bgPage};
        }
        .glow {
          position: fixed;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,98,26,0.06) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .logo-wrap {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 2px solid ${theme.gold};
          overflow: hidden;
          margin-bottom: 16px;
          background: ${theme.bgSurf};
          box-shadow: 0 0 40px rgba(245,197,24,0.12);
        }
        .guild-title {
          font-size: 32px;
          font-weight: 500;
          color: ${theme.gold};
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .guild-tagline {
          font-size: 12px;
          color: ${theme.textM};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .login-card {
          background: ${theme.bgCard};
          border: 0.5px solid ${theme.border};
          border-radius: 16px;
          padding: 28px 32px;
          width: 320px;
          text-align: center;
        }
        .divider {
          width: 40px;
          height: 2px;
          background: ${theme.orange};
          border-radius: 1px;
          margin: 0 auto 16px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 500;
          color: ${theme.textH};
          margin-bottom: 8px;
        }
        .card-sub {
          font-size: 12px;
          color: ${theme.textM};
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .discord-btn {
          background: #5865F2;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
        }
        .login-note {
          font-size: 11px;
          color: ${theme.textM};
          margin-top: 14px;
          line-height: 1.5;
        }
        .error-box {
          background: #200a0a;
          border: 0.5px solid #401a1a;
          border-radius: 8px;
          padding: 12px;
          margin-top: 14px;
          font-size: 12px;
          color: #f87171;
        }
      `}</style>

      <div className="login-page">
        <div className="glow" />
        <div className="logo-wrap">
          <Image src="/logo.png" alt="Tirador ROOC" width={120} height={120} style={{ objectFit: 'cover' }} />
        </div>
        <h1 className="guild-title">TIRADOR</h1>
        <p className="guild-tagline">NG ATE, TITA, MAMA, LOLA</p>

        <div className="login-card">
          <div className="divider" />
          <p className="card-title">Guild Members Only</p>
          <p className="card-sub">Log in with your Discord account to access the Tirador ROOC guild portal.</p>
          <a href={authUrl} className="discord-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.102.132 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Login with Discord
          </a>
          <p className="login-note">You must have the <strong style={{color: theme.textB}}>ingame</strong> role in Tirador ROOC to access this site.</p>
          {error === 'access_denied' && (
            <div className="error-box">
              You are not a member of Tirador ROOC.<br />Contact your guild leader for access.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      authUrl: getDiscordAuthUrl(),
      error: query.error || null,
    }
  }
}
