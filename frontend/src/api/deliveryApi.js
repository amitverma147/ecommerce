import { safeFetch, getApiBaseUrl } from "./apiUtils.js";
import deliveryCacheService from "../services/deliveryCacheService.js";

const API_BASE_URL = getApiBaseUrl();

/**
 * Check if a product is deliverable to a specific pincode
 * @param {string} productId - Product ID to check
 * @param {string} pincode - Pincode to check delivery for
 * @param {string} variantId - Optional variant ID
 * @returns {Promise<object>} - Delivery availability data
 */
export const checkProductDelivery = async (
  productId,
  pincode,
  variantId = null
) => {
  try {
    // Check cache first
    const cached = deliveryCacheService.getCachedProductDelivery(
      productId,
      pincode,
      variantId
    );
    if (cached) {
      return { success: true, data: cached };
    }

    let url = `${API_BASE_URL}/inventory/pincode/${pincode}/product/${productId}/availability`;

    if (variantId) {
      url += `?variantId=${variantId}`;
    }

    const response = await safeFetch(url, {
      method: "GET",
    });

    // Cache successful responses
    if (response.success && response.data) {
      deliveryCacheService.cacheProductDelivery(
        productId,
        pincode,
        variantId,
        response.data
      );
    }

    return response;
  } catch (error) {
    console.error("Error checking product delivery:", error);
    return {
      success: false,
      error: "Failed to check delivery availability",
    };
  }
};

/**
 * Get pincode details and general delivery availability
 * @param {string} pincode - Pincode to get details for
 * @returns {Promise<object>} - Pincode details and delivery info
 */
export const getPincodeDetails = async (pincode) => {
  try {
    // Check cache first
    const cached = deliveryCacheService.getCachedPincodeDetails(pincode);
    if (cached) {
      return { success: true, data: cached };
    }

    const response = await safeFetch(
      `${API_BASE_URL}/location/pincode/${pincode}`,
      {
        method: "GET",
      }
    );

    // Cache successful responses
    if (response.success && response.data) {
      deliveryCacheService.cachePincodeDetails(pincode, response.data);
    }

    return response;
  } catch (error) {
    console.error("Error getting pincode details:", error);
    return {
      success: false,
      error: "Failed to get pincode details",
    };
  }
};

/**
 * Get all products available in a specific pincode
 * @param {string} pincode - Pincode to check
 * @param {object} options - Additional options (category, limit)
 * @returns {Promise<object>} - Available products data
 */
export const getProductsByPincode = async (pincode, options = {}) => {
  try {
    let url = `${API_BASE_URL}/inventory/pincode/${pincode}/products`;

    const queryParams = new URLSearchParams();
    if (options.category) queryParams.append("category", options.category);
    if (options.limit) queryParams.append("limit", options.limit.toString());

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await safeFetch(url, {
      method: "GET",
    });

    return response;
  } catch (error) {
    console.error("Error getting products by pincode:", error);
    return {
      success: false,
      error: "Failed to get products for this pincode",
    };
  }
};

/**
 * Calculate shipping charges for a pincode
 * @param {string} pincode - Delivery pincode
 * @param {number} weight - Package weight
 * @param {number} orderValue - Order value
 * @returns {Promise<object>} - Shipping calculation data
 */
export const calculateShipping = async (
  pincode,
  weight = 1,
  orderValue = 0
) => {
  try {
    const response = await safeFetch(
      `${API_BASE_URL}/location/shipping/calculate`,
      {
        method: "POST",
        body: JSON.stringify({
          pincode,
          weight,
          orderValue,
        }),
      }
    );

    return response;
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return {
      success: false,
      error: "Failed to calculate shipping charges",
    };
  }
};

/**
 * Validate delivery for multiple cart items
 * @param {Array} items - Cart items to validate
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @returns {Promise<object>} - Delivery validation results
 */
export const checkCartDeliveryAvailability = async (
  items,
  latitude,
  longitude
) => {
  try {
    const response = await safeFetch(
      `${API_BASE_URL}/cart/check-availability`,
      {
        method: "POST",
        body: JSON.stringify({
          items,
          latitude,
          longitude,
        }),
      }
    );

    return response;
  } catch (error) {
    console.error("Error checking cart delivery availability:", error);
    return {
      success: false,
      error: "Failed to check cart delivery availability",
    };
  }
};

/**
 * Get user's current location using browser geolocation
 * @returns {Promise<object>} - Location data with latitude and longitude
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
        enableHighAccuracy: false,
      }
    );
  });
};

/**
 * Convert pincode to approximate location (this would need a real geocoding service)
 * For now, returns a mock implementation
 * @param {string} pincode - Pincode to convert
 * @returns {Promise<object>} - Location data
 */
export const pincodeToLocation = async (pincode) => {
  try {
    // This is a mock implementation. In a real app, you'd use a geocoding service
    // like Google Maps Geocoding API, or store pincode coordinates in your database
    const response = await getPincodeDetails(pincode);

    if (response.success) {
      return {
        success: true,
        data: {
          latitude: 28.6139, // Mock Delhi coordinates
          longitude: 77.209,
          city: response.data.city,
          state: response.data.state,
        },
      };
    }

    return response;
  } catch (error) {
    console.error("Error converting pincode to location:", error);
    return {
      success: false,
      error: "Failed to get location for pincode",
    };
  }
};

export default {
  checkProductDelivery,
  getPincodeDetails,
  getProductsByPincode,
  calculateShipping,
  checkCartDeliveryAvailability,
  getCurrentLocation,
  pincodeToLocation,
};
