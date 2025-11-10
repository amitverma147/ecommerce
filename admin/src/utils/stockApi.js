import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Update product stock quantity
 * @param {string} productId - Product ID
 * @param {number} stockQuantity - New stock quantity
 * @param {boolean} updateInStock - Whether to auto-update in_stock status
 * @returns {Promise<{success: boolean, product?: object, error?: string}>}
 */
export const updateProductStock = async (productId, stockQuantity, updateInStock = true) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/stock/${productId}`, {
      stock_quantity: stockQuantity,
      update_in_stock: updateInStock
    });

    return {
      success: true,
      product: response.data.product,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error updating product stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update stock'
    };
  }
};

/**
 * Get product stock information
 * @param {string} productId - Product ID
 * @returns {Promise<{success: boolean, product?: object, error?: string}>}
 */
export const getProductStock = async (productId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stock/${productId}`);

    return {
      success: true,
      product: response.data.product
    };
  } catch (error) {
    console.error('Error fetching product stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch stock'
    };
  }
};

/**
 * Bulk update stock for multiple products
 * @param {Array} updates - Array of {productId, stock_quantity} objects
 * @returns {Promise<{success: boolean, results?: Array, errors?: Array, summary?: object, error?: string}>}
 */
export const bulkUpdateStock = async (updates) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/stock/bulk-update`, {
      updates
    });

    return {
      success: true,
      results: response.data.results,
      errors: response.data.errors,
      summary: response.data.summary,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to bulk update stock'
    };
  }
};

/**
 * Reduce stock quantity (for order processing)
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to reduce
 * @param {string} orderId - Order ID for tracking
 * @returns {Promise<{success: boolean, product?: object, reduction?: object, error?: string}>}
 */
export const reduceStock = async (productId, quantity, orderId = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/stock/${productId}/reduce`, {
      quantity,
      orderId
    });

    return {
      success: true,
      product: response.data.product,
      reduction: response.data.reduction,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error reducing stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to reduce stock'
    };
  }
};