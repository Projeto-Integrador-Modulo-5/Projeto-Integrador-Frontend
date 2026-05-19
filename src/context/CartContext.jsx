import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCartApi, addToCartApi, updateCartItemApi, removeCartItemApi, clearCartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart]           = useState({ items: [], total: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart({ items: [], total: 0 }); return; }
    setCartLoading(true);
    try {
      const { data } = await getCartApi();
      setCart(data);
    } catch {
      setCart({ items: [], total: 0 });
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (item) => {
    const { data } = await addToCartApi(item);
    setCart(data);
    setDrawerOpen(true);
  };

  const updateItem = async (productId, sizeData) => {
    const { data } = await updateCartItemApi(productId, sizeData);
    setCart(data);
  };

  const removeItem = async (productId, size) => {
    const { data } = await removeCartItemApi(productId, size);
    setCart(data);
  };

  const clearCart = async () => {
    await clearCartApi();
    setCart({ items: [], total: 0 });
  };

  const itemCount = cart.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        drawerOpen,
        setDrawerOpen,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        fetchCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
