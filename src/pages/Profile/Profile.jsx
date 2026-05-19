import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  getProfileApi, updateProfileApi, updatePasswordApi,
  getAddressesApi, addAddressApi, deleteAddressApi, setDefaultAddressApi,
} from '../../api/userApi';
import { getUserOrdersApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import styles from './Profile.module.css';

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
const IPlus    = () => <Ic d={<><path d="M12 5v14M5 12h14"/></>}/>;
const ITrash   = () => <Ic d={<><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>}/>;
const ICheck   = () => <Ic d={<><path d="M5 12l4 4L19 7"/></>}/>;
const IHome    = () => <Ic d={<><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/></>}/>;
const IHeart   = () => <Ic d={<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></>}/>;
const ICard    = () => <Ic d={<><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></>}/>;
const IGift    = () => <Ic d={<><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9a1 1 0 001 1h12a1 1 0 001-1v-9M12 8v14"/><path d="M7.5 8a2.5 2.5 0 010-5C9 3 12 8 12 8s-3 0-4.5 0zM16.5 8a2.5 2.5 0 000-5C15 3 12 8 12 8s3 0 4.5 0z"/></>}/>;
const IArrow   = () => <Ic d={<><path d="M5 12h14M13 5l7 7-7 7"/></>}/>;
const IEdit    = () => <Ic d={<><path d="M14 4l6 6L8 22H2v-6L14 4z"/></>}/>;
const IShield  = () => <Ic d={<><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/></>}/>;
const IMonitor = () => <Ic d={<><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>}/>;
const IPhone2  = () => <Ic d={<><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></>}/>;
const IMail    = () => <Ic d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></>}/>;
const IPhone   = () => <Ic d={<><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.13.96.36 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.34 1.84.57 2.8.7a2 2 0 011.7 2z"/></>}/>;
const IX       = () => <Ic d={<><path d="M5 5l14 14M19 5L5 19"/></>}/>;

/* ── Helpers ─────────────────────────────────────────────────────────── */
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

function pwdStrength(pw) {
  let score = 0;
  const checks = {
    len:    pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    digit:  /\d/.test(pw),
    symbol: /[^A-Za-z\d]/.test(pw),
  };
  score = Object.values(checks).filter(Boolean).length;
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const labels = ['', 'Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Excelente'];
  return { score, checks, color: colors[score] || '', label: labels[score] || '' };
}

const emptyAddr = {
  street: '', number: '', complement: '', neighborhood: '',
  city: '', state: '', zipCode: '',
};

/* ── Toggle ──────────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleThumb}/>
    </button>
  );
}

/* ── T-shirt placeholder ─────────────────────────────────────────────── */
const SHIRT_COLORS = ['#161513', '#9c978d', '#ffffff', '#1f3a5f', '#5a6442'];
const BG_COLORS    = ['#efece6', '#e6e3dc', '#f0ede7', '#e8e4dc'];
function TshirtSVG({ idx = 0 }) {
  const color  = SHIRT_COLORS[idx % SHIRT_COLORS.length];
  const bg     = BG_COLORS[idx % BG_COLORS.length];
  const stroke = ['#ffffff', '#cfc7b6', '#e8e2d4'].includes(color) ? '#c9c4b8' : 'rgba(0,0,0,0.18)';
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="500" fill={bg}/>
      <path d="M120 130 L80 160 L60 220 L100 235 L105 260 L105 410 L295 410 L295 260 L300 235 L340 220 L320 160 L280 130 L255 120 Q255 145 200 145 Q145 145 145 120 Z"
        fill={color} stroke={stroke} strokeWidth="1.2"/>
    </svg>
  );
}

/* ── Status pill ─────────────────────────────────────────────────────── */
const STATUS_MAP = {
  PROCESSING: { label: 'Processando', cls: styles.pillWarn },
  SHIPPED:    { label: 'Enviado',     cls: styles.pillInfo },
  DELIVERED:  { label: 'Entregue',    cls: styles.pillPos  },
  CANCELLED:  { label: 'Cancelado',   cls: styles.pillNeg  },
};
function Pill({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.PROCESSING;
  return <span className={`${styles.pill} ${s.cls}`}><span className={styles.pdot}/>{s.label}</span>;
}

/* ── Sections config ─────────────────────────────────────────────────── */
const VALID_SECTIONS = ['overview', 'profile', 'addresses', 'security', 'favorites'];

const SECTION_HEAD = {
  overview:  { pre: 'Olá, ', title: '',            italic: true,  sub: 'Bem-vindo de volta — confira pedidos, dados e preferências.' },
  profile:   { pre: 'Dados ', title: 'pessoais',   italic: true,  sub: 'Mantenha suas informações sempre atualizadas.' },
  addresses: { pre: '',       title: 'Endereços',  italic: false, sub: 'Salve onde quer receber seus pedidos.' },
  security:  { pre: '',       title: 'Segurança',  italic: false, sub: 'Senha, sessões e verificação em duas etapas.' },
  favorites: { pre: '',       title: 'Favoritos',  italic: false, sub: 'Itens que você marcou para depois.' },
};

/* ── Profile ─────────────────────────────────────────────────────────── */
export default function Profile() {
  const { user, updateUserState, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSection = VALID_SECTIONS.includes(searchParams.get('s'))
    ? searchParams.get('s')
    : 'overview';
  const [section, setSection] = useState(initialSection);

  /* ── Dados pessoais ────────────────────────────── */
  const [profile, setProfile]         = useState({ name: '', email: '', phone: '', cpf: '', birth: '', gender: 'Prefiro não informar' });
  const [profLoading, setProfLoading] = useState(false);
  const [profMsg, setProfMsg]         = useState(null);
  const [prefs, setPrefs]             = useState({ news: true, promo: true, status: true, abandoned: false });
  const name = profile.name || user?.name || '';

  useEffect(() => {
    getProfileApi().then(({ data }) =>
      setProfile((p) => ({
        ...p,
        name:  data.name  ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        cpf:   data.cpf   ?? '',
        birth: data.birth ?? '',
        gender: data.gender ?? 'Prefiro não informar',
      }))
    ).catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfLoading(true); setProfMsg(null);
    try {
      const { data } = await updateProfileApi({ name: profile.name, email: profile.email });
      updateUserState({ name: data.name, email: data.email });
      setProfMsg({ ok: true, text: 'Dados atualizados com sucesso!' });
    } catch (err) {
      setProfMsg({ ok: false, text: err.response?.data?.message ?? 'Erro ao atualizar.' });
    } finally { setProfLoading(false); }
  };

  /* ── Senha ─────────────────────────────────────── */
  const [pwd, setPwd]               = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg]         = useState(null);
  const [showPwd, setShowPwd]       = useState({ cur: false, new: false, conf: false });
  const strength = pwdStrength(pwd.newPassword);

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) { setPwdMsg({ ok: false, text: 'As senhas não coincidem.' }); return; }
    if (pwd.newPassword.length < 6) { setPwdMsg({ ok: false, text: 'Mínimo 6 caracteres.' }); return; }
    setPwdLoading(true); setPwdMsg(null);
    try {
      await updatePasswordApi({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      setPwdMsg({ ok: true, text: 'Senha atualizada com sucesso!' });
    } catch (err) {
      setPwdMsg({ ok: false, text: err.response?.data?.message ?? 'Erro ao atualizar senha.' });
    } finally { setPwdLoading(false); }
  };

  /* ── Endereços ─────────────────────────────────── */
  const [addresses, setAddresses]     = useState([]);
  const [editingAddr, setEditingAddr] = useState(null); // null | 'new' | id
  const [newAddr, setNewAddr]         = useState(emptyAddr);
  const [addrSaving, setAddrSaving]   = useState(false);
  const [addrMsg, setAddrMsg]         = useState(null);

  const loadAddresses = useCallback(() => {
    getAddressesApi().then(({ data }) => setAddresses(data)).catch(() => {});
  }, []);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const handleSaveAddr = async () => {
    setAddrSaving(true); setAddrMsg(null);
    try {
      const { data } = await addAddressApi(newAddr);
      setAddresses((prev) => [...prev, data]);
      setNewAddr(emptyAddr);
      setEditingAddr(null);
      setAddrMsg({ ok: true, text: 'Endereço adicionado!' });
    } catch {
      setAddrMsg({ ok: false, text: 'Erro ao salvar endereço.' });
    } finally { setAddrSaving(false); }
  };

  const handleDeleteAddr = async (id) => {
    if (!confirm('Remover este endereço?')) return;
    try {
      await deleteAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch { setAddrMsg({ ok: false, text: 'Erro ao remover endereço.' }); }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddressApi(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch { setAddrMsg({ ok: false, text: 'Erro ao definir padrão.' }); }
  };

  /* ── Orders (para overview) ────────────────────── */
  const [orders, setOrders]     = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  useEffect(() => {
    getUserOrdersApi().then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.content ?? []);
      setOrders(list);
      setOrdersLoaded(true);
    }).catch(() => setOrdersLoaded(true));
  }, []);

  const orderStats = useMemo(() => {
    const active  = orders.filter((o) => ['PROCESSING', 'SHIPPED'].includes(o.status));
    const valid   = orders.filter((o) => o.status !== 'CANCELLED');
    const spent   = valid.reduce((s, o) => s + (o.totalPrice ?? o.total ?? 0), 0);
    const pts     = Math.round(spent);
    return { total: orders.length, active: active.length, spent, pts };
  }, [orders]);

  /* ── Favoritos (localStorage) ──────────────────── */
  const [favorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teestore_favs') || '[]'); } catch { return []; }
  });

  /* ── Logout ────────────────────────────────────── */
  const handleLogout = () => { logout(); navigate('/'); };

  /* ── Sidebar NAV ───────────────────────────────── */
  const NAV = [
    { k: 'overview',   l: 'Visão geral',    ic: IHome,  ct: null },
    { k: 'orders',     l: 'Meus Pedidos',   ic: IBox,   ct: orders.length || null, href: '/orders' },
    { k: 'favorites',  l: 'Favoritos',      ic: IHeart, ct: favorites.length || null },
    { k: 'profile',    l: 'Dados pessoais', ic: IUser,  ct: null },
    { k: 'security',   l: 'Segurança',      ic: ILock,  ct: null },
    { k: 'addresses',  l: 'Endereços',      ic: IPin,   ct: addresses.length || null },
  ];

  const head = SECTION_HEAD[section] ?? SECTION_HEAD.overview;

  /* ── Render ────────────────────────────────────── */
  return (
    <main className={styles.shell}>
      {/* Breadcrumb + título */}
      <div className={styles.pageHead}>
        <div className={styles.crumbs}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>TeeStore</Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbHere}>{NAV.find((n) => n.k === section)?.l ?? 'Conta'}</span>
        </div>
        <h1 className={styles.pageTitle}>
          {section === 'overview'
            ? <>{head.pre}<span className={styles.pageTitleIt}>{name}</span></>
            : head.italic
              ? <>{head.pre}<span className={styles.pageTitleIt}>{head.title}</span></>
              : head.title
          }
        </h1>
        <p className={styles.pageSub}>{head.sub}</p>
      </div>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.side}>
          <div className={styles.sideUser}>
            <div className={styles.avatar}>{initials(name) || '?'}</div>
            <div style={{ minWidth: 0 }}>
              <div className={styles.meName}>{name || '—'}</div>
              <div className={styles.meMail}>{profile.email || user?.email || ''}</div>
            </div>
          </div>

          <nav className={styles.sideNav}>
            {NAV.map((n) =>
              n.href ? (
                <Link
                  key={n.k}
                  to={n.href}
                  className={styles.sideLink}
                >
                  <n.ic/> <span>{n.l}</span>
                  {n.ct != null && <span className={styles.sideCt}>{n.ct}</span>}
                </Link>
              ) : (
                <button
                  key={n.k}
                  className={`${styles.sideLink} ${section === n.k ? styles.sideLinkActive : ''}`}
                  onClick={() => setSection(n.k)}
                >
                  <n.ic/> <span>{n.l}</span>
                  {n.ct != null && <span className={`${styles.sideCt} ${section === n.k ? styles.sideCtActive : ''}`}>{n.ct}</span>}
                </button>
              )
            )}

            <div className={styles.sideDivider}/>

            <button className={`${styles.sideLink} ${styles.sideLinkDanger}`} onClick={handleLogout}>
              <ILogout/> <span>Sair</span>
            </button>
          </nav>

          <div className={styles.sideFoot}>
            TeeClub <b style={{ color: 'var(--text)' }}>Silver</b> · {orderStats.pts.toLocaleString('pt-BR')} pts
          </div>
        </aside>

        {/* ── Content ── */}
        <div className={styles.content}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <>
              {/* Stat cards */}
              <div className={styles.ovGrid}>
                <div className={styles.ovCard}>
                  <div className={styles.ovLabel}><IBox/> Pedidos totais</div>
                  <div className={styles.ovValue}>{ordersLoaded ? orderStats.total : '—'}</div>
                  <div className={styles.ovMeta}>{orderStats.active} em andamento</div>
                </div>
                <div className={styles.ovCard}>
                  <div className={styles.ovLabel}><ICard/> Total gasto</div>
                  <div className={styles.ovValue}>{ordersLoaded ? fmtBRL(orderStats.spent) : '—'}</div>
                  <div className={styles.ovMeta}>em {orders.length} pedido{orders.length !== 1 ? 's' : ''}</div>
                </div>
                <div className={styles.ovCard}>
                  <div className={styles.ovLabel}><IGift/> Pontos TeeClub</div>
                  <div className={styles.ovValue}>{ordersLoaded ? orderStats.pts.toLocaleString('pt-BR') : '—'}</div>
                  <div className={styles.ovMeta}>nível Silver</div>
                </div>
              </div>

              {/* Pedidos recentes */}
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Pedidos recentes</h2>
                    <p className={styles.panelSub}>Suas últimas compras na TeeStore</p>
                  </div>
                  <Link to="/orders" className={`${styles.btn}`}>Ver todos <IArrow/></Link>
                </div>
                <div>
                  {orders.length === 0 && ordersLoaded ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><IBox/></div>
                      <div className={styles.emptyTitle}>Nenhum pedido ainda</div>
                      <Link to="/" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 12 }}>Explorar loja</Link>
                    </div>
                  ) : orders.slice(0, 3).map((o) => (
                    <Link to="/orders" key={o.id} className={styles.recentOrder}>
                      <div className={styles.orderIdBlock}>
                        <div className={styles.orderId}>#{o.id}</div>
                        <div className={styles.orderDate}>{fmtDate(o.createdAt || o.date)}</div>
                      </div>
                      <div className={styles.orderThumbStack}>
                        {(o.items ?? []).slice(0, 3).map((it, i) => (
                          <div key={i} className={styles.otb}>
                            {it.imageUrl
                              ? <img src={it.imageUrl} alt={it.productName ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}/>
                              : <TshirtSVG idx={i}/>
                            }
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <Pill status={o.status}/>
                        <span className={styles.orderTotal}>{fmtBRL(o.totalPrice ?? o.total ?? 0)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Favoritos */}
              <div className={styles.panel} style={{ marginTop: 16 }}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Favoritos</h2>
                    <p className={styles.panelSub}>Itens que você salvou para depois</p>
                  </div>
                  <button className={styles.btn} onClick={() => setSection('favorites')}>Ver todos</button>
                </div>
                {favorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><IHeart/></div>
                    <div className={styles.emptyTitle}>Nenhum favorito ainda</div>
                    <p style={{ fontSize: 13, color: 'var(--text-m)', margin: '4px 0 12px' }}>Toque no coração em qualquer produto para salvar aqui.</p>
                    <Link to="/" className={`${styles.btn} ${styles.btnPrimary}`}>Explorar loja</Link>
                  </div>
                ) : (
                  <div className={styles.favGrid}>
                    {favorites.slice(0, 3).map((f, i) => (
                      <div key={f.id ?? i} className={styles.favCard}>
                        <div className={styles.favImg}>
                          {f.imageUrl
                            ? <img src={f.imageUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}/>
                            : <TshirtSVG idx={i}/>
                          }
                        </div>
                        <div className={styles.favInfo}>
                          <div className={styles.favName}>{f.name}</div>
                          <div className={styles.favRow}>
                            <span className={styles.favCat}>{f.category ?? ''}</span>
                            <span className={styles.favPrice}>{fmtBRL(f.price ?? 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── DADOS PESSOAIS ── */}
          {section === 'profile' && (
            <>
              <form className={styles.panel} onSubmit={handleProfileSave}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Dados pessoais</h2>
                    <p className={styles.panelSub}>Mantenha suas informações atualizadas para uma melhor experiência.</p>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {/* Avatar row */}
                  <div className={styles.avatarRow}>
                    <div className={styles.avatarLg}>{initials(name) || '?'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-m)' }}>
                        TeeClub <b style={{ color: 'var(--text)' }}>Silver</b>
                      </div>
                    </div>
                  </div>

                  {profMsg && (
                    <div className={profMsg.ok ? styles.msgSuccess : styles.msgError}>{profMsg.text}</div>
                  )}

                  <div className={styles.formGrid}>
                    <label className={`${styles.field} ${styles.full}`}>
                      <span className={styles.fieldLabel}>Nome completo</span>
                      <input className={styles.input} value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Seu nome"/>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>E-mail</span>
                      <div className={styles.fieldWrap}>
                        <IMail/>
                        <input className={`${styles.input} ${styles.inputIcon}`} type="email" value={profile.email}
                          onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="seu@email.com"/>
                      </div>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Telefone</span>
                      <div className={styles.fieldWrap}>
                        <IPhone/>
                        <input className={`${styles.input} ${styles.inputIcon}`} value={profile.phone}
                          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+55 11 90000-0000"/>
                      </div>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>CPF</span>
                      <input className={styles.input} value={profile.cpf}
                        onChange={(e) => setProfile((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00"/>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Data de nascimento</span>
                      <input className={styles.input} type="date" value={profile.birth}
                        onChange={(e) => setProfile((p) => ({ ...p, birth: e.target.value }))}/>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Gênero</span>
                      <select className={styles.input} value={profile.gender}
                        onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                        <option>Masculino</option>
                        <option>Feminino</option>
                        <option>Não-binário</option>
                        <option>Prefiro não informar</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={profLoading}>
                    {profLoading ? 'Salvando…' : 'Salvar alterações'}
                  </button>
                  <button type="button" className={styles.btn} onClick={() => setProfMsg(null)}>Descartar</button>
                </div>
              </form>

              {/* Preferências de comunicação */}
              <div className={styles.panel} style={{ marginTop: 16 }}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Preferências de comunicação</h2>
                    <p className={styles.panelSub}>Escolha o que você quer receber de nós.</p>
                  </div>
                </div>
                <div className={styles.panelBody} style={{ paddingBottom: 8 }}>
                  {[
                    ['news',      'Newsletter & lançamentos',  'Coleções, drops e edições limitadas — semanalmente.'],
                    ['promo',     'Promoções e cupons',        'Descontos e ofertas exclusivas para assinantes.'],
                    ['status',    'Status de pedidos',         'Avisos importantes sobre seus pedidos.'],
                    ['abandoned', 'Carrinho abandonado',       'Lembretes amigáveis sobre itens deixados de lado.'],
                  ].map(([k, label, sub]) => (
                    <div key={k} className={styles.prefRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-m)' }}>{sub}</div>
                      </div>
                      <Toggle on={prefs[k]} onChange={(v) => setPrefs((p) => ({ ...p, [k]: v }))}/>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ENDEREÇOS ── */}
          {section === 'addresses' && (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2 className={styles.panelTitle}>Endereços</h2>
                  <p className={styles.panelSub}>Seus endereços de entrega cadastrados.</p>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setEditingAddr('new')}>
                  <IPlus/> Novo endereço
                </button>
              </div>

              {addrMsg && (
                <div style={{ padding: '0 24px 8px' }}>
                  <div className={addrMsg.ok ? styles.msgSuccess : styles.msgError}>{addrMsg.text}</div>
                </div>
              )}

              {/* Formulário novo endereço */}
              {editingAddr === 'new' && (
                <div className={styles.panelBody} style={{ paddingTop: 0 }}>
                  <div className={styles.newAddrBox}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 14.5, fontWeight: 600 }}>Novo endereço</h3>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>CEP</span>
                        <input className={styles.input} value={newAddr.zipCode}
                          onChange={(e) => setNewAddr((p) => ({ ...p, zipCode: e.target.value }))} placeholder="00000-000"/>
                      </label>
                      <label className={`${styles.field} ${styles.full}`}>
                        <span className={styles.fieldLabel}>Rua / Avenida</span>
                        <input className={styles.input} value={newAddr.street}
                          onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))}/>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Número</span>
                        <input className={styles.input} value={newAddr.number}
                          onChange={(e) => setNewAddr((p) => ({ ...p, number: e.target.value }))}/>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Complemento</span>
                        <input className={styles.input} value={newAddr.complement}
                          onChange={(e) => setNewAddr((p) => ({ ...p, complement: e.target.value }))} placeholder="Apto, bloco…"/>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Bairro</span>
                        <input className={styles.input} value={newAddr.neighborhood}
                          onChange={(e) => setNewAddr((p) => ({ ...p, neighborhood: e.target.value }))}/>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Cidade</span>
                        <input className={styles.input} value={newAddr.city}
                          onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}/>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Estado (UF)</span>
                        <input className={styles.input} value={newAddr.state} maxLength={2}
                          onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value.toUpperCase() }))} placeholder="SP"/>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={addrSaving} onClick={handleSaveAddr}>
                        {addrSaving ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button className={styles.btn} onClick={() => setEditingAddr(null)}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.addrGrid}>
                {addresses.map((a) => (
                  <div key={a.id} className={`${styles.addrCard} ${a.isDefault ? styles.addrCardDefault : ''}`}>
                    {a.isDefault && <span className={styles.addrDefaultTag}>Padrão</span>}
                    <div className={styles.addrTag}>{a.tag || 'Endereço'}</div>
                    <div className={styles.addrLine}>{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ''}</div>
                    <div className={styles.addrLine}>{a.neighborhood} · {a.city}, {a.state}</div>
                    <div className={styles.addrLine}>CEP {a.zipCode}</div>
                    <div className={styles.addrActions}>
                      {!a.isDefault && (
                        <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => handleSetDefault(a.id)}>
                          <ICheck/> Tornar padrão
                        </button>
                      )}
                      <button className={`${styles.btn} ${styles.btnDanger}`} style={{ marginLeft: 'auto' }}
                        onClick={() => handleDeleteAddr(a.id)}>
                        <ITrash/>
                      </button>
                    </div>
                  </div>
                ))}
                <button className={styles.addrAdd} onClick={() => setEditingAddr('new')}>
                  <IPlus/> <span>Novo endereço</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-s)', fontWeight: 400 }}>Salve até 5 endereços</span>
                </button>
              </div>
            </div>
          )}

          {/* ── SEGURANÇA ── */}
          {section === 'security' && (
            <>
              {/* Senha */}
              <form className={styles.panel} onSubmit={handlePasswordSave}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Senha</h2>
                    <p className={styles.panelSub}>Recomendamos atualizar sua senha regularmente.</p>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {pwdMsg && (
                    <div className={pwdMsg.ok ? styles.msgSuccess : styles.msgError}>{pwdMsg.text}</div>
                  )}
                  <div className={styles.formGrid}>
                    <label className={`${styles.field} ${styles.full}`}>
                      <span className={styles.fieldLabel}>Senha atual</span>
                      <div className={styles.fieldWrap}>
                        <ILock/>
                        <input className={`${styles.input} ${styles.inputIcon}`}
                          type={showPwd.cur ? 'text' : 'password'}
                          value={pwd.currentPassword}
                          onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                          placeholder="Sua senha atual"/>
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd((p) => ({ ...p, cur: !p.cur }))}>
                          {showPwd.cur ? '🙈' : '👁'}
                        </button>
                      </div>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Nova senha</span>
                      <div className={styles.fieldWrap}>
                        <ILock/>
                        <input className={`${styles.input} ${styles.inputIcon}`}
                          type={showPwd.new ? 'text' : 'password'}
                          value={pwd.newPassword}
                          onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Mín. 8 caracteres"/>
                      </div>
                      <div className={styles.strengthWrap}>
                        <div className={styles.strengthBar} style={{ width: `${strength.score * 20}%`, background: strength.color }}/>
                      </div>
                      <div className={styles.checkList}>
                        {[
                          [strength.checks.len,    '8+ caracteres'],
                          [strength.checks.upper,  'Maiúscula'],
                          [strength.checks.lower,  'Minúscula'],
                          [strength.checks.digit,  'Número'],
                          [strength.checks.symbol, 'Símbolo'],
                        ].map(([ok, lbl]) => (
                          <span key={lbl} className={ok ? styles.checkOk : styles.checkNo}>
                            <ICheck/> {lbl}
                          </span>
                        ))}
                      </div>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Confirmar nova senha</span>
                      <div className={styles.fieldWrap}>
                        <ILock/>
                        <input className={`${styles.input} ${styles.inputIcon}`}
                          type={showPwd.conf ? 'text' : 'password'}
                          value={pwd.confirm}
                          onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                          placeholder="Repita a nova senha"/>
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd((p) => ({ ...p, conf: !p.conf }))}>
                          {showPwd.conf ? '🙈' : '👁'}
                        </button>
                      </div>
                      {pwd.confirm.length > 0 && pwd.confirm !== pwd.newPassword && (
                        <div className={styles.msgError} style={{ padding: '6px 10px', marginBottom: 0, marginTop: 4 }}>
                          <IX/> As senhas não coincidem
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pwdLoading}>
                    {pwdLoading ? 'Salvando…' : 'Alterar senha'}
                  </button>
                  <button type="button" className={styles.btn} onClick={() => setPwd({ currentPassword: '', newPassword: '', confirm: '' })}>
                    Cancelar
                  </button>
                </div>
              </form>

              {/* 2FA */}
              <div className={styles.panel} style={{ marginTop: 16 }}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>
                      Verificação em duas etapas{' '}
                      <span className={`${styles.pill} ${styles.pillWarn}`} style={{ marginLeft: 6, fontSize: 11 }}>
                        <span className={styles.pdot}/> Não ativada
                      </span>
                    </h2>
                    <p className={styles.panelSub}>Adicione uma camada extra de segurança usando seu celular.</p>
                  </div>
                  <button className={`${styles.btn} ${styles.btnPrimary}`}><IShield/> Ativar 2FA</button>
                </div>
              </div>

              {/* Sessões ativas */}
              <div className={styles.panel} style={{ marginTop: 16 }}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Sessões ativas</h2>
                    <p className={styles.panelSub}>Dispositivos conectados à sua conta.</p>
                  </div>
                  <button className={`${styles.btn} ${styles.btnDanger}`}>Sair de todos</button>
                </div>
                <div className={styles.panelBody} style={{ paddingTop: 0 }}>
                  {[
                    { Icon: IMonitor, name: 'Chrome · Desktop', meta: 'São Paulo, BR', when: 'agora', current: true },
                    { Icon: IPhone2,  name: 'Safari · iPhone',  meta: 'São Paulo, BR', when: 'há 2 horas', current: false },
                  ].map((s, i) => (
                    <div key={i} className={styles.session}>
                      <div className={styles.sessionIcon}><s.Icon/></div>
                      <div>
                        <div className={styles.sessionName}>
                          {s.name}
                          {s.current && <span className={styles.sessionNow}>Esta sessão</span>}
                        </div>
                        <div className={styles.sessionMeta}>{s.meta} · {s.when}</div>
                      </div>
                      {!s.current && (
                        <button className={`${styles.btn} ${styles.btnGhost}`} style={{ color: 'var(--neg)' }}>Revogar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── FAVORITOS ── */}
          {section === 'favorites' && (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2 className={styles.panelTitle}>Favoritos</h2>
                  <p className={styles.panelSub}>{favorites.length} produto{favorites.length !== 1 ? 's' : ''} salvos</p>
                </div>
              </div>
              {favorites.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><IHeart/></div>
                  <div className={styles.emptyTitle}>Nenhum favorito ainda</div>
                  <p style={{ fontSize: 13, color: 'var(--text-m)', margin: '4px 0 12px' }}>
                    Toque no coração em qualquer produto na loja para salvar aqui.
                  </p>
                  <Link to="/" className={`${styles.btn} ${styles.btnPrimary}`}>Explorar loja</Link>
                </div>
              ) : (
                <div className={styles.favGrid}>
                  {favorites.map((f, i) => (
                    <div key={f.id ?? i} className={styles.favCard}>
                      <div className={styles.favImg}>
                        {f.imageUrl
                          ? <img src={f.imageUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                          : <TshirtSVG idx={i}/>
                        }
                      </div>
                      <div className={styles.favInfo}>
                        <div className={styles.favName}>{f.name}</div>
                        <div className={styles.favRow}>
                          <span className={styles.favCat}>{f.category ?? ''}</span>
                          <span className={styles.favPrice}>{fmtBRL(f.price ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
