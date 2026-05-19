import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAddressesApi, addAddressApi } from '../../api/userApi';
import { createOrderApi } from '../../api/orderApi';
import { useCart } from '../../context/CartContext';
import styles from './Checkout.module.css';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const emptyAddr = {
  street: '', number: '', complement: '', neighborhood: '',
  city: '', state: '', zipCode: '',
};

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses]           = useState([]);
  const [selectedAddr, setSelectedAddr]     = useState(null);
  const [showNewAddr, setShowNewAddr]       = useState(false);
  const [newAddr, setNewAddr]               = useState(emptyAddr);
  const [loadingAddr, setLoadingAddr]       = useState(true);
  const [savingAddr, setSavingAddr]         = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);

  const items = cart.items ?? [];

  useEffect(() => {
    getAddressesApi()
      .then(({ data }) => {
        setAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) setSelectedAddr(def.id);
        if (data.length === 0) setShowNewAddr(true);
      })
      .catch(() => setShowNewAddr(true))
      .finally(() => setLoadingAddr(false));
  }, []);

  const handleAddrChange = (e) =>
    setNewAddr((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveAddress = async () => {
    setSavingAddr(true);
    setError('');
    try {
      const { data } = await addAddressApi(newAddr);
      setAddresses((prev) => [...prev, data]);
      setSelectedAddr(data.id);
      setShowNewAddr(false);
      setNewAddr(emptyAddr);
    } catch {
      setError('Erro ao salvar endereço.');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddr) { setError('Selecione um endereço de entrega.'); return; }
    if (items.length === 0) { setError('Seu carrinho está vazio.'); return; }
    setError('');
    setSubmitting(true);

    const orderItems = items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
    }));

    try {
      await createOrderApi({ addressId: selectedAddr, items: orderItems });
      await clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao criar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2>Pedido realizado!</h2>
          <p>Redirecionando para seus pedidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Finalizar Compra</h1>

        <div className={styles.layout}>
          {/* Coluna esquerda: endereço */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Endereço de Entrega</h2>

            {loadingAddr ? (
              <p className={styles.loading}>Carregando endereços...</p>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className={styles.addrList}>
                    {addresses.map((a) => (
                      <label key={a.id} className={`${styles.addrCard} ${selectedAddr === a.id ? styles.addrSelected : ''}`}>
                        <input
                          type="radio"
                          name="address"
                          value={a.id}
                          checked={selectedAddr === a.id}
                          onChange={() => { setSelectedAddr(a.id); setShowNewAddr(false); }}
                        />
                        <div>
                          <p className={styles.addrLine}>{a.street}, {a.number} {a.complement}</p>
                          <p className={styles.addrLine}>{a.neighborhood} — {a.city}/{a.state}</p>
                          <p className={styles.addrLine}>CEP: {a.zipCode}</p>
                        </div>
                        {a.isDefault && <span className={styles.defaultBadge}>Padrão</span>}
                      </label>
                    ))}
                  </div>
                )}

                {showNewAddr ? (
                  <button
                    type="button"
                    className={styles.cancelAddrBtn}
                    onClick={() => {
                      setShowNewAddr(false);
                      setNewAddr(emptyAddr);
                      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
                      if (def) setSelectedAddr(def.id);
                    }}
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.addAddrBtn}
                    onClick={() => setShowNewAddr(true)}
                  >
                    + Adicionar novo endereço
                  </button>
                )}

                {showNewAddr && (
                  <div className={styles.newAddrForm}>
                    <div className={styles.formRow}>
                      <input className={styles.input} name="street"       placeholder="Rua"          value={newAddr.street}       onChange={handleAddrChange} />
                      <input className={styles.inputSm} name="number"     placeholder="Número"       value={newAddr.number}       onChange={handleAddrChange} />
                    </div>
                    <input className={styles.input} name="complement"     placeholder="Complemento (opcional)" value={newAddr.complement} onChange={handleAddrChange} />
                    <input className={styles.input} name="neighborhood"   placeholder="Bairro"       value={newAddr.neighborhood} onChange={handleAddrChange} />
                    <div className={styles.formRow}>
                      <input className={styles.input} name="city"         placeholder="Cidade"       value={newAddr.city}         onChange={handleAddrChange} />
                      <input className={styles.inputSm} name="state"      placeholder="UF"           value={newAddr.state}        onChange={handleAddrChange} maxLength={2} />
                    </div>
                    <input className={styles.input} name="zipCode"        placeholder="CEP"          value={newAddr.zipCode}      onChange={handleAddrChange} />
                    <button type="button" className={styles.saveAddrBtn} onClick={handleSaveAddress} disabled={savingAddr}>
                      {savingAddr ? 'Salvando...' : 'Salvar endereço'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Coluna direita: resumo */}
          <aside className={styles.summary}>
            <h2 className={styles.sectionTitle}>Resumo do Pedido</h2>

            <ul className={styles.itemList}>
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`} className={styles.summaryItem}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemMeta}>Tam {item.size} × {item.quantity}</span>
                  <span className={styles.itemSubtotal}>{fmt(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className={styles.totalRow}>
              <span>Total</span>
              <strong>{fmt(cart.total)}</strong>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button
              className={styles.confirmBtn}
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
            >
              {submitting ? 'Processando...' : 'Confirmar Pedido'}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
