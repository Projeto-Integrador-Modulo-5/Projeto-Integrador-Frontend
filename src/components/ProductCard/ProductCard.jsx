import { useState } from 'react';
import styles from './ProductCard.module.css';

/**
 * @param {{ product: Object, onAddToCart: Function }} props
 *
 * product shape (do backend):
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   price: number,
 *   imageUrl: string | null,
 *   active: boolean,
 *   sizes: Array<{ id: string, size: 'P'|'M'|'G'|'GG', stockQuantity: number }>
 * }
 */
export default function ProductCard({ product, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [adding, setAdding] = useState(false);

  const availableSizes = product.sizes?.filter((s) => s.stockQuantity > 0) ?? [];

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      // Seleciona o primeiro tamanho disponível automaticamente se só tiver 1
      if (availableSizes.length === 1) {
        setSelectedSize(availableSizes[0].size);
        return;
      }
      alert('Selecione um tamanho antes de adicionar ao carrinho.');
      return;
    }

    setAdding(true);
    try {
      await onAddToCart?.({ productId: product.id, size: selectedSize, quantity: 1 });
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={styles.card}>
      {/* Imagem do produto */}
      <div className={styles.imageArea}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>

      {/* Conteúdo */}
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>{formatPrice(product.price)}</p>

        {/* Chips de tamanho */}
        {availableSizes.length > 0 && (
          <div className={styles.sizes}>
            {availableSizes.map((s) => (
              <button
                key={s.id}
                className={`${styles.sizeChip} ${selectedSize === s.size ? styles.sizeChipActive : ''}`}
                onClick={() => setSelectedSize(s.size)}
                title={`Tamanho ${s.size}`}
              >
                {s.size}
              </button>
            ))}
          </div>
        )}

        {/* Botão */}
        <button
          className={styles.addBtn}
          onClick={handleAddToCart}
          disabled={adding || availableSizes.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {adding ? 'Adicionando...' : availableSizes.length === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </article>
  );
}
