import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.css';

/* ── ícones SVG inline ─────────────────────────────────────── */
const Ic = ({ d, size = 16, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IcHome    = () => <Ic d={<><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/></>}/>;
const IcOrders  = () => <Ic d={<><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.5 11h11l2-7H6.5"/></>}/>;
const IcBox     = () => <Ic d={<><path d="M3.5 7.5L12 3l8.5 4.5M3.5 7.5L12 12m-8.5-4.5v9L12 21m0-9l8.5-4.5M12 12v9m8.5-13.5v9L12 21"/></>}/>;
const IcBell    = () => <Ic d={<><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></>}/>;
const IcSearch  = () => <Ic d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>}/>;
const IcCog     = () => <Ic d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>}/>;
const IcLogout  = () => <Ic d={<><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></>}/>;
const IcUser    = () => <Ic d={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}/>;

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard',   icon: <IcHome /> },
  { to: '/admin/orders',    label: 'Pedidos',      icon: <IcOrders /> },
  { to: '/admin/products',  label: 'Produtos',     icon: <IcBox /> },
];

function Avatar({ name = '', size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials || '?'}
    </div>
  );
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pageName = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label ?? 'Admin';

  return (
    <div className={styles.app}>
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>T</div>
          <span className={styles.brandName}>TeeStore</span>
          <span className={styles.brandSub}>Admin</span>
        </div>

        <nav className={styles.navGroup}>
          <span className={styles.navLabel}>Geral</span>
          {NAV_ITEMS.map(({ to, label, icon }) => {
            const active = location.pathname === to ||
              (to !== '/admin/dashboard' && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`${styles.navItem} ${active ? styles.navActive : ''}`}>
                <span className={styles.navIcon}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <nav className={styles.navGroup}>
          <span className={styles.navLabel}>Conta</span>
          <div className={styles.navItem} style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <span className={styles.navIcon}><IcLogout /></span>
            Sair
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <Avatar name={user?.name} size={32} />
          <div className={styles.footerInfo}>
            <div className={styles.footerName}>{user?.name ?? 'Admin'}</div>
            <div className={styles.footerRole}>{user?.email ?? ''}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
