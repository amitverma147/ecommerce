// Zone Management API Functions
import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL ||
    (window.location.origin.includes("localhost")
      ? "http://localhost:8080"
      : "/api");

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
});

/**
 * Fetch all zones with pagination and filters
 */
export const fetchZones = async (params = {}) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase configuration not found, returning empty zones list"
      );
      return {
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: params.limit || 50,
          totalPages: 0,
        },
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from("delivery_zones").select(
      `
        id,
        name,
        is_active,
        is_nationwide,
        created_at,
        zone_pincodes (
          id,
          pincode,
          city,
          state
        )
      `,
      { count: "exact" }
    );

    // Apply filters
    if (params.is_active !== undefined) {
      query = query.eq("is_active", params.is_active);
    }

    if (params.is_nationwide !== undefined) {
      query = query.eq("is_nationwide", params.is_nationwide);
    }

    // Apply sorting
    query = query.order("name", { ascending: true });

    // Apply pagination if provided
    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 50) - 1
      );
    }

    const { data: zones, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Format the response to match the expected structure
    const formattedZones =
      zones?.map((zone) => {
        const activePincodes =
          zone.zone_pincodes?.filter((pincode) => pincode.is_active) || [];
        return {
          ...zone,
          pincodes_count: activePincodes.length,
          pincodes: activePincodes,
        };
      }) || [];

    return {
      success: true,
      data: formattedZones,
      pagination: {
        total: count || 0,
        page: Math.floor((params.offset || 0) / (params.limit || 50)) + 1,
        limit: params.limit || 50,
        totalPages: Math.ceil((count || 0) / (params.limit || 50)),
      },
    };
  } catch (error) {
    console.error("Fetch zones error:", error);
    throw new Error(error.message || "Failed to fetch zones");
  }
};

/**
 * Fetch zone by ID with pincodes
 */
export const fetchZoneById = async (zoneId) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase configuration not found");
      throw new Error("Zone not found");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: zone, error: zoneError } = await supabase
      .from("delivery_zones")
      .select(
        `
        id,
        name,
        is_active,
        is_nationwide,
        created_at,
        updated_at,
        zone_pincodes (
          id,
          pincode,
          city,
          state,
          is_active
        )
      `
      )
      .eq("id", zoneId)
      .single();

    if (zoneError) {
      throw new Error(zoneError.message);
    }

    if (!zone) {
      throw new Error("Zone not found");
    }

    // Get warehouse assignments for this zone
    const { data: warehouseZones, error: warehouseError } = await supabase
      .from("warehouse_zones")
      .select(
        `
        warehouse_id,
        priority,
        is_active,
        warehouses (
          id,
          name,
          type,
          location
        )
      `
      )
      .eq("zone_id", zoneId)
      .eq("is_active", true);

    if (warehouseError) {
      throw new Error(warehouseError.message);
    }

    // Format the response
    const activePincodes =
      zone.zone_pincodes?.filter((pincode) => pincode.is_active) || [];
    const zoneDetails = {
      ...zone,
      pincodes: activePincodes,
      pincodes_count: activePincodes.length,
      assigned_warehouses: warehouseZones || [],
      warehouses_count: warehouseZones?.length || 0,
    };

    return { success: true, data: zoneDetails };
  } catch (error) {
    console.error("Fetch zone by ID error:", error);
    throw new Error(error.message || "Failed to fetch zone details");
  }
};

/**
 * Create new zone
 */
export const createZone = async (zoneData) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase configuration not found");
      throw new Error("Failed to create zone");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: zone, error } = await supabase
      .from("delivery_zones")
      .insert([
        {
          name: zoneData.name,
          is_active:
            zoneData.is_active !== undefined ? zoneData.is_active : true,
          is_nationwide: zoneData.is_nationwide || false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: zone };
  } catch (error) {
    console.error("Create zone error:", error);
    throw new Error(error.message || "Failed to create zone");
  }
};

/**
 * Update zone
 */
export const updateZone = async (zoneId, zoneData) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase configuration not found");
      throw new Error("Failed to update zone");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: zone, error } = await supabase
      .from("delivery_zones")
      .update({
        name: zoneData.name,
        is_active: zoneData.is_active,
        is_nationwide: zoneData.is_nationwide,
        updated_at: new Date().toISOString(),
      })
      .eq("id", zoneId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: zone };
  } catch (error) {
    console.error("Update zone error:", error);
    throw new Error(error.message || "Failed to update zone");
  }
};

/**
 * Delete zone
 */
export const deleteZone = async (zoneId) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase configuration not found");
      throw new Error("Failed to delete zone");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", zoneId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Zone deleted successfully" };
  } catch (error) {
    console.error("Delete zone error:", error);
    throw new Error(error.message || "Failed to delete zone");
  }
};

/**
 * Upload Excel file with zones and pincodes
 */
