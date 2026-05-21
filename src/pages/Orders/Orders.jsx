import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserOrdersApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import styles from './Orders.module.css';

/* ── Ícones ─────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 16, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IUser    = () => <Ic d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>}/>;
const ILock    = () => <Ic d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>}/>;
const IPin     = () => <Ic d={<><path d="M12 22s8-7.4 8-13a8 8 0 10-16 0c0 5.6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>}/>;
const IBox     = () => <Ic d={<><path d="M3.5 7.5L12 3l8.5 4.5M3.5 7.5L12 12m-8.5-4.5v9L12 21m0-9l8.5-4.5M12 12v9m8.5-13.5v9L12 21"/></>}/>;
const ILogout  = () => <Ic d={<><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></>}/>;
const IHome    = () => <Ic d={<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>}/>;
const IHeart   = () => <Ic d={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}/>;
const ITruck   = () => <Ic d={<><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}/>;
const ICard    = () => <Ic d={<><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></>}/>;
const ICopy    = () => <Ic d={<><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></>}/>;
const ICheck   = () => <Ic d={<><path d="M5 12l4 4L19 7"/></>}/>;
const IChevD   = () => <Ic d={<><path d="M6 9l6 6 6-6"/></>}/>;
const IClock   = () => <Ic d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>;
const IClose   = () => <Ic d={<><path d="M5 5l14 14M19 5L5 19"/></>}/>;
const ITshirt  = () => <Ic d={<><path d="M3 7l4-3 4 1 1 1 1-1 4-1 4 3-3 3-2-1v11H8V9L6 10z"/></>}/>;

/* ── T-shirt placeholder SVG ─────────────────────────────────────────── */
const SHIRT_COLORS = ['#161513','#9c978d','#ffffff','#1f3a5f','#5a6442','#7a3030','#cfc7b6'];
const BG_COLORS    = ['#efece6','#e6e3dc','#f0ede7','#e8e4dc','#ece8df'];

