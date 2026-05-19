import { useState, useEffect, useRef } from 'react';
import {
  getAdminProductsApi, createProductApi, updateProductApi,
  deactivateProductApi, uploadProductImageApi,
} from '../../../api/productApi';
import styles from './Products.module.css';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CATEGORIES = ['Casual', 'Essentials', 'Sport', 'Streetwear', 'Heritage', 'Limited', 'Social', 'Active', 'Outerwear', 'Outros'];

const emptyForm = {
  name: '', description: '', price: '', category: CATEGORIES[0],
  sizes: [],
};

const ALL_SIZES = ['P', 'M', 'G', 'GG'];

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(0);
  const [error, setError]         = useState('');

  // Modal
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing]     = useState(null); // product being edited
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formErr, setFormErr]     = useState('');

  // Image upload
  const [imgProductId, setImgProductId] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const fileRef = useRef(null);

  const load = (p = 0) => {
    setLoading(true);
    getAdminProductsApi({ page: p, size: 12 })
      .then(({ data }) => {
        setProducts(data.content ?? []);
        setTotal(data.totalPages ?? 0);
        setPage(p);
      })
      .catch(() => setError('Erro ao carregar produtos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormErr('');
    setEditing(null);
    setModal('create');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      category: p.category ?? CATEGORIES[0],
      sizes: p.sizes?.map((s) => s.size) ?? [],
    });
    setFormErr('');
    setEditing(p);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const toggleSize = (s) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));

  const handleSave = async () => {
    if (!form.name.trim()) { setFormErr('Nome é obrigatório.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setFormErr('Preço inválido.'); return; }

    setSaving(true); setFormErr('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category,
      sizes: form.sizes.map((s) => ({ size: s, stockQuantity: 10 })),
    };

    try {
      if (modal === 'create') {
        const { data } = await createProductApi(payload);
        setProducts((prev) => [data, ...prev]);
      } else {
        const { data } = await updateProductApi(editing.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      }
      closeModal();
    } catch (err) {
      setFormErr(err.response?.data?.message ?? 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Desativar este produto?')) return;
    try {
      await deactivateProductApi(id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: false } : p));
    } catch { setError('Erro ao desativar produto.'); }
  };

  const handleImageClick = (id) => {
    setImgProductId(id);
    fileRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !imgProductId) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await uploadProductImageApi(imgProductId, fd);
      setProducts((prev) => prev.map((p) => p.id === imgProductId ? { ...p, imageUrl: data.imageUrl } : p));
    } catch { setError('Erro ao fazer upload da imagem.'); }
    finally {
      setImgUploading(false);
      e.target.value = '';
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Produtos</h1>
          <button className={styles.addBtn} onClick={openCreate}>+ Novo Produto</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p className={styles.center}>Carregando...</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={!p.active ? styles.inactive : ''}>
                      <td>
                        <div
                          className={styles.imgCell}
                          title="Clique para trocar imagem"
                          onClick={() => handleImageClick(p.id)}
                        >
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className={styles.thumb} />
                            : <span className={styles.noImg}>📷</span>}
                        </div>
                      </td>
                      <td className={styles.nameCell}>{p.name}</td>
                      <td>{p.category ?? '—'}</td>
                      <td>{fmt(p.price)}</td>
                      <td>
                        <span className={p.active ? styles.badgeActive : styles.badgeOff}>
                          {p.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => openEdit(p)}>Editar</button>
                          {p.active && (
                            <button className={styles.deactivateBtn} onClick={() => handleDeactivate(p.id)}>
                              Desativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 0} onClick={() => load(page - 1)}>Anterior</button>
                <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
                <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      {imgUploading && <div className={styles.uploadOverlay}>Enviando imagem...</div>}

      {/* Modal */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{modal === 'create' ? 'Novo Produto' : 'Editar Produto'}</h2>

            <div className={styles.mField}>
              <label>Nome *</label>
              <input className={styles.mInput} value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div className={styles.mField}>
              <label>Descrição</label>
              <textarea className={styles.mTextarea} rows={3} value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className={styles.mRow}>
              <div className={styles.mField}>
                <label>Preço (R$) *</label>
                <input className={styles.mInput} type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className={styles.mField}>
                <label>Categoria</label>
                <select className={styles.mInput} value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.mField}>
              <label>Tamanhos</label>
              <div className={styles.sizeGrid}>
                {ALL_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.sizeBtn} ${form.sizes.includes(s) ? styles.sizeBtnOn : ''}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {formErr && <p className={styles.formError}>{formErr}</p>}

            <div className={styles.modalBtns}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
