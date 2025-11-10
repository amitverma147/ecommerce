const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://big-best-backend.vercel.app/api';

export const enhancedCartApi = {
  // Get user's cart from DB
  getUserCart: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      return await response.json();
    } catch (error) {
      console.error('Get cart error:', error);
      return { success: false, error: error.message };
    }
  },

  // Add item to DB cart with stock decrease
  addToCart: async (userId, cartItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          ...cartItem,
          decrease_stock: true // Flag to decrease stock
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }
      return await response.json();
    } catch (error) {
      console.error('Add to cart error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reserve stock temporarily (for immediate UI feedback)
  reserveStock: async (productId, quantity, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: userId,
          action: 'add_to_cart'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stock not available');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Stock reservation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update cart item quantity
  updateCartItem: async (userId, productId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: productId, quantity })
      });
      if (!response.ok) throw new Error('Failed to update cart');
      return await response.json();
    } catch (error) {
      console.error('Update cart error:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove item from cart with stock increase
  removeFromCart: async (userId, productId, quantity = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          product_id: productId,
          quantity: quantity,
          increase_stock: true // Flag to increase stock back
        })
      });
      if (!response.ok) throw new Error('Failed to remove from cart');
      return await response.json();
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { success: false, error: error.message };
    }
  },

  // Release reserved stock
  releaseStock: async (productId, quantity, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: userId,
          action: 'remove_from_cart'
        })
      });
      
      if (!response.ok) throw new Error('Failed to release stock');
      return await response.json();
    } catch (error) {
      console.error('Stock release error:', error);
      return { success: false, error: error.message };
    }
  },

  // Validate cart prices with latest DB data
  validateCartPrices: async (cartItems) => {
    try {
      const productIds = cartItems.map(item => item.productId || item.id);
      const response = await fetch(`${API_BASE_URL}/products/validate-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: productIds })
      });
      if (!response.ok) throw new Error('Failed to validate prices');
      return await response.json();
    } catch (error) {
      console.error('Price validation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get latest product data for cart
  getProductsForCart: async (productIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/cart-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: productIds })
      });
      if (!response.ok) throw new Error('Failed to fetch product data');
      return await response.json();
    } catch (error) {
      console.error('Product data fetch error:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear user cart
  clearCart: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/clear/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      return await response.json();
    } catch (error) {
      console.error('Clear cart error:', error);
      return { success: false, error: error.message };
    }
  }
};