import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getDashboardApi } from '../../../api/adminApi';
import { getAdminOrdersApi, updateOrderStatusApi } from '../../../api/orderApi';
import styles from './Dashboard.module.css';

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmtMoney = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const todayStr = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const avatarStyle = (name = '') => {
  const code = (name.charCodeAt(0) || 0) * 7;
  const h1 = (270 + code) % 360;
  const h2 = (h1 + 40) % 360;
  return { background: `linear-gradient(135deg, oklch(0.65 0.13 ${h1}), oklch(0.55 0.16 ${h2}))` };
};

const THUMB_COLORS = ['#1f1d1a', '#bcb5a8', '#6b6760', '#cfc7b6', '#3d3a35'];

const STATUS_LABELS = {
  PROCESSING: 'Processando',
  SHIPPED:    'Enviado',
  DELIVERED:  'Entregue',
  CANCELLED:  'Cancelado',
};

const PILL_CLASS = {
  PROCESSING: styles.pillProcessing,
  SHIPPED:    styles.pillShipped,
  DELIVERED:  styles.pillDelivered,
  CANCELLED:  styles.pillCancelled,
};

/* ── Inline SVG icons ────────────────────────────────────────────── */
const Ic = ({ d, size = 16, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IcBox     = (p) => <Ic {...p} d={<path d="M3.5 7.5L12 3l8.5 4.5M3.5 7.5L12 12m-8.5-4.5v9L12 21m0-9l8.5-4.5M12 12v9m8.5-13.5v9L12 21"/>}/>;
const IcChart   = (p) => <Ic {...p} d={<path d="M3 21h18M7 17V10m5 7V5m5 12v-7"/>}/>;
const IcClock   = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>;
const IcTruck   = (p) => <Ic {...p} d={<><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}/>;
const IcFilter  = (p) => <Ic {...p} d={<path d="M3 5h18M6 12h12M10 19h4"/>}/>;
const IcDown    = (p) => <Ic {...p} d={<path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>}/>;
const IcEye     = (p) => <Ic {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IcMore    = (p) => <Ic {...p} d={<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>}/>;
const IcCheck   = (p) => <Ic {...p} d={<path d="M5 12l4 4L19 7"/>}/>;
const IcCart    = (p) => <Ic {...p} d={<><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.5 11h11l2-7H6.5"/></>}/>;
const IcPlus    = (p) => <Ic {...p} d={<path d="M12 5v14M5 12h14"/>}/>;

/* ── Sparkline ───────────────────────────────────────────────────── */
function Sparkline({ data, color = 'currentColor', w = 120, h = 44 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ color }}>
      <path d={area} fill={color} opacity="0.10"/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── KPI Card ────────────────────────────────────────────────────── */
function KpiCard({ label, value, suffix, delta, deltaDir, icon, iconClass, sparkData, sparkColor }) {
  const deltaClass = deltaDir === 'up' ? styles.deltaUp : deltaDir === 'down' ? styles.deltaDown : styles.deltaFlat;
  const arrow = deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '→';
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiHead}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={`${styles.kpiIcon} ${iconClass || ''}`}>{icon}</div>
      </div>
      <div className={styles.kpiValue}>
        {value}
        {suffix && <span className={styles.kpiSuffix}>{suffix}</span>}
      </div>
      <div className={styles.kpiMeta}>
        <span className={`${styles.delta} ${deltaClass}`}>{arrow} {delta}</span>
        <span>vs. semana anterior</span>
      </div>
      {sparkData && (
        <div className={styles.spark}>
          <Sparkline data={sparkData} color={sparkColor} w={120} h={44}/>
        </div>
      )}
    </div>
  );
}

/* ── Revenue Chart ───────────────────────────────────────────────── */
function RevenueChart() {
  const data = [
    { d: 'Seg', v: 1240 }, { d: 'Ter', v: 1840 }, { d: 'Qua', v: 1520 },
    { d: 'Qui', v: 2180 }, { d: 'Sex', v: 2640 }, { d: 'Sáb', v: 3120 }, { d: 'Dom', v: 2380 },
  ];
  const W = 700, H = 200, pad = { l: 40, r: 16, t: 12, b: 28 };
  const max = 3500;
  const xStep = (W - pad.l - pad.r) / (data.length - 1);
  const points = data.map((p, i) => [
    pad.l + i * xStep,
    pad.t + (1 - p.v / max) * (H - pad.t - pad.b),
  ]);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${points[points.length - 1][0]},${H - pad.b} L${pad.l},${H - pad.b} Z`;
  const accent = 'oklch(0.52 0.16 270)';

  return (
    <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 1000, 2000, 3000].map((y) => {
        const Y = pad.t + (1 - y / max) * (H - pad.t - pad.b);
        return (
          <g key={y}>
            <line x1={pad.l} x2={W - pad.r} y1={Y} y2={Y} stroke="var(--border)" strokeDasharray="2 4"/>
            <text x={pad.l - 8} y={Y + 3} textAnchor="end" fontSize="10" fill="var(--text-s)"
                  fontFamily="Geist Mono, monospace">
              {y >= 1000 ? `${y / 1000}k` : y}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#revGrad)"/>
      <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill="var(--surface)" stroke={accent} strokeWidth="2"/>
          <text x={p[0]} y={H - 10} textAnchor="middle" fontSize="11"
                fill="var(--text-m)" fontFamily="Geist Mono, monospace">
            {data[i].d}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Thumb ───────────────────────────────────────────────────────── */
function Thumb({ idx, imageUrl, alt }) {
  const c1 = THUMB_COLORS[idx % THUMB_COLORS.length];
  const c2 = THUMB_COLORS[(idx + 1) % THUMB_COLORS.length];
  if (imageUrl) {
    return (
      <div className={styles.thumb}>
        <img src={imageUrl} alt={alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}/>
      </div>
    );
  }
  return (
    <div className={styles.thumb}
         style={{ background: `repeating-linear-gradient(135deg,${c1},${c1} 4px,${c2} 4px,${c2} 8px)` }}/>
  );
}

/* ── Status Pill ─────────────────────────────────────────────────── */
function Pill({ status }) {
  return (
    <span className={`${styles.pill} ${PILL_CLASS[status] || ''}`}>
      <span className={styles.pdot}/>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ── Activity feed (static for demo) ────────────────────────────── */
const ACTIVITY = [
  { dotBg: 'var(--pos-soft)',  dotFg: 'var(--pos)',      icon: <IcCheck size={14}/>,  text: <><b>Pedido entregue</b> <span>para Ana Costa</span></>, time: 'há 8min' },
  { dotBg: 'var(--info-soft)', dotFg: 'var(--info)',     icon: <IcTruck size={14}/>,  text: <><b>Pedido enviado</b> <span>via Correios</span></>,    time: 'há 32min' },
  { dotBg: 'var(--accent-soft)',dotFg: 'var(--accent-fg)',icon: <IcCart size={14}/>,  text: <><b>Beatriz Souza</b> <span>fez um novo pedido</span></>, time: 'há 1h' },
  { dotBg: 'var(--warn-soft)', dotFg: 'var(--warn)',     icon: <IcBox size={14}/>,    text: <><span>Estoque baixo: </span><b>Heavy Tee Preta M</b></>, time: 'há 2h' },
  { dotBg: 'var(--neg-soft)',  dotFg: 'var(--neg)',      icon: <IcCart size={14}/>,   text: <><b>Pedido cancelado</b> <span>por Carlos Lima</span></>,  time: 'ontem' },
];

/* ── FILTER CHIPS ────────────────────────────────────────────────── */
const FILTERS = [
  ['ALL', 'Todos'],
  ['PROCESSING', 'Processando'],
  ['SHIPPED', 'Enviados'],
  ['DELIVERED', 'Entregues'],
  ['CANCELLED', 'Cancelados'],
];

/* ── Main component ──────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter]     = useState('ALL');

  const exportCSV = () => {
    const escape = (v) => {
      const s = String(v ?? '');
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Pedido ID', 'Data', 'Hora', 'Cliente', 'Email', 'Status', 'Rastreio', 'Total (R$)', 'Produto', 'Tamanho', 'Qtd', 'Preço Unit (R$)', 'Subtotal (R$)'];
    const rows = [header];
    orders.forEach((o) => {
      const dt   = o.createdAt ? new Date(o.createdAt) : null;
      const date = dt ? dt.toLocaleDateString('pt-BR') : '';
      const time = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const items = o.items ?? [];
      if (items.length === 0) {
        rows.push([o.id, date, time, o.userName ?? '', o.userEmail ?? '',
          STATUS_LABELS[o.status] ?? o.status, o.trackingCode ?? '',
          String(o.total ?? '').replace('.', ','), '', '', '', '', '']);
      } else {
        items.forEach((it) => {
          const sub = ((it.unitPrice ?? 0) * (it.quantity ?? 1)).toFixed(2).replace('.', ',');
          rows.push([o.id, date, time, o.userName ?? '', o.userEmail ?? '',
            STATUS_LABELS[o.status] ?? o.status, o.trackingCode ?? '',
            String(o.total ?? '').replace('.', ','),
            it.productName ?? '', it.size ?? '', String(it.quantity ?? ''),
            String(it.unitPrice ?? '').replace('.', ','), sub]);
        });
      }
    });
    const csv  = '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getDashboardApi(),
      getAdminOrdersApi({ page: 0, size: 20 }),
    ])
      .then(([{ data: s }, { data: o }]) => {
        setStats(s);
        setOrders(o.content ?? []);
      })
      .catch((err) => {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'Erro de rede';
        setError(`Erro ${status ?? 'rede'}: ${msg}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatusApi(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      getDashboardApi().then(({ data }) => setStats(data));
    } catch (e) {
      alert('Erro ao atualizar status: ' + (e.response?.data?.message || e.message));
    } finally {
      setUpdating(null);
    }
  };

  const counts = useMemo(() => {
    const c = { ALL: orders.length, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach((o) => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [orders]);

  const visible = useMemo(
    () => filter === 'ALL' ? orders : orders.filter((o) => o.status === filter),
    [filter, orders],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'Admin';

  if (loading) return <div className={styles.center}>Carregando dashboard…</div>;
  if (error)   return <div className={styles.center}>{error}</div>;

  return (
    <div>
      {/* ── Page header ── */}
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>
            {greeting()}, <span className={styles.titleAccent}>{firstName}</span> 👋
          </h1>
          <p className={styles.pageSub}>
            Aqui está um resumo da sua loja — {todayStr()}.
          </p>
        </div>
        <div className={styles.pageActions}>
          <button className={styles.btn} onClick={exportCSV}><IcDown size={14}/> Exportar</button>
        </div>
      </header>

      {/* ── KPI cards ── */}
      <section className={styles.kpis}>
        <KpiCard
          label="Total de Pedidos" value={stats?.total ?? 0} suffix=" total"
          delta="+18%" deltaDir="up"
          icon={<IcBox size={15}/>}
          sparkData={[3, 5, 4, 7, 6, 8, Math.max(stats?.total ?? 9, 1)]}
          sparkColor="oklch(0.52 0.16 270)"
        />
        <KpiCard
          label="Entregues"
          value={stats?.delivered ?? 0}
          suffix=" pedidos"
          delta="+24%" deltaDir="up"
          icon={<IcChart size={15}/>} iconClass={styles.kpiIconPos}
          sparkData={[2, 3, 3, 4, 4, 5, Math.max(stats?.delivered ?? 5, 1)]}
          sparkColor="var(--pos)"
        />
        <KpiCard
          label="Em Processamento" value={stats?.processing ?? 0} suffix=" pedidos"
          delta={`${stats?.processing ?? 0} pendentes`}
          deltaDir={(stats?.processing ?? 0) > 2 ? 'down' : 'flat'}
          icon={<IcClock size={15}/>} iconClass={styles.kpiIconWarn}
          sparkData={[2, 4, 3, 5, 4, 3, Math.max(stats?.processing ?? 3, 1)]}
          sparkColor="var(--warn)"
        />
        <KpiCard
          label="Enviados" value={stats?.shipped ?? 0} suffix=" pedidos"
          delta="+2.4%" deltaDir="up"
          icon={<IcTruck size={15}/>} iconClass={styles.kpiIconInfo}
          sparkData={[1, 2, 2, 3, 2, 3, Math.max(stats?.shipped ?? 2, 1)]}
          sparkColor="var(--info)"
        />
      </section>

      {/* ── Split: chart + activity ── */}
      <section className={styles.split}>

        {/* Revenue chart */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Receita</h2>
              <p className={styles.panelSub}>Vendas dos últimos 7 dias</p>
            </div>
          </div>
          <div className={styles.chartWrap}>
            <RevenueChart/>
          </div>
          <div className={styles.chartStats}>
            <div>
              <div className={styles.chartStatVal}>R$ 14.920</div>
              <div className={styles.chartStatLbl}>Receita</div>
            </div>
            <div>
              <div className={styles.chartStatVal}>{stats?.total ?? 0}</div>
              <div className={styles.chartStatLbl}>Pedidos</div>
            </div>
            <div>
              <div className={styles.chartStatVal}>R$ 171,50</div>
              <div className={styles.chartStatLbl}>Ticket médio</div>
            </div>
            <div>
              <div className={styles.chartStatVal} style={{ color: 'var(--pos)' }}>+18,2%</div>
              <div className={styles.chartStatLbl}>vs. semana ant.</div>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Atividade recente</h2>
              <p className={styles.panelSub}>Últimas ações na loja</p>
            </div>
          </div>
          <div className={styles.activity}>
            {ACTIVITY.map((a, i) => (
              <div key={i} className={styles.act}>
                <div className={styles.actDot} style={{ background: a.dotBg, color: a.dotFg }}>
                  {a.icon}
                </div>
                <div className={styles.actText}>
                  {a.text}
                </div>
                <div className={styles.actTime}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Orders table ── */}
      <section className={styles.ordersPanel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Gestão de Pedidos</h2>
            <p className={styles.panelSub}>
              {visible.length} pedido{visible.length !== 1 ? 's' : ''}
              {filter !== 'ALL' ? ` · ${STATUS_LABELS[filter]}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={styles.btn} style={{ padding: '6px 12px', fontSize: 12.5 }}>
              <IcFilter size={13}/> Filtros
            </button>
            <button className={styles.btn} style={{ padding: '6px 12px', fontSize: 12.5 }}>
              <IcDown size={13}/> Exportar CSV
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          {FILTERS.map(([key, label]) => (
            <button key={key}
                    className={`${styles.chip} ${filter === key ? styles.chipActive : ''}`}
                    onClick={() => setFilter(key)}>
              {label}
              <span className={styles.chipCount}>{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-m)', padding: 40 }}>
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : visible.map((order, idx) => (
              <tr key={order.id}>
                {/* ID + date */}
                <td>
                  <div style={{ fontWeight: 500 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div className={styles.orderDate}>
                    {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
                  </div>
                </td>

                {/* Customer */}
                <td>
                  <div className={styles.custRow}>
                    <div className={styles.custAvatar} style={avatarStyle(order.userName)}>
                      {initials(order.userName)}
                    </div>
                    <div>
                      <div className={styles.custName}>{order.userName ?? '—'}</div>
                      <div className={styles.custEmail}>{order.userEmail ?? ''}</div>
                    </div>
                  </div>
                </td>

                {/* Items thumbnails */}
                <td>
                  <div className={styles.thumbRow}>
                    {(order.items ?? []).slice(0, 3).map((item, i) => (
                      <Thumb key={i} idx={idx + i} imageUrl={item.imageUrl} alt={item.productName}/>
                    ))}
                    {(order.items?.length ?? 0) > 3 && (
                      <div className={styles.thumbMore}>+{order.items.length - 3}</div>
                    )}
                    <span className={styles.thumbLabel}>
                      {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </td>

                {/* Total */}
                <td className={styles.total}>{fmtMoney(order.total)}</td>

                {/* Status pill */}
                <td><Pill status={order.status}/></td>

                {/* Actions */}
                <td>
                  <div className={styles.rowActions}>
                    <select
                      className={styles.rowSelect}
                      value={order.status}
                      disabled={updating === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="PROCESSING">Processando</option>
                      <option value="SHIPPED">Enviado</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                    <button className={styles.rowActBtn} title="Ver detalhes">
                      <IcEye size={14}/>
                    </button>
                    <button className={styles.rowActBtn} title="Mais ações">
                      <IcMore size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.pagination}>
          <div>
            Mostrando{' '}
            <span className={styles.mono}>1–{visible.length}</span>
            {' '}de{' '}
            <span className={styles.mono}>{orders.length}</span>
            {' '}pedidos
          </div>
        </div>
      </section>
    </div>
  );
}
