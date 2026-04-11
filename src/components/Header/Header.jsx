import styles from './Header.module.css';

export default function Header({ notificationCount = 0, cartCount = 0 }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>

        {/* Logo */}
        <span className={styles.logo}>TeeStore</span>

        {/* Navegação */}
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Loja</a>
          <a href="#" className={styles.navLink}>Meus Pedidos</a>
          <a href="#" className={styles.navLink}>Admin</a>
        </nav>

        {/* Ícones */}
        <div className={styles.icons}>

          {/* Perfil */}
          <button className={styles.iconBtn} title="Perfil" aria-label="Perfil">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>

          {/* Notificações */}
          <button className={styles.iconBtn} title="Notificações" aria-label="Notificações">
            <div className={styles.iconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notificationCount > 0 && (
                <span className={styles.badge}>{notificationCount > 9 ? '9+' : notificationCount}</span>
              )}
            </div>
          </button>

          {/* Carrinho */}
          <button className={styles.iconBtn} title="Carrinho" aria-label="Carrinho">
            <div className={styles.iconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </div>
          </button>

        </div>
      </div>
    </header>
  );
}