function TshirtSVG({ idx = 0 }) {
  const color  = SHIRT_COLORS[idx % SHIRT_COLORS.length];
  const bg     = BG_COLORS[idx % BG_COLORS.length];
  const stroke = ['#ffffff','#cfc7b6','#e8e2d4'].includes(color) ? '#c9c4b8' : 'rgba(0,0,0,0.18)';
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="500" fill={bg}/>
      <path
        d="M120 130 L80 160 L60 220 L100 235 L105 260 L105 410 L295 410 L295 260 L300 235 L340 220 L320 160 L280 130 L255 120 Q255 145 200 145 Q145 145 145 120 Z"
        fill={color} stroke={stroke} strokeWidth="1.2"
      />
    </svg>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

/* ── Status config ───────────────────────────────────────────────────── */
const STATUS = {
  PROCESSING: { label: 'Processando', cls: 'Processing', step: 1,  filter: 'processing' },
  SHIPPED:    { label: 'Enviado',     cls: 'Shipped',    step: 2,  filter: 'shipped'    },
  DELIVERED:  { label: 'Entregue',    cls: 'Delivered',  step: 3,  filter: 'delivered'  },
  CANCELLED:  { label: 'Cancelado',   cls: 'Cancelled',  step: -1, filter: 'cancelled'  },
};
const STEPS = ['Confirmado', 'Processando', 'Enviado', 'Entregue'];

/* ── Status Pill ─────────────────────────────────────────────────────── */
function Pill({ status }) {
  const s = STATUS[status] ?? STATUS.PROCESSING;
  return (
    <span className={`${styles.pill} ${styles[`pill${s.cls}`]}`}>
      <span className={styles.pdot}/>
      {s.label}
    </span>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────── */
function Timeline({ status, createdAt }) {
  const s = STATUS[status] ?? STATUS.PROCESSING;
  const step = s.step;

  if (status === 'CANCELLED') {
    return (
      <div className={styles.cancelledBanner}>
        <IClose/> Pedido cancelado
      </div>
    );
  }

  const fillPct = step === 0 ? 0 : step === 1 ? 33.33 : step === 2 ? 66.66 : 100;
  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '—';
  const dates   = [dateStr, step >= 1 ? dateStr : '—', step >= 2 ? 'Em curso' : '—', step >= 3 ? dateStr : '—'];

  return (
    <div className={styles.timeline}>
      <div className={styles.tlLine}/>
      <div className={styles.tlLineFill} style={{ width: `calc((100% - 25%) * ${fillPct / 100})` }}/>
      {STEPS.map((label, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div className={styles.tlStep} key={label}>
            <div className={`${styles.tlDot} ${done ? styles.tlDotDone : current ? styles.tlDotCurrent : ''}`}>
              {(done || current)
                ? <ICheck size={13}/>
                : <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace' }}>{i + 1}</span>
              }
            </div>
            <div className={`${styles.tlLabel} ${!done && !current ? styles.tlLabelPending : ''}`}>{label}</div>
            <div className={styles.tlWhen}>{dates[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Order card ──────────────────────────────────────────────────────── */
function OrderCard({ order, idx, onCopy }) {
  const [open, setOpen] = useState(false);
  const s = STATUS[order.status] ?? STATUS.PROCESSING;
  const total = order.total ?? 0;
  const items = order.items ?? [];
  const qtyTotal = items.reduce((acc, it) => acc + (it.quantity ?? 0), 0);
  const firstName = items[0]?.productName ?? 'Produto';
  const extraCount = items.length > 1 ? items.length - 1 : 0;

  return (
    <div className={styles.order}>
      {/* Header row */}
      <div className={styles.orderHead} onClick={() => setOpen((v) => !v)}>
        <div className={styles.orderIdBlock}>
          <div className={styles.orderId}>#{order.id?.substring(0, 8).toUpperCase()}</div>
          <div className={styles.orderDate}>{fmtDate(order.createdAt)}</div>
        </div>

        <div className={styles.orderSummary}>
          <div className={styles.thumbStack}>
            {items.slice(0, 3).map((it, i) => (
              <div className={styles.otb} key={i}>
                {it.imageUrl
                  ? <img src={it.imageUrl} alt={it.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <TshirtSVG idx={(idx + i) % 7}/>}
              </div>
            ))}
            {items.length > 3 && (
              <div className={styles.otbMore}>+{items.length - 3}</div>
            )}
          </div>
          <div className={styles.orderItemsText}>
            {qtyTotal} item(s) · {firstName}{extraCount > 0 ? ` +${extraCount}` : ''}
          </div>
        </div>

        <div className={styles.orderRight}>
          <Pill status={order.status}/>
          <span className={styles.orderTotal}>{fmtBRL(total)}</span>
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
            <IChevD/>
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className={styles.orderBody}>
          <Timeline status={order.status} createdAt={order.createdAt}/>

          <div className={styles.detailGrid}>
            {/* Items + summary */}
            <div className={`${styles.detailBlock} ${styles.detailBlockNoPad}`}>
              <div className={styles.dbLabelInner}>
                <div className={styles.dbLabel}><ITshirt size={13}/> Itens</div>
              </div>
              <div className={styles.itemsInner}>
                {items.map((it, i) => (
                  <div className={styles.itemRow} key={i}>
                    <div className={styles.itemThumb}>
                      {it.imageUrl
                        ? <img src={it.imageUrl} alt={it.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}/>
                        : <TshirtSVG idx={(idx + i) % 7}/>}
                    </div>
                    <div>
                      <div className={styles.itemName}>{it.productName}</div>
                      <div className={styles.itemMeta}>Tam. {it.size} · qtd {it.quantity}</div>
                    </div>
                    <div className={styles.itemPrice}>{fmtBRL((it.unitPrice ?? 0) * (it.quantity ?? 1))}</div>
                  </div>
                ))}
              </div>
              <div className={styles.summaryWrap}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span className={styles.v}>{fmtBRL(total)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Frete</span>
                  <span className={styles.v}>Grátis</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span className={styles.v}>{fmtBRL(total)}</span>
                </div>
              </div>
            </div>

            {/* Side blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.trackingCode && (
                <div className={styles.detailBlock}>
                  <div className={styles.dbLabel}><ITruck size={13}/> Rastreamento</div>
                  <div className={styles.copyRow}>
                    <span className={styles.dbValue}>{order.trackingCode}</span>
                    <button
                      className={styles.copyBtn}
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(order.trackingCode); onCopy('Código copiado!'); }}
                    >
                      <ICopy size={11}/> Copiar
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-m)' }}>Correios — SEDEX</div>
                </div>
              )}
              <div className={styles.detailBlock}>
                <div className={styles.dbLabel}><IPin size={13}/> Endereço de entrega</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: 'var(--text)' }}>
                  Endereço principal
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-m)', lineHeight: 1.5 }}>
                  Ver em <Link to="/profile?tab=addresses" style={{ color: 'var(--accent)' }}>Minha Conta</Link>
                </div>
              </div>
              <div className={styles.detailBlock}>
                <div className={styles.dbLabel}><ICard size={13}/> Pagamento</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>
                  {order.paymentMethod ?? 'Cartão de crédito'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {open && (
        <div className={styles.orderActions}>
          {order.status === 'SHIPPED' && (
            <button className={`${styles.btn} ${styles.btnPrimary}`}><ITruck size={14}/> Rastrear pedido</button>
          )}
          {order.status === 'PROCESSING' && (
            <button className={`${styles.btn} ${styles.btnPrimary}`}><IClock size={14}/> Ver progresso</button>
          )}
          {order.status === 'DELIVERED' && (
            <button className={`${styles.btn} ${styles.btnPrimary}`}>Comprar de novo</button>
          )}
          {order.status !== 'CANCELLED' && (
            <button className={styles.btn}>Baixar nota fiscal</button>
          )}
          {order.status === 'DELIVERED' && (
            <button className={styles.btn}>Solicitar troca</button>
          )}
          {order.status === 'PROCESSING' && (
            <button className={`${styles.btn} ${styles.btnDanger}`}>Cancelar pedido</button>
          )}
          <button className={`${styles.btn} ${styles.btnGhost}`}>Precisa de ajuda?</button>
        </div>
      )}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return <div className={styles.toast}><ICheck/> {msg}</div>;
}

/* ── Orders page ─────────────────────────────────────────────────────── */
const FILTERS = [
  { key: 'all',        label: 'Todos'      },
  { key: 'processing', label: 'Processando' },
  { key: 'shipped',    label: 'Enviados'   },
  { key: 'delivered',  label: 'Entregues'  },
  { key: 'cancelled',  label: 'Cancelados' },
];

export default function Orders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all');
  const [toast, setToast]     = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    getUserOrdersApi()
      .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError('Não foi possível carregar os pedidos.'))
      .finally(() => setLoading(false));
  }, []);

  // Carrega pedidos ao montar
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Re-busca automaticamente quando chegar atualização de status via WebSocket
  useEffect(() => {
    window.addEventListener('teestore-order-update', fetchOrders);
    return () => window.removeEventListener('teestore-order-update', fetchOrders);
  }, [fetchOrders]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  /* Contagens por status */
  const counts = orders.reduce((acc, o) => {
    const f = STATUS[o.status]?.filter;
    if (f) acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});
  counts.all = orders.length;

  /* Filtro */
  const visible = filter === 'all'
    ? orders
    : orders.filter((o) => STATUS[o.status]?.filter === filter);

  const name  = user?.name ?? '';
  const email = user?.email ?? '';

  return (
    <main className={styles.shell}>
      {/* Breadcrumb */}
      <div className={styles.pageHead}>
        <div className={styles.crumbs}>
          <Link to="/" style={{ color: 'var(--text-m)', textDecoration: 'none', fontSize: 12.5 }}>Início</Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbHere}>Meus Pedidos</span>
        </div>
        <h1 className={styles.pageTitle}>
          Meus <span className={styles.pageTitleIt}>Pedidos</span>
        </h1>
        <p className={styles.pageSub}>Acompanhe rastreio, status e histórico de compras.</p>
      </div>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.side}>
          <div className={styles.sideUser}>
            <div className={styles.avatar}>{initials(name) || '?'}</div>
            <div>
              <div className={styles.meName}>{name || '—'}</div>
              <div className={styles.meMail}>{email}</div>
            </div>
          </div>

          <nav className={styles.sideNav}>
            <Link to="/profile?s=overview"   className={styles.sideLink}><IHome size={15}/> Visão geral</Link>
            <Link to="/orders" className={`${styles.sideLink} ${styles.sideLinkActive}`}>
              <IBox size={15}/> Meus Pedidos
              {orders.length > 0 && <span className={styles.sideBadge}>{orders.length}</span>}
            </Link>
            <Link to="/profile?s=favorites"  className={styles.sideLink}><IHeart size={15}/> Favoritos</Link>
            <Link to="/profile?s=profile"    className={styles.sideLink}><IUser size={15}/> Dados pessoais</Link>
            <Link to="/profile?s=security"   className={styles.sideLink}><ILock size={15}/> Segurança</Link>
            <Link to="/profile?s=addresses"  className={styles.sideLink}><IPin size={15}/> Endereços</Link>
            <div className={styles.sideDivider}/>
            <button
              className={`${styles.sideLink} ${styles.sideLinkDanger}`}
              onClick={handleLogout}
            >
              <ILogout size={15}/> Sair
            </button>
          </nav>

          <div className={styles.sideFoot}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', marginBottom: 1 }}>TeeClub Silver</div>
            <div>Membro desde {new Date().getFullYear()}</div>
          </div>
        </aside>

        {/* ── Content ── */}
        <div>
          {loading ? (
            <div className={styles.stateMsg}>Carregando pedidos…</div>
          ) : error ? (
            <div className={styles.stateMsg}>{error}</div>
          ) : (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2 className={styles.panelTitle}>Meus Pedidos</h2>
                  <p className={styles.panelSub}>{visible.length} de {orders.length} pedidos</p>
                </div>
              </div>

              {/* Chips de filtro */}
              <div className={styles.filters}>
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.chip} ${filter === key ? styles.chipActive : ''}`}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                    {counts[key] > 0 && (
                      <span className={styles.chipCount}>{counts[key]}</span>
                    )}
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className={styles.emptyWrap}>
                  <div className={styles.emptyIcon}><IBox size={22}/></div>
                  <div className={styles.emptyTitle}>Nenhum pedido nesta categoria</div>
                  <div>Tente outro filtro ou volte para a loja.</div>
                </div>
              ) : (
                visible.map((order, idx) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    idx={idx}
                    onCopy={setToast}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </main>
  );
}
