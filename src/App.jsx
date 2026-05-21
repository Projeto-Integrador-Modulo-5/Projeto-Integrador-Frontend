import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './hooks/useNotifications';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/CartDrawer/CartDrawer';
import FavoritesDrawer from './components/FavoritesDrawer/FavoritesDrawer';
import NotificationsDrawer from './components/NotificationsDrawer/NotificationsDrawer';
import NotificationToast from './components/NotificationToast/NotificationToast';
import AdminLayout from './components/AdminLayout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home           from './pages/Home/Home';
import Login          from './pages/Login/Login';
import Register       from './pages/Register/Register';
import Checkout       from './pages/Checkout/Checkout';
import Orders         from './pages/Orders/Orders';
import Profile        from './pages/Profile/Profile';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminProducts  from './pages/Admin/Products/Products';
import AdminOrders    from './pages/Admin/Orders/AdminOrders';

/** Rota raiz: admin vai direto para o painel, demais veem a loja */
function HomeRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Home />;
}

/** Lê o count de favoritos do localStorage e sincroniza via evento */
function useFavCount() {
  const [count, setCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teestore_favs') || '[]').length; }
    catch { return 0; }
  });
  useEffect(() => {
    const update = () => {
      try { setCount(JSON.parse(localStorage.getItem('teestore_favs') || '[]').length); }
      catch { setCount(0); }
    };
    window.addEventListener('teestore-favs-update', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('teestore-favs-update', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return count;
}

/** Layout da loja (Header + Footer + CartDrawer + FavoritesDrawer + NotificationsDrawer) */
function StoreLayout() {
  const { user } = useAuth();
  const [favOpen,   setFavOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { notifications, unreadCount, refresh: refreshNotifs, toastQueue, dismissToast } = useNotifications(user?.id);
  const favCount = useFavCount();

  return (
    <>
      <Header
        notificationCount={unreadCount}
        favCount={favCount}
        onNotifOpen={() => setNotifOpen(true)}
        onFavOpen={() => setFavOpen(true)}
      />
      <CartDrawer />
      <FavoritesDrawer
        open={favOpen}
        onClose={() => setFavOpen(false)}
      />
      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        realtimeNotifs={notifications}
        onMarkedRead={refreshNotifs}
      />
      {/* Pop-up toast — aparece no canto inferior direito ao receber mensagem Kafka via WebSocket */}
      <NotificationToast notifications={toastQueue} onDismiss={dismissToast} />
      <Routes>
        <Route path="/"         element={<HomeRoute />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders"   element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

/** Layout admin — sidebar AdminLayout, sem Header/Footer da loja */
function AdminArea() {
  return (
    <AdminLayout>
      <Routes>
        <Route index            element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products"  element={<AdminProducts />} />
        <Route path="orders"    element={<AdminOrders />} />
        <Route path="*"         element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Rotas admin — sem header/footer da loja */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <AdminArea />
                </ProtectedRoute>
              }
            />
            {/* Rotas da loja */}
            <Route path="/*" element={<StoreLayout />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