export const uploadZoneExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("csv_file", file);

    const response = await api.post("/zones/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload Excel error:", error);
    throw new Error(
      error.response?.data?.error || "Failed to upload Excel file"
    );
  }
};

/**
 * Validate pincode for delivery
 */
export const validatePincode = async (pincode) => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase configuration not found");
      return {
        success: true,
        data: {
          is_valid: false,
          message: "Service unavailable",
          pincode: pincode,
          zone: null,
        },
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if pincode exists in zone_pincodes
    const { data: pincodeData, error: pincodeError } = await supabase
      .from("zone_pincodes")
      .select(
        `
        id,
        pincode,
        city,
        state,
        is_active,
        delivery_zones (
          id,
          name,
          is_active,
          is_nationwide
        )
      `
      )
      .eq("pincode", pincode)
      .eq("is_active", true)
      .single();

    if (pincodeError && pincodeError.code !== "PGRST116") {
      // PGRST116 is "not found"
      throw new Error(pincodeError.message);
    }

    if (!pincodeData) {
      return {
        success: true,
        data: {
          is_valid: false,
          message: "Pincode not found in any delivery zone",
          pincode: pincode,
          zone: null,
        },
      };
    }

    // Check if the zone is active
    if (!pincodeData.delivery_zones?.is_active) {
      return {
        success: true,
        data: {
          is_valid: false,
          message: "Delivery zone is currently inactive",
          pincode: pincode,
          zone: pincodeData.delivery_zones,
        },
      };
    }

    return {
      success: true,
      data: {
        is_valid: true,
        message: "Pincode is valid for delivery",
        pincode: pincode,
        zone: pincodeData.delivery_zones,
      },
    };
  } catch (error) {
    console.error("Validate pincode error:", error);
    throw new Error(error.message || "Failed to validate pincode");
  }
};

/**
 * Get zone statistics
 */
export const getZoneStatistics = async () => {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase configuration not found, returning default statistics"
      );
      return {
        success: true,
        statistics: {
          totalZones: 0,
          activeZones: 0,
          nationwideZones: 0,
          totalPincodes: 0,
        },
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get total zones count
    const { count: totalZones, error: zonesError } = await supabase
      .from("delivery_zones")
      .select("*", { count: "exact", head: true });

    if (zonesError) {
      throw new Error(zonesError.message);
    }

    // Get active zones count
    const { count: activeZones, error: activeError } = await supabase
      .from("delivery_zones")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) {
      throw new Error(activeError.message);
    }

    // Get nationwide zones count
    const { count: nationwideZones, error: nationwideError } = await supabase
      .from("delivery_zones")
      .select("*", { count: "exact", head: true })
      .eq("is_nationwide", true);

    if (nationwideError) {
      throw new Error(nationwideError.message);
    }

    // Get total pincodes count
    const { count: totalPincodes, error: pincodesError } = await supabase
      .from("zone_pincodes")
      .select("*", { count: "exact", head: true });

    if (pincodesError) {
      throw new Error(pincodesError.message);
    }

    return {
      success: true,
      statistics: {
        totalZones: totalZones || 0,
        activeZones: activeZones || 0,
        nationwideZones: nationwideZones || 0,
        totalPincodes: totalPincodes || 0,
      },
    };
  } catch (error) {
    console.error("Get zone statistics error:", error);
    throw new Error(error.message || "Failed to fetch statistics");
  }
};

/**
 * Check delivery availability for multiple products
 */
export const checkProductsDelivery = async (productIds, pincode) => {
  try {
    const response = await api.post("/productsroute/check-delivery", {
      product_ids: productIds,
      pincode,
    });
    return response.data;
  } catch (error) {
    console.error("Check products delivery error:", error);
    throw new Error(
      error.response?.data?.error || "Failed to check delivery availability"
    );
  }
};

/**
 * Update product delivery settings
 */
export const updateProductDelivery = async (productId, deliveryData) => {
  try {
    const response = await api.put(
      `/api/productsroute/${productId}/delivery`,
      deliveryData
    );
    return response.data;
  } catch (error) {
    console.error("Update product delivery error:", error);
    throw new Error(
      error.response?.data?.error ||
        "Failed to update product delivery settings"
    );
  }
};

/**
 * Get products by delivery zone/pincode
 */
export const getProductsByDeliveryZone = async (params = {}) => {
  try {
    const response = await api.get("/productsroute/delivery-zone", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Get products by delivery zone error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch products");
  }
};

/**
 * Get product with delivery information
 */
export const getProductWithDelivery = async (productId, pincode) => {
  try {
    const params = pincode ? { pincode } : {};
    const response = await api.get(`/productsroute/${productId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Get product with delivery error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch product");
  }
};

export default {
  fetchZones,
  fetchZoneById,
  createZone,
  updateZone,
  deleteZone,
  uploadZoneExcel,
  validatePincode,
  getZoneStatistics,
  checkProductsDelivery,
  updateProductDelivery,
  getProductsByDeliveryZone,
  getProductWithDelivery,
};
