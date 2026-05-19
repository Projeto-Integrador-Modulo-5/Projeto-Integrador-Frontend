import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import styles from './Header.module.css';

/* ── ícones inline ───────────────────────────────────────────────── */
const Ic = ({ d, size = 18, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const ISearch = () => <Ic d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>}/>;
const IBell   = () => <Ic d={<><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></>}/>;
const IHeart  = () => <Ic d={<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></>}/>;
const IUser   = () => <Ic d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>}/>;
const IBag    = () => <Ic d={<><path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8zM9 8V6a3 3 0 016 0v2"/></>}/>;
const ITruck  = () => <Ic size={13} d={<><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}/>;

const PROMO_MSGS = [
  { icon: true,  text: <span>Frete grátis em compras acima de <b>R$ 199</b></span> },
  { icon: false, text: <span>Trocas grátis em <b>30 dias</b> — sem burocracia</span> },
  { icon: false, text: <span>Use <b className="promoCod">PRIMEIRA10</b> e ganhe <b>10% off</b></span> },
];

export default function Header({
  notificationCount = 0,
  favCount          = 0,
  onNotifOpen,
  onFavOpen,
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, setDrawerOpen } = useCart();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  /* ── Carrossel da promo strip ──────────────────────────────────── */
  const [promoIdx, setPromoIdx]       = useState(0);
  const [promoVisible, setPromoVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // fade out
      setPromoVisible(false);
      setTimeout(() => {
        setPromoIdx((i) => (i + 1) % PROMO_MSGS.length);
        setPromoVisible(true);   // fade in com novo texto
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Sincroniza o input quando o parâmetro muda (ex: voltar no histórico)
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/');
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    if (searchParams.get('q')) navigate('/');
  };

  return (
    <>
      {/* ── Promo strip ─────────────────────────────────────── */}
      {!isAdmin && (
        <div className={styles.promo}>
          {/* Esquerda: carrossel de promoções */}
          <div className={styles.promoLeft}>
            {PROMO_MSGS[promoIdx].icon && <ITruck/>}
            <span
              className={styles.promoMsg}
              style={{ opacity: promoVisible ? 1 : 0, transform: promoVisible ? 'translateY(0)' : 'translateY(6px)' }}
            >
              {PROMO_MSGS[promoIdx].text}
            </span>
            {/* Indicadores de posição */}
            <span className={styles.promoDots}>
              {PROMO_MSGS.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.promoDot} ${i === promoIdx ? styles.promoDotActive : ''}`}
                  onClick={() => { setPromoVisible(false); setTimeout(() => { setPromoIdx(i); setPromoVisible(true); }, 350); }}
                />
              ))}
            </span>
          </div>
          {/* Direita: stats da coleção */}
          <div className={styles.promoRight}>
            <span>4.7 ★ <span style={{ opacity: 0.6 }}>1.2k aval.</span></span>
            <span className={styles.dotsep}/>
            <span>30 dias <span style={{ opacity: 0.6 }}>trocas grátis</span></span>
          </div>
        </div>
      )}

      {/* ── Header principal ─────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerRow}>

          {/* Brand */}
          <Link to={isAdmin ? '/admin/dashboard' : '/'} className={styles.brand}>
            <div className={styles.brandMark}>T</div>
            <span>TeeStore</span>
          </Link>

          {/* Nav */}
          {!isAdmin && (
            <nav className={styles.nav}>
              <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.navActive : ''}`}>Loja</Link>
              {isAuthenticated && (
                <Link to="/orders" className={`${styles.navLink} ${isActive('/orders') ? styles.navActive : ''}`}>Meus Pedidos</Link>
              )}
            </nav>
          )}

          {isAdmin && (
            <nav className={styles.nav}>
              <Link to="/admin/dashboard" className={`${styles.navLink} ${location.pathname.startsWith('/admin') ? styles.navActive : ''}`}>
                Admin
              </Link>
            </nav>
          )}

          {/* Search — apenas loja */}
          {!isAdmin && (
            <form className={styles.search} onSubmit={handleSearch} role="search">
              <span className={styles.searchIcon}><ISearch/></span>
              <input
                className={styles.searchInput}
                placeholder="Buscar camisetas, coleções…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}
                aria-label="Buscar produtos"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={handleClearSearch}
                  aria-label="Limpar busca"
                >
                  ×
                </button>
              )}
            </form>
          )}

          {/* Ícones à direita */}
          <div className={styles.actions}>

            {!isAdmin && isAuthenticated && (
              <button
                className={styles.iconBtn}
                title="Notificações"
                onClick={onNotifOpen}
              >
                <IBell/>
                {notificationCount > 0 && (
                  <span className={styles.badge}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {!isAdmin && isAuthenticated && (
              <button
                className={styles.iconBtn}
                title="Favoritos"
                onClick={onFavOpen}
              >
                <IHeart/>
              </button>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/profile" className={styles.iconBtn} title={user?.name ?? 'Minha conta'}>
                  <IUser/>
                </Link>
                <button className={styles.logoutBtn} onClick={handleLogout}>Sair</button>
              </>
            ) : (
              <Link to="/login" className={styles.loginBtn}>Entrar</Link>
            )}

            {!isAdmin && (
              <button
                className={styles.iconBtn}
                title="Carrinho"
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  setDrawerOpen(true);
                }}
              >
                <IBag/>
                {itemCount > 0 && (
                  <span className={styles.badge}>{itemCount > 9 ? '9+' : itemCount}</span>
                )}
              </button>
            )}

          </div>
        </div>
      </header>
    </>
  );
}
