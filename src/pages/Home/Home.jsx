import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts } from '../../api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationToast from '../../components/NotificationToast/NotificationToast';
import styles from './Home.module.css';

/* ── SVG camiseta placeholder ─────────────────────────────────────── */
const SHIRT_COLORS = ['#161513', '#9c978d', '#ffffff', '#1f3a5f', '#5a6442', '#7a3030', '#cfc7b6', '#e8e2d4'];
const BG_COLORS    = ['#efece6', '#e6e3dc', '#f0ede7', '#e8e4dc', '#ece8df'];

function TshirtSVG({ color = '#161513', idx = 0 }) {
  const bg     = BG_COLORS[idx % BG_COLORS.length];
  const stroke = ['#ffffff', '#cfc7b6', '#e8e2d4'].includes(color) ? '#c9c4b8' : 'rgba(0,0,0,0.18)';
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="500" fill={bg}/>
      <ellipse cx="200" cy="430" rx="120" ry="10" fill="rgba(0,0,0,0.07)"/>
      <path
        d="M120 130 L80 160 L60 220 L100 235 L105 260 L105 410 L295 410 L295 260 L300 235 L340 220 L320 160 L280 130 L255 120 Q255 145 200 145 Q145 145 145 120 Z"
        fill={color} stroke={stroke} strokeWidth="1.2"
      />
      <path d="M165 120 Q200 150 235 120" fill="none" stroke={stroke} strokeWidth="1.2"/>
      <path d="M180 200 Q200 280 175 380" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.25"/>
      <path d="M220 200 Q200 280 225 380" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.25"/>
    </svg>
  );
}

