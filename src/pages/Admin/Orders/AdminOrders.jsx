import { useState, useEffect, useCallback } from 'react';
import { getAdminOrdersApi, updateOrderStatusApi } from '../../../api/orderApi';
import styles from './AdminOrders.module.css';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (v) =>
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
  PROCESSING: { label: 'Processando', short: 'Processando', cls: 'processing', filter: 'PROCESSING' },
  SHIPPED:    { label: 'Enviado',     short: 'Enviado',     cls: 'shipped',    filter: 'SHIPPED'    },
  DELIVERED:  { label: 'Entregue',    short: 'Entregue',    cls: 'delivered',  filter: 'DELIVERED'  },
  CANCELLED:  { label: 'Cancelado',   short: 'Cancelado',   cls: 'cancelled',  filter: 'CANCELLED'  },
};

const NEXT_STATUS = {
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED', 'CANCELLED'],
  DELIVERED:  [],
  CANCELLED:  [],
};

const FILTERS = [
  { key: '',           label: 'Todos'       },
  { key: 'PROCESSING', label: 'Processando' },
  { key: 'SHIPPED',    label: 'Enviados'    },
  { key: 'DELIVERED',  label: 'Entregues'   },
  { key: 'CANCELLED',  label: 'Cancelados'  },
];

/* ── Item Thumb Stack ────────────────────────────────────────────────── */
function ThumbStack({ items = [] }) {
  const visible = items.slice(0, 3);
  const extra   = items.length - 3;
  return (
    <div className={styles.thumbStack}>
      {visible.map((item, i) => (
        <div key={i} className={styles.thumb} style={{ zIndex: visible.length - i }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.productName} className={styles.thumbImg}/>
            : <div className={styles.thumbPlaceholder}/>}
        </div>
      ))}
      {extra > 0 && <div className={styles.thumbExtra}>+{extra}</div>}
    </div>
  );
}

