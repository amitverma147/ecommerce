const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://big-best-backend.vercel.app/api';

console.log('COD API Base URL:', API_BASE_URL);

export const codOrdersApi = {
  // Create COD order
  createCodOrder: async (orderData) => {
    try {
      console.log('Creating COD order with data:', orderData);
      
      const response = await fetch(`${API_BASE_URL}/cod-orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      console.log('COD API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('COD API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('COD Order created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating COD order:', error);
      return {
        success: false,
        error: error.message || 'Failed to create COD order'
      };
    }
  },

  // Get user's COD orders
  getUserCodOrders: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cod-orders/user/${userId}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching user COD orders:', error);
      throw error;
    }
  },

  // Get all COD orders (Admin)
  getAllCodOrders: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cod-orders/all?page=${page}&limit=${limit}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching all COD orders:', error);
      throw error;
    }
  },

  // Update COD order status
  updateCodOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cod-orders/status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating COD order status:', error);
      throw error;
    }
  }
};