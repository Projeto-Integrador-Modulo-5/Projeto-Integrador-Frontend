import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.logo}>TeeStore</span>
            <p className={styles.tagline}>Camisetas premium para o seu estilo.</p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Loja</h4>
              <a href="#" className={styles.link}>Produtos</a>
              <a href="#" className={styles.link}>Novidades</a>
              <a href="#" className={styles.link}>Promoções</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Conta</h4>
              <a href="#" className={styles.link}>Meu Perfil</a>
              <a href="#" className={styles.link}>Meus Pedidos</a>
              <a href="#" className={styles.link}>Endereços</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>Suporte</h4>
              <a href="#" className={styles.link}>Contato</a>
              <a href="#" className={styles.link}>Trocas e Devoluções</a>
              <a href="#" className={styles.link}>Política de Privacidade</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© {currentYear} TeeStore. Todos os direitos reservados.</p>
          <p className={styles.tech}>Feito com React + Spring Boot</p>
        </div>
      </div>
    </footer>
  );
}