/* ── Ícones ───────────────────────────────────────────────────────── */
const Ic = ({ d, size = 16, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IStar   = () => <Ic size={11} fill="currentColor" sw={0} d={<path d="M12 2l3 7 7 .8-5.3 4.9 1.5 7L12 18l-6.2 3.7 1.5-7L2 9.8 9 9z"/>}/>;
const IHeart  = ({ filled }) => filled
  ? <Ic fill="currentColor" sw={0} d={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}/>
  : <Ic d={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}/>;
const IArrow  = () => <Ic d={<path d="M5 12h14M13 5l7 7-7 7"/>}/>;
const ITruck  = () => <Ic size={13} d={<><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}/>;
const IGrid3  = () => <Ic d={<><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></>}/>;
const IGrid4  = () => <Ic d={<><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>}/>;
const IPlus   = () => <Ic size={14} d={<path d="M12 5v14M5 12h14"/>}/>;
const IMinus  = () => <Ic size={12} d={<path d="M5 12h14"/>}/>;
const ICheck  = () => <Ic size={14} d={<path d="M5 12l4 4L19 7"/>}/>;
const IClose  = () => <Ic size={16} d={<path d="M5 5l14 14M19 5L5 19"/>}/>;
const IBag    = () => <Ic size={32} d={<><path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8zM9 8V6a3 3 0 016 0v2"/></>}/>;

/* ── Formatar preço ───────────────────────────────────────────────── */
const fmtPrice = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── Produto card ─────────────────────────────────────────────────── */
function ProductCard({ product, idx, wished, onAdd, onWish }) {
  const [selSize, setSelSize]    = useState(null);
  const [adding, setAdding]      = useState(false);

  const availableSizes = product.sizes?.filter((s) => s.stockQuantity > 0) ?? [];
  const outOfStock     = availableSizes.length === 0;
  const shirtColor     = SHIRT_COLORS[idx % SHIRT_COLORS.length];

  const handleQuickAdd = async (size) => {
    setSelSize(size);
    setAdding(true);
    try {
      await onAdd({ productId: product.id, size, quantity: 1 });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`${styles.card} ${outOfStock ? styles.cardOut : ''}`}>
      <div className={styles.cardMedia}>
        {/* Imagem ou placeholder SVG */}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.cardImg}/>
        ) : (
          <div className={styles.cardImg}>
            <TshirtSVG color={shirtColor} idx={idx}/>
          </div>
        )}

        {/* Botão de wishlist */}
        <button
          className={`${styles.wishBtn} ${wished ? styles.wishOn : ''}`}
          onClick={() => onWish(product.id)}
          title="Favoritar"
        >
          <IHeart filled={wished}/>
        </button>

        {/* Quick add — aparece no hover */}
        {!outOfStock && (
          <div className={styles.quickAdd}>
            {availableSizes.map((s) => (
              <button
                key={s.id}
                className={`${styles.sizePill} ${selSize === s.size ? styles.sizePillSel : ''}`}
                disabled={adding}
                onClick={() => handleQuickAdd(s.size)}
              >
                {s.size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.cardInfo}>
        <div>
          {product.category && (
            <p className={styles.cardCat}>{product.category}</p>
          )}
          <h3 className={styles.cardName}>{product.name}</h3>
        </div>
        <div className={styles.cardPrice}>
          <span className={styles.priceNow}>{fmtPrice(product.price)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Banner editorial ─────────────────────────────────────────────── */
function EditorialBanner() {
  return (
    <div className={styles.editorial}>
      <div className={styles.editorialLeft}>
        <div className={styles.editorialTag}>Coleção · Outono 2026</div>
        <h3 className={styles.editorialTitle}>
          Algodão premium,{' '}
          <span className={styles.editorialTitleIt}>acabamento limpo.</span>
        </h3>
      </div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return (
    <div className={styles.toast}>
      <ICheck/> {msg}
    </div>
  );
}

/* ── Home ─────────────────────────────────────────────────────────── */
export default function Home() {
  const [products, setProducts]       = useState([]);
  const [pagination, setPagination]   = useState({ page: 0, totalPages: 1, last: true });
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  // Favoritos persistidos no localStorage para aparecer no Profile
  const [wished, setWished] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('teestore_favs') || '[]');
      return new Set(saved.map((f) => f.id));
    } catch { return new Set(); }
  });
  const [toast, setToast]             = useState(null);
  const cols = 3;
  const [sort, setSort]               = useState('featured');
  const [cat, setCat]                 = useState('all');

  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase();

  const { notifications, clearNotifications } = useNotifications(user?.id);
  const [visibleNotifs, setVisibleNotifs] = useState([]);
  useEffect(() => {
    if (notifications.length > 0) setVisibleNotifs(notifications);
  }, [notifications]);

  const fetchProducts = useCallback(async (page = 0, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({ page, size: 100, search });
      setProducts(data.content ?? []);
      setPagination({ page: data.page, totalPages: data.totalPages, last: data.last });
    } catch {
      setError('Não foi possível carregar os produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-busca sempre que a query de busca muda
  useEffect(() => {
    fetchProducts(0, searchQuery);
  }, [fetchProducts, searchQuery]);

  const handleAddToCart = useCallback(async (item) => {
    if (!isAuthenticated) { navigate('/login?redirect=/'); return; }
    try {
      await addItem(item);
      const p = products.find((x) => x.id === item.productId);
      setToast(`${p?.name ?? 'Item'} (${item.size}) adicionado`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) navigate('/login?redirect=/');
      else alert('Erro ao adicionar ao carrinho. Tente novamente.');
    }
  }, [isAuthenticated, addItem, navigate, products]);

  const handleWish = (id) => {
    setWished((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      // persiste no localStorage com dados do produto
      const favProducts = products.filter((p) => n.has(p.id)).map((p) => ({
        id: p.id, name: p.name, price: p.price,
        imageUrl: p.imageUrl ?? null, category: p.category ?? '',
      }));
      localStorage.setItem('teestore_favs', JSON.stringify(favProducts));
      window.dispatchEvent(new Event('teestore-favs-update'));
      return n;
    });
  };

  // Deriva categorias únicas com contagem
  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const c = p.category || 'Outros';
      counts[c] = (counts[c] || 0) + 1;
    });
    return [{ key: 'all', label: 'Tudo', count: products.length },
      ...Object.entries(counts).map(([k, v]) => ({ key: k, label: k, count: v }))];
  }, [products]);

  const sorted = useMemo(() => {
    let arr = [...products];
    if (cat !== 'all') arr = arr.filter((p) => (p.category || 'Outros') === cat);
    if (sort === 'price-asc')  arr.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [products, sort, cat]);

  // Insere banner editorial após a 1ª linha completa de produtos
  const gridItems = useMemo(() => {
    if (sorted.length < cols + 1) return sorted;
    const arr = [...sorted];
    arr.splice(cols, 0, { _banner: true });
    return arr;
  }, [sorted, cols]);

  return (
    <main>
      {/* ── Hero ─────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Coleção · Outono 2026</div>
        <h1 className={styles.heroTitle}>
          Camisetas <span className={styles.heroIt}>premium,</span> sem igual.
        </h1>
      </section>

      {/* ── Banner de busca ──────────────────── */}
      {searchQuery && (
        <div className={styles.searchBanner}>
          <span className={styles.searchBannerQuery}>"{searchParams.get('q')}"</span>
          <span className={styles.searchBannerCount}>
            {sorted.length === 0
              ? 'Nenhum resultado'
              : `${sorted.length} resultado${sorted.length !== 1 ? 's' : ''}`}
          </span>
          <button className={styles.searchBannerClear} onClick={() => navigate('/')}>
            Limpar busca
          </button>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────── */}
      <div className={styles.toolbar}>
        {/* Chips de categoria */}
        <div className={styles.chipRow}>
          {categories.map(({ key, label, count }) => (
            <button
              key={key}
              className={`${styles.chip} ${cat === key ? styles.chipActive : ''}`}
              onClick={() => setCat(key)}
            >
              {label}
              <span className={styles.chipCount}>{count}</span>
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Em destaque</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────── */}
      <div className={styles.gridWrap}>
        {loading ? (
          <div className={styles.grid} data-cols={cols}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeleton}/>
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => fetchProducts(0)} className={styles.retryBtn}>
              Tentar novamente
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><IBag/></div>
            <p>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid} data-cols={cols}>
              {gridItems.map((p, i) =>
                p._banner ? (
                  <EditorialBanner key="banner"/>
                ) : (
                  <ProductCard
                    key={p.id}
                    product={p}
                    idx={products.findIndex((x) => x.id === p.id)}
                    wished={wished.has(p.id)}
                    onAdd={handleAddToCart}
                    onWish={handleWish}
                  />
                )
              )}
            </div>

            {/* Paginação — oculta durante busca */}
            {pagination.totalPages > 1 && !searchQuery && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={pagination.page === 0}
                  onClick={() => fetchProducts(pagination.page - 1)}
                >
                  ← Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {pagination.page + 1} de {pagination.totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={pagination.last}
                  onClick={() => fetchProducts(pagination.page + 1)}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}

      {/* Notificações WebSocket */}
      <NotificationToast
        notifications={visibleNotifs}
        onDismiss={(id) => setVisibleNotifs((prev) => prev.filter((n) => n.id !== id))}
      />
    </main>
  );
}
