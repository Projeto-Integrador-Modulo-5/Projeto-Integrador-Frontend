import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import styles from './CartDrawer.module.css';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, removeItem, updateItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  const items = cart.items ?? [];

  const handleCheckout = () => {
    setDrawerOpen(false);
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />

      {/* Drawer */}
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Carrinho</h2>
          <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>Seu carrinho está vazio.</p>
              <button className={styles.keepShoppingBtn} onClick={() => setDrawerOpen(false)}>
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemSize}>Tam: {item.size}</span>
                    <span className={styles.itemPrice}>{fmt(item.unitPrice)}</span>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem(item.productId, { size: item.size, quantity: item.quantity - 1 })
                            : removeItem(item.productId, item.size)
                        }
                      >
                        −
                      </button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateItem(item.productId, { size: item.size, quantity: item.quantity + 1 })
                        }
                      >
                        +
                      </button>
                    </div>
                    <span className={styles.subtotal}>{fmt(item.subtotal)}</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.productId, item.size)}
                      aria-label="Remover item"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Total</span>
              <span className={styles.totalValue}>{fmt(cart.total)}</span>
            </div>
            <button className={styles.checkoutBtn} onClick={handleCheckout}>
              Finalizar Compra
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