/* ── Expanded detail ─────────────────────────────────────────────────── */
function OrderDetail({ order }) {
  const items = order.items ?? [];
  return (
    <div className={styles.detail}>
      {order.trackingCode && (
        <div className={styles.trackingBar}>
          <span className={styles.trackingLabel}>Rastreio</span>
          <span className={styles.trackingCode}>{order.trackingCode}</span>
          <button className={styles.copyBtn}
            onClick={() => navigator.clipboard?.writeText(order.trackingCode)}>
            Copiar
          </button>
        </div>
      )}
      <table className={styles.itemTable}>
        <thead>
          <tr>
            <th style={{ width: 48 }}/>
            <th>Produto</th>
            <th>Tam.</th>
            <th>Qtd.</th>
            <th>Preço unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <div className={styles.itemThumb}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.productName} className={styles.itemThumbImg}/>
                    : <div className={styles.itemThumbPlaceholder}/>}
                </div>
              </td>
              <td className={styles.itemName}>{item.productName}</td>
              <td><span className={styles.sizeTag}>{item.size}</span></td>
              <td>{item.quantity}</td>
              <td>{fmt(item.unitPrice)}</td>
              <td className={styles.itemSubtotal}>{fmt((item.unitPrice ?? 0) * (item.quantity ?? 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.detailFooter}>
        <span>Total do pedido</span>
        <strong>{fmt(order.total)}</strong>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function AdminOrders() {
  const [orders, setOrders]       = useState([]);
  const [allOrders, setAllOrders] = useState([]); // para contagens dos chips
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(0);
  const [statusFilter, setFilter] = useState('');
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [updating, setUpdating]   = useState(null);

  const load = useCallback((p = 0, status = statusFilter) => {
    setLoading(true);
    const params = { page: p, size: 15 };
    if (status) params.status = status;
    getAdminOrdersApi(params)
      .then(({ data }) => {
        setOrders(data.content ?? []);
        setTotal(data.totalPages ?? 0);
        setPage(p);
      })
      .catch(() => setError('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  // Carrega todos para contar por status
  useEffect(() => {
    getAdminOrdersApi({ page: 0, size: 200 })
      .then(({ data }) => setAllOrders(data.content ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(0); }, []); // eslint-disable-line

  const counts = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  counts.all = allOrders.length;

  const handleFilterChange = (key) => {
    setFilter(key);
    load(0, key);
    setExpanded(null);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const { data } = await updateOrderStatusApi(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? data : o));
      setAllOrders((prev) => prev.map((o) => o.id === orderId ? data : o));
    } catch {
      setError('Erro ao atualizar status.');
    } finally {
      setUpdating(null);
    }
  };

  const exportCSV = () => {
    const escape = (v) => {
      const s = String(v ?? '');
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = [
      'Pedido ID', 'Data', 'Hora', 'Cliente', 'Email',
      'Status', 'Rastreio', 'Total Pedido (R$)',
      'Produto', 'Tamanho', 'Qtd', 'Preço Unit (R$)', 'Subtotal (R$)',
    ];

    const source = allOrders.length ? allOrders : orders;
    const rows = [header];

    source.forEach((o) => {
      const dt    = o.createdAt ? new Date(o.createdAt) : null;
      const date  = dt ? dt.toLocaleDateString('pt-BR') : '';
      const time  = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const items = o.items ?? [];

      if (items.length === 0) {
        rows.push([
          o.id, date, time,
          o.userName ?? '', o.userEmail ?? '',
          STATUS[o.status]?.label ?? o.status,
          o.trackingCode ?? '',
          String(o.total ?? '').replace('.', ','),
          '', '', '', '', '',
        ]);
      } else {
        items.forEach((it) => {
          const subtotal = ((it.unitPrice ?? 0) * (it.quantity ?? 1)).toFixed(2).replace('.', ',');
          rows.push([
            o.id, date, time,
            o.userName ?? '', o.userEmail ?? '',
            STATUS[o.status]?.label ?? o.status,
            o.trackingCode ?? '',
            String(o.total ?? '').replace('.', ','),
            it.productName ?? '',
            it.size ?? '',
            String(it.quantity ?? ''),
            String(it.unitPrice ?? '').replace('.', ','),
            subtotal,
          ]);
        });
      }
    });

    const csv = '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gestão de Pedidos</h1>
            <p className={styles.sub}>{counts.all ?? 0} pedidos no total</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.csvBtn} onClick={exportCSV}>↓ Exportar CSV</button>
          </div>
        </div>

        {/* Filter chips */}
        <div className={styles.chips}>
          {FILTERS.map(({ key, label }) => {
            const count = key === '' ? counts.all : counts[key] ?? 0;
            return (
              <button
                key={key}
                className={`${styles.chip} ${statusFilter === key ? styles.chipActive : ''}`}
                onClick={() => handleFilterChange(key)}
              >
                {label}
                {count > 0 && <span className={styles.chipBadge}>{count}</span>}
              </button>
            );
          })}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p className={styles.center}>Carregando...</p>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>Nenhum pedido encontrado.</div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const s      = STATUS[o.status] ?? { label: o.status, cls: 'processing' };
                    const isOpen = expanded === o.id;
                    const next   = NEXT_STATUS[o.status] ?? [];
                    const items  = o.items ?? [];
                    const qty    = items.reduce((acc, it) => acc + (it.quantity ?? 0), 0);

                    return (
                      <>
                        <tr
                          key={o.id}
                          className={`${styles.row} ${isOpen ? styles.rowOpen : ''}`}
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                        >
                          {/* Pedido */}
                          <td>
                            <div className={styles.orderId}>#{o.id.substring(0, 8).toUpperCase()}</div>
                            <div className={styles.orderDate}>{fmtDate(o.createdAt)}</div>
                          </td>

                          {/* Cliente */}
                          <td>
                            <div className={styles.client}>
                              <div className={styles.avatar}>{initials(o.userName)}</div>
                              <div>
                                <div className={styles.clientName}>{o.userName ?? '—'}</div>
                                <div className={styles.clientEmail}>{o.userEmail ?? ''}</div>
                              </div>
                            </div>
                          </td>

                          {/* Itens com thumbnail */}
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className={styles.itemsCell}
                                 onClick={() => setExpanded(isOpen ? null : o.id)}>
                              <ThumbStack items={items}/>
                              <span className={styles.itemCount}>{qty} item{qty !== 1 ? 's' : ''}</span>
                            </div>
                          </td>

                          {/* Total */}
                          <td className={styles.total}>{fmt(o.total)}</td>

                          {/* Status */}
                          <td>
                            <span className={`${styles.badge} ${styles[s.cls]}`}>{s.short}</span>
                          </td>

                          {/* Ações */}
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className={styles.actions}>
                              {next.map((ns) => (
                                <button
                                  key={ns}
                                  className={`${styles.actionBtn} ${ns === 'CANCELLED' ? styles.cancelBtn : styles.advanceBtn}`}
                                  disabled={updating === o.id}
                                  onClick={() => handleStatusUpdate(o.id, ns)}
                                >
                                  {ns === 'SHIPPED' ? 'Enviar' : ns === 'DELIVERED' ? 'Entregar' : 'Cancelar'}
                                </button>
                              ))}
                              <button className={styles.iconBtn}
                                      onClick={() => setExpanded(isOpen ? null : o.id)}>
                                {isOpen ? '▲' : '▼'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr key={`${o.id}-detail`} className={styles.detailRow}>
                            <td colSpan={6}>
                              <OrderDetail order={o}/>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 0} onClick={() => load(page - 1)}>← Anterior</button>
                <span className={styles.pageInfo}>Página {page + 1} de {totalPages}</span>
                <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima →</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
