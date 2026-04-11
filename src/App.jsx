import { useState, useCallback } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import { useNotifications } from './hooks/useNotifications';

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  // userId do usuário autenticado (futuramente: contexto de Auth)
  const userId = localStorage.getItem('userId') || null;
  const { notifications } = useNotifications(userId);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCartUpdate = useCallback(() => {
    setCartCount((prev) => prev + 1);
  }, []);

  return (
    <>
      <Header
        notificationCount={unreadCount}
        cartCount={cartCount}
      />
      <Home onCartUpdate={handleCartUpdate} />
      <Footer />
    </>
  );
}
