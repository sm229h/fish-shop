import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const data = await api.get('/cart');
      setItems(data.items || []);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (productId, quantity) => {
    await api.post('/cart/items', { product_id: productId, quantity });
    await fetchCart();
  };

  const updateItem = async (itemId, quantity) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await api.del(`/cart/items/${itemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.del('/cart');
    setItems([]);
  };

  const count = items.reduce((s, i) => s + 1, 0);
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addItem, updateItem, removeItem, clearCart, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
