import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import { theme, globalStyles } from '../lib/styles'

const NAV_LINKS = [
  { href: '/',             label: 'Leaderboard' },
  { href: '/rankings',     label: 'Rankings'    },
  { href: '/attendance',   label: 'Attendance'  },
  { href: '/distributions',label: 'Distributions'},
  { href: '/feathers',     label: 'Feathers'    },
  { href: '/cardqueue',    label: 'Card Queue'  },
]

export default function Layout({ children, user }) {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Tirador ROOC — Guild Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <style>{globalStyles}</style>
      <style>{`
        .nav {
          background: ${theme.bgNav};
          border-bottom: 0.5px solid ${theme.border};
          padding: 0 20px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid ${theme.gold};
          overflow: hidden;
          background: ${theme.bgSurf};
        }
        .brand-name {
          font-size: 14px;
          font-weight: 500;
          color: ${theme.gold};
          letter-spacing: 0.03em;
        }
        .brand-badge {
          background: ${theme.orange};
          color: #fff;
          font-size: 9px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 3px;
        }
        .nav-links {
          display: flex;
          gap: 2px;
        }
        .nav-link {
          font-size: 12px;
          color: ${theme.textB};
          padding: 5px 12px;
          border-radius: 6px;
          border: 0.5px solid transparent;
          background: none;
          text-decoration: none;
          display: block;
        }
        .nav-link.active {
          background: ${theme.bgSurf};
          color: ${theme.gold};
          font-weight: 500;
          border-color: ${theme.border};
        }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid ${theme.gold};
          overflow: hidden;
          background: ${theme.bgSurf};
        }
        .nav-username {
          font-size: 12px;
          color: ${theme.textB};
        }
        .logout-btn {
          font-size: 11px;
          color: ${theme.textM};
          background: none;
          border: 0.5px solid ${theme.border};
          border-radius: 4px;
          padding: 3px 8px;
        }
        .page-body {
          padding: 24px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .nav { padding: 0 12px; }
          .nav-links { display: none; }
          .page-body { padding: 16px 12px; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="brand">
          <div className="brand-logo">
            <Image src="/logo.png" alt="Tirador ROOC" width={32} height={32} style={{ objectFit: 'cover' }} />
          </div>
          <span className="brand-name">Tirador ROOC</span>
          <span className="brand-badge">GUILD</span>
        </a>

        <div className="nav-links">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`nav-link${router.pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-user">
          {user?.avatar ? (
            <div className="nav-avatar">
              <Image
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                alt={user.username}
                width={28}
                height={28}
              />
            </div>
          ) : (
            <div className="nav-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: theme.gold }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="nav-username">{user?.globalName || user?.username}</span>
          <a href="/api/auth/logout">
            <button className="logout-btn">Logout</button>
          </a>
        </div>
      </nav>

      <div className="page-body">
        {children}
      </div>
    </>
  )
}
