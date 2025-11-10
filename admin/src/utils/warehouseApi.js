/**
 * Warehouse API Utilities for Admin Panel
 * Handles all warehouse-related API calls
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Fetch all warehouses
export const fetchWarehouses = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/warehouses${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouses: data.data || [],
      total: data.count || 0,
    };
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return {
      success: false,
      error: error.message,
      warehouses: [],
    };
  }
};

// Fetch warehouse by ID
export const fetchWarehouseById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouse: data.data,
    };
  } catch (error) {
    console.error("Failed to fetch warehouse:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Create new warehouse
export const createWarehouse = async (warehouseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(warehouseData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouse: data.data,
    };
  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update warehouse
export const updateWarehouse = async (id, warehouseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(warehouseData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouse: data.data,
    };
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete warehouse
export const deleteWarehouse = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fetch warehouses by type (central/zonal)
export const fetchWarehousesByType = async (type) => {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses?type=${type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouses: data.warehouses || [],
    };
  } catch (error) {
    console.error("Failed to fetch warehouses by type:", error);
    return {
      success: false,
      error: error.message,
      warehouses: [],
    };
  }
};

// Map product to warehouses
export const mapProductToWarehouses = async (productId, warehouseIds) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/warehouses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ warehouse_ids: warehouseIds }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Failed to map product to warehouses:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get product warehouse mappings
export const getProductWarehouseMappings = async (productId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/warehouses`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      warehouses: data.warehouses || [],
    };
  } catch (error) {
    console.error("Failed to get product warehouse mappings:", error);
    return {
      success: false,
      error: error.message,
      warehouses: [],
    };
  }
};

// Distribute product to zonal warehouses
export const distributeProductToZones = async (productId, distributionData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product-warehouse/products/${productId}/distribute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(distributionData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      distributions: data.data || [],
      message: data.message,
    };
  } catch (error) {
    console.error("Failed to distribute product to zones:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get comprehensive stock summary for a product
export const getProductStockSummary = async (productId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product-warehouse/products/${productId}/stock-summary`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      summary: data.data,
    };
  } catch (error) {
    console.error("Failed to get product stock summary:", error);
    return {
      success: false,
      error: error.message,
      summary: null,
    };
  }
};

// Create product with enhanced warehouse management
export const createProductWithWarehouse = async (productData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product-warehouse/products/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      product: data.data.product,
      warehouse_assignments: data.data.warehouse_assignments,
      auto_distributed: data.data.auto_distributed,
      message: data.message,
    };
  } catch (error) {
    console.error("Failed to create product with warehouse:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
