import { createContext, useState, useEffect, useContext } from 'react';
import { cartAPI } from '../services/api';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('userToken');
    // Don't attempt to load cart if not logged in
    if (!token) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data?.data || response.data || null);
      setError(null);
    } catch (err) {
      // 401/403 = not logged in — not an error state for UI
      if (err.response?.status === 401 || err.response?.status === 403) {
        setCart(null);
      } else {
        console.error('Error loading cart:', err);
        setError('Failed to load cart');
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (variantId, quantity = 1) => {
    const token = localStorage.getItem('userToken');
    if (!token) return { success: false, message: 'Please log in to add items to cart' };

    try {
      const response = await cartAPI.addItem({ variantId, quantity });
      setCart(response.data?.data || response.data);
      setError(null);
      return { success: true, data: response.data?.data || response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add item to cart';
      setError(message);
      return { success: false, message };
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const response = await cartAPI.updateItem(itemId, quantity);
      setCart(response.data?.data || response.data);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update item');
      return { success: false };
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await loadCart();
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
      return { success: false };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      setCart(null);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
      return { success: false };
    }
  };

  const getTotalItems = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getTotalAmount = () => cart?.totalAmount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
        loadCart,
        getTotalItems,
        getTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
