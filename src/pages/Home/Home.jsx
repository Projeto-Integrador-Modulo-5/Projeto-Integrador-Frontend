import { useState, useEffect, useCallback } from 'react';
import { getProducts, addToCart } from '../../api/productApi';
import { useNotifications } from '../../hooks/useNotifications';
import ProductCard from '../../components/ProductCard/ProductCard';
import NotificationToast from '../../components/NotificationToast/NotificationToast';
import styles from './Home.module.css';

// Dados mockados como fallback (ativados se o backend não responder)
const MOCK_PRODUCTS = [
  { id: '1', name: 'Camiseta Básica Preta', price: 79.90, imageUrl: null, active: true, sizes: [{ id: '1a', size: 'P', stockQuantity: 10 }, { id: '1b', size: 'M', stockQuantity: 5 }, { id: '1c', size: 'G', stockQuantity: 3 }, { id: '1d', size: 'GG', stockQuantity: 2 }] },
  { id: '2', name: 'Camiseta Branca Premium', price: 89.90, imageUrl: null, active: true, sizes: [{ id: '2a', size: 'P', stockQuantity: 8 }, { id: '2b', size: 'M', stockQuantity: 4 }, { id: '2c', size: 'G', stockQuantity: 0 }] },
  { id: '3', name: 'Camiseta Azul Marinho', price: 79.90, imageUrl: null, active: true, sizes: [{ id: '3a', size: 'M', stockQuantity: 6 }, { id: '3b', size: 'G', stockQuantity: 7 }, { id: '3c', size: 'GG', stockQuantity: 2 }] },
  { id: '4', name: 'Camiseta Cinza Mescla', price: 84.90, imageUrl: null, active: true, sizes: [{ id: '4a', size: 'P', stockQuantity: 3 }, { id: '4b', size: 'M', stockQuantity: 9 }, { id: '4c', size: 'G', stockQuantity: 5 }, { id: '4d', size: 'GG', stockQuantity: 1 }] },
  { id: '5', name: 'Camiseta Verde Militar', price: 79.90, imageUrl: null, active: true, sizes: [{ id: '5a', size: 'M', stockQuantity: 4 }, { id: '5b', size: 'G', stockQuantity: 3 }] },
  { id: '6', name: 'Camiseta Bordô', price: 89.90, imageUrl: null, active: true, sizes: [{ id: '6a', size: 'P', stockQuantity: 5 }, { id: '6b', size: 'M', stockQuantity: 6 }, { id: '6c', size: 'G', stockQuantity: 2 }] },
  { id: '7', name: 'Camiseta Mostarda', price: 84.90, imageUrl: null, active: true, sizes: [{ id: '7a', size: 'M', stockQuantity: 3 }, { id: '7b', size: 'G', stockQuantity: 4 }, { id: '7c', size: 'GG', stockQuantity: 2 }] },
  { id: '8', name: 'Camiseta Rosa Claro', price: 79.90, imageUrl: null, active: true, sizes: [{ id: '8a', size: 'P', stockQuantity: 7 }, { id: '8b', size: 'M', stockQuantity: 3 }, { id: '8c', size: 'G', stockQuantity: 1 }] },
];

export default function Home({ onCartUpdate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // userId do usuário logado (null = sem login)
  // Futuramente: pegar do contexto de auth
  const userId = localStorage.getItem('userId') || null;

  const { notifications, clearNotifications } = useNotifications(userId);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  // Sincroniza notificações novas para exibição no toast
  useEffect(() => {
    if (notifications.length > 0) {
      setVisibleNotifications(notifications);
    }
  }, [notifications]);

  const handleDismissNotification = useCallback((id) => {
    setVisibleNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Busca produtos do backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProducts();
        setProducts(data);
        setUsingMock(false);
      } catch (err) {
        console.warn('[Home] Backend indisponível, usando dados mockados:', err.message);
        setProducts(MOCK_PRODUCTS);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = useCallback(async (item) => {
    try {
      await addToCart(item);
      onCartUpdate?.();
      // Feedback visual futuro: toast de sucesso
    } catch (err) {
      console.error('[Home] Erro ao adicionar ao carrinho:', err);
      if (err.response?.status === 401) {
        alert('Faça login para adicionar itens ao carrinho.');
      } else {
        alert('Erro ao adicionar ao carrinho. Tente novamente.');
      }
    }
  }, [onCartUpdate]);

  return (
    <main className={styles.main}>
      {/* Banner de modo mock */}
      {usingMock && (
        <div className={styles.mockBanner}>
          ⚡ Modo de demonstração — backend não encontrado. Dados simulados.
        </div>
      )}

      <div className={styles.container}>
        {/* Cabeçalho da seção */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Camisetas Premium</h1>
          <p className={styles.heroSubtitle}>
            Descubra nossa coleção exclusiva de camisetas de alta qualidade
          </p>
        </section>

        {/* Grid de produtos */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>
              Tentar novamente
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toasts de notificação em tempo real */}
      <NotificationToast
        notifications={visibleNotifications}
        onDismiss={handleDismissNotification}
      />
    </main>
  );
}
