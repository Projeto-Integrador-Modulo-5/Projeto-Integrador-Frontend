import { useState } from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className={styles.footer}>
      <div className={styles.footerRow}>

        {/* Brand + newsletter */}
        <div>
          <div className={styles.footerBrand}>TeeStore</div>
          <p className={styles.footerTag}>
            Camisetas premium para o seu estilo. Algodão peruano, costura reforçada, modelagem certa.
          </p>
          <form className={styles.newsletter} onSubmit={(e) => e.preventDefault()}>
            <input
              className={styles.newsletterInput}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <button className={styles.newsletterBtn} type="submit">Inscrever</button>
          </form>
        </div>

        {/* Loja */}
        <div>
          <h4 className={styles.colTitle}>Loja</h4>
          <ul className={styles.colList}>
            <li><a href="#" className={styles.colLink}>Produtos</a></li>
            <li><a href="#" className={styles.colLink}>Novidades</a></li>
            <li><a href="#" className={styles.colLink}>Promoções</a></li>
            <li><a href="#" className={styles.colLink}>Coleções</a></li>
          </ul>
        </div>

        {/* Conta */}
        <div>
          <h4 className={styles.colTitle}>Conta</h4>
          <ul className={styles.colList}>
            <li><a href="/profile" className={styles.colLink}>Meu Perfil</a></li>
            <li><a href="/orders" className={styles.colLink}>Meus Pedidos</a></li>
            <li><a href="/profile?tab=addresses" className={styles.colLink}>Endereços</a></li>
            <li><a href="#" className={styles.colLink}>Favoritos</a></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <h4 className={styles.colTitle}>Suporte</h4>
          <ul className={styles.colList}>
            <li><a href="#" className={styles.colLink}>Contato</a></li>
            <li><a href="#" className={styles.colLink}>Trocas e Devoluções</a></li>
            <li><a href="#" className={styles.colLink}>Política de Privacidade</a></li>
            <li><a href="#" className={styles.colLink}>FAQ</a></li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBase}>
        <div>© {new Date().getFullYear()} TeeStore. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}
