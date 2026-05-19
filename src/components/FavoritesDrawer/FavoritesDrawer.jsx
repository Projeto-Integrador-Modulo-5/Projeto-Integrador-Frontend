import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './FavoritesDrawer.module.css';

/* ── Ícones ────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 18, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IClose     = () => <Ic d={<path d="M5 5l14 14M19 5L5 19"/>}/>;
const IHeart     = () => <Ic d={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}/>;
const IHeartFill = () => <Ic fill="currentColor" sw={0} d={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}/>;
const IArrow     = () => <Ic d={<path d="M5 12h14M13 5l7 7-7 7"/>}/>;

/* ── Placeholder camiseta ──────────────────────────────────────────── */
const SHIRT_COLORS = ['#161513', '#9c978d', '#ffffff', '#1f3a5f', '#5a6442', '#7a3030', '#cfc7b6', '#e8e2d4'];
const BG_COLORS    = ['#efece6', '#e6e3dc', '#f0ede7', '#e8e4dc', '#ece8df'];

function TshirtSVG({ idx = 0 }) {
  const color  = SHIRT_COLORS[idx % SHIRT_COLORS.length];
  const bg     = BG_COLORS[idx % BG_COLORS.length];
  const stroke = ['#ffffff', '#cfc7b6', '#e8e2d4'].includes(color) ? '#c9c4b8' : 'rgba(0,0,0,0.18)';
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="500" fill={bg}/>
      <ellipse cx="200" cy="430" rx="120" ry="10" fill="rgba(0,0,0,0.07)"/>
      <path
        d="M120 130 L80 160 L60 220 L100 235 L105 260 L105 410 L295 410 L295 260 L300 235 L340 220 L320 160 L280 130 L255 120 Q255 145 200 145 Q145 145 145 120 Z"
        fill={color} stroke={stroke} strokeWidth="1.2"
      />
      <path d="M165 120 Q200 150 235 120" fill="none" stroke={stroke} strokeWidth="1.2"/>
    </svg>
  );
}

/* ── Formatar preço ────────────────────────────────────────────────── */
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── FavoritesDrawer ───────────────────────────────────────────────── */
export default function FavoritesDrawer({ open, onClose }) {
  const [favs, setFavs] = useState([]);
  const navigate = useNavigate();

  /* Lê localStorage sempre que o drawer abrir */
  const loadFavs = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('teestore_favs') || '[]');
      setFavs(Array.isArray(saved) ? saved : []);
    } catch {
      setFavs([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadFavs();
  }, [open, loadFavs]);

  /* Sincroniza quando Home.jsx dispara o evento de atualização */
  useEffect(() => {
    const handler = () => loadFavs();
    window.addEventListener('teestore-favs-update', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('teestore-favs-update', handler);
      window.removeEventListener('storage', handler);
    };
  }, [loadFavs]);

  /* Remove um favorito */
  const removeFav = (id) => {
    const updated = favs.filter((f) => f.id !== id);
    setFavs(updated);
    localStorage.setItem('teestore_favs', JSON.stringify(updated));
    window.dispatchEvent(new Event('teestore-favs-update'));
  };

  return (
    <>
      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        {/* Cabeçalho */}
        <div className={styles.head}>
          <h2 className={styles.title}>
            Favoritos
            {favs.length > 0 && <span className={styles.ct}>{favs.length}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <IClose/>
          </button>
        </div>

        {/* Corpo */}
        <div className={styles.body}>
          {favs.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><IHeart/></div>
              <div className={styles.emptyTitle}>Nenhum favorito ainda</div>
              <p className={styles.emptySub}>
                Clique no coração de qualquer produto para salvá-lo aqui.
              </p>
              <button
                className={styles.exploreBtn}
                onClick={() => { onClose(); navigate('/'); }}
              >
                Explorar loja <IArrow size={14}/>
              </button>
            </div>
          ) : (
            favs.map((fav, idx) => (
              <div className={styles.item} key={fav.id}>
                <div className={styles.thumb}>
                  {fav.imageUrl
                    ? <img src={fav.imageUrl} alt={fav.name} className={styles.thumbImg}/>
                    : <TshirtSVG idx={idx}/>
                  }
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{fav.name}</div>
                  {fav.category && <div className={styles.cat}>{fav.category}</div>}
                  <div className={styles.price}>{fmtBRL(fav.price)}</div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFav(fav.id)}
                  title="Remover dos favoritos"
                >
                  <IHeartFill size={15}/>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        {favs.length > 0 && (
          <div className={styles.foot}>
            <button
              className={styles.profileLink}
              onClick={() => { onClose(); navigate('/profile?s=favorites'); }}
            >
              Ver todos no perfil <IArrow size={13}/>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
