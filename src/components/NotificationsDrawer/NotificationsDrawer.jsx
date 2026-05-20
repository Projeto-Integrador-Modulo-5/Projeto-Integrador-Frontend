import { useState, useEffect, useCallback } from 'react';
import { getNotificationsApi, markAllAsReadApi, markAsReadApi } from '../../api/notificationApi';
import styles from './NotificationsDrawer.module.css';

/* ── Ícones ────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 18, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IClose    = () => <Ic d={<path d="M5 5l14 14M19 5L5 19"/>}/>;
const IBell     = () => <Ic d={<><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></>}/>;
const ITruck    = () => <Ic d={<><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}/>;
const ICheck    = () => <Ic d={<path d="M5 12l4 4L19 7"/>}/>;
const ICheckAll = () => <Ic d={<><path d="M2 12l4 4L14 6"/><path d="M9 12l4 4 7-9"/></>}/>;
const IBox      = () => <Ic d={<><path d="M3.5 7.5L12 3l8.5 4.5M3.5 7.5L12 12m-8.5-4.5v9L12 21m0-9l8.5-4.5M12 12v9m8.5-13.5v9L12 21"/></>}/>;
const IClose2   = () => <Ic d={<><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>}/>;

/* ── Config por tipo de notificação ────────────────────────────────── */
const TYPE_CFG = {
  ORDER_CONFIRMED: { icon: <IBox size={15}/>,   color: 'oklch(0.52 0.13 155)', label: 'Pedido confirmado'  },
  ORDER_SHIPPED:   { icon: <ITruck size={15}/>,  color: 'oklch(0.52 0.16 240)', label: 'Pedido enviado'     },
  ORDER_DELIVERED: { icon: <ICheck size={15}/>,  color: 'oklch(0.52 0.13 155)', label: 'Pedido entregue'   },
  ORDER_CANCELLED: { icon: <IClose2 size={15}/>, color: 'oklch(0.55 0.18 25)',  label: 'Pedido cancelado'  },
  DEFAULT:         { icon: <IBell size={15}/>,   color: 'var(--text-m)',         label: 'Notificação'       },
};

/* ── Formatar tempo ────────────────────────────────────────────────── */
const fmtTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'agora mesmo';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} min atrás`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
};

/* ── NotificationsDrawer ───────────────────────────────────────────── */
export default function NotificationsDrawer({ open, onClose, realtimeNotifs = [], onMarkedRead }) {
  const [histNotifs, setHistNotifs] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [readIds, setReadIds]       = useState(new Set());

  /* Carrega histórico da API quando o drawer abre */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotificationsApi();
      setHistNotifs(Array.isArray(data) ? data : []);
    } catch {
      /* silencioso — notificações em tempo real ainda aparecem */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /* Merge tempo-real + histórico, deduplica por id, ordena por data */
  const merged = (() => {
    const map = new Map();
    histNotifs.forEach((n) => map.set(String(n.id), n));
    realtimeNotifs.forEach((n) => map.set(String(n.id), n));
    return [...map.values()].sort(
      (a, b) =>
        new Date(b.sentAt || b.createdAt || 0) -
        new Date(a.sentAt || a.createdAt || 0)
    );
  })();

  const unreadCount = merged.filter(
    (n) => !n.read && !readIds.has(String(n.id))
  ).length;

  /* Marcar tudo como lido */
  const markAllRead = async () => {
    try { await markAllAsReadApi(); } catch { /* ok */ }
    setReadIds(new Set(merged.map((n) => String(n.id))));
    onMarkedRead?.();
  };

  /* Marcar uma como lida */
  const markRead = async (id) => {
    try { await markAsReadApi(id); } catch { /* ok */ }
    setReadIds((prev) => new Set([...prev, String(id)]));
    onMarkedRead?.();
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
            Notificações
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount}</span>
            )}
          </h2>
          <div className={styles.headActions}>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                <ICheckAll size={14}/> Marcar como lidas
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
              <IClose/>
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}>Carregando notificações…</div>
          ) : merged.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><IBell size={36}/></div>
              <div className={styles.emptyTitle}>Tudo em ordem</div>
              <p className={styles.emptySub}>
                Você será notificado aqui quando seu pedido tiver uma atualização.
              </p>
            </div>
          ) : (
            merged.map((n) => {
              const isRead = n.read || readIds.has(String(n.id));
              const cfg    = TYPE_CFG[n.type] ?? TYPE_CFG.DEFAULT;
              return (
                <div
                  key={n.id}
                  className={`${styles.notif} ${!isRead ? styles.notifUnread : ''}`}
                  onClick={() => !isRead && markRead(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Ícone do tipo */}
                  <div
                    className={styles.notifIcon}
                    style={{
                      color: cfg.color,
                      background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Texto */}
                  <div className={styles.notifBody}>
                    <div className={styles.notifLabel}>{cfg.label}</div>
                    <div className={styles.notifMsg}>{n.message}</div>
                    {n.trackingCode && (
                      <div className={styles.notifTracking}>
                        Rastreio: <b>{n.trackingCode}</b>
                      </div>
                    )}
                    <div className={styles.notifTime}>
                      {fmtTime(n.sentAt || n.createdAt)}
                    </div>
                  </div>

                  {/* Ponto de não-lido */}
                  {!isRead && <div className={styles.unreadDot}/>}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
