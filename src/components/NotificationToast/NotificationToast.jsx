import { useEffect } from 'react';
import styles from './NotificationToast.module.css';

const TYPE_LABELS = {
  ORDER_CREATED: '🛍️ Pedido criado',
  ORDER_SHIPPED: '🚚 Pedido enviado',
  ORDER_DELIVERED: '✅ Pedido entregue',
};

/**
 * @param {{ notifications: Array, onDismiss: (id: number) => void }} props
 */
export default function NotificationToast({ notifications = [], onDismiss }) {
  // Auto-dismiss após 5 segundos
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    const timer = setTimeout(() => {
      onDismiss?.(latest.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {notifications.slice(0, 3).map((n) => (
        <div key={n.id} className={styles.toast}>
          <div className={styles.toastContent}>
            <strong className={styles.toastType}>
              {TYPE_LABELS[n.type] ?? n.type}
            </strong>
            <p className={styles.toastMessage}>{n.message}</p>
            {n.trackingCode && (
              <p className={styles.tracking}>Código: {n.trackingCode}</p>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => onDismiss?.(n.id)}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
