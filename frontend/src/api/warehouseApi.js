/**
 * Warehouse API Utilities
 * Handles all warehouse-related API calls with proper error handling
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class WarehouseAPI {
  constructor() {
    this.baseURL = `${BASE_URL}/api/warehouse`;
  }

  // Helper method for making API calls
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Warehouse CRUD Operations
  async getWarehouses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(url);
  }

  async getWarehouseById(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/${id}${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(url);
  }

  async createWarehouse(warehouseData) {
    return this.makeRequest(this.baseURL, {
      method: "POST",
      body: JSON.stringify(warehouseData),
    });
  }

  async updateWarehouse(id, warehouseData) {
    return this.makeRequest(`${this.baseURL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(warehouseData),
    });
  }

  async deleteWarehouse(id) {
    return this.makeRequest(`${this.baseURL}/${id}`, {
      method: "DELETE",
    });
  }

  // Stock Management Operations
  async getProductStock(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/stock${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(url);
  }

  async setProductStock(stockData) {
    return this.makeRequest(`${this.baseURL}/stock/set`, {
      method: "POST",
      body: JSON.stringify(stockData),
    });
  }

  async updateProductStock(stockMovement) {
    return this.makeRequest(`${this.baseURL}/stock`, {
      method: "PUT",
      body: JSON.stringify(stockMovement),
    });
  }

  async getStockMovements(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/movements${
      queryString ? `?${queryString}` : ""
    }`;
    return this.makeRequest(url);
  }

  // Product-Warehouse Assignment
  async assignProductToWarehouses(productId, assignments) {
    return this.makeRequest(`${this.baseURL}/products/${productId}/assign`, {
      method: "POST",
      body: JSON.stringify({ warehouse_assignments: assignments }),
    });
  }

  async getProductWarehouseAssignments(productId) {
    return this.makeRequest(
      `${this.baseURL}/products/${productId}/assignments`
    );
  }

  // Delivery Validation
  async checkProductDelivery(productId, pincode, quantity = 1) {
    return this.makeRequest(`${this.baseURL}/products/check-delivery`, {
      method: "POST",
      body: JSON.stringify({ product_id: productId, pincode, quantity }),
    });
  }

  async validateCartDelivery(userId, pincode) {
    return this.makeRequest(`${this.baseURL}/cart/validate-delivery`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, pincode }),
    });
  }

  async reserveCartStock(userId, pincode, orderId) {
    return this.makeRequest(`${this.baseURL}/cart/reserve-stock`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, pincode, order_id: orderId }),
    });
  }

  async confirmStockDeduction(orderId, warehouseAssignments) {
    return this.makeRequest(`${this.baseURL}/cart/confirm-deduction`, {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        warehouse_assignments: warehouseAssignments,
      }),
    });
  }

  // Dashboard and Reporting
  async getWarehouseDashboard(warehouseId = null) {
    const url = warehouseId
      ? `${this.baseURL}/dashboard?warehouse_id=${warehouseId}`
      : `${this.baseURL}/dashboard`;
    return this.makeRequest(url);
  }

  async getProductsWithWarehouseStock(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/products/warehouse-stock${
      queryString ? `?${queryString}` : ""
    }`;
    return this.makeRequest(url);
  }
}

// Create singleton instance
const warehouseAPI = new WarehouseAPI();

export default warehouseAPI;

// Named exports for specific functions
export const {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getProductStock,
  setProductStock,
  updateProductStock,
  checkProductDelivery,
  validateCartDelivery,
  reserveCartStock,
  confirmStockDeduction,
  getWarehouseDashboard,
} = warehouseAPI;
