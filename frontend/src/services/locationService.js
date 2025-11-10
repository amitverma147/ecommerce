import {
  getCurrentLocation,
  pincodeToLocation,
  getPincodeDetails,
} from "./deliveryApi";

/**
 * Service for managing user location and pincode detection
 */
class LocationService {
  constructor() {
    this.storageKeys = {
      userPincode: "userPincode",
      userLocation: "userLocation",
      addressHistory: "addressHistory",
      locationPermission: "locationPermission",
    };
  }

  /**
   * Get saved user pincode from localStorage
   * @returns {string|null} - Saved pincode or null
   */
  getSavedPincode() {
    try {
      return localStorage.getItem(this.storageKeys.userPincode);
    } catch (error) {
      console.error("Error getting saved pincode:", error);
      return null;
    }
  }

  /**
   * Save pincode to localStorage
   * @param {string} pincode - Pincode to save
   */
  savePincode(pincode) {
    try {
      if (this.isValidPincode(pincode)) {
        localStorage.setItem(this.storageKeys.userPincode, pincode);
        this.saveToAddressHistory({ pincode, timestamp: Date.now() });
      }
    } catch (error) {
      console.error("Error saving pincode:", error);
    }
  }

  /**
   * Get saved user location from localStorage
   * @returns {object|null} - Saved location or null
   */
  getSavedLocation() {
    try {
      const saved = localStorage.getItem(this.storageKeys.userLocation);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error getting saved location:", error);
      return null;
    }
  }

  /**
   * Save location to localStorage
   * @param {object} location - Location data with latitude, longitude, etc.
   */
  saveLocation(location) {
    try {
      localStorage.setItem(
        this.storageKeys.userLocation,
        JSON.stringify({
          ...location,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error saving location:", error);
    }
  }

  /**
   * Get address history from localStorage
   * @returns {Array} - Array of previously used addresses
   */
  getAddressHistory() {
    try {
      const history = localStorage.getItem(this.storageKeys.addressHistory);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error getting address history:", error);
      return [];
    }
  }

  /**
   * Save address to history
   * @param {object} addressData - Address data to save
   */
  saveToAddressHistory(addressData) {
    try {
      const history = this.getAddressHistory();
      const newEntry = { ...addressData, timestamp: Date.now() };

      // Remove duplicates and keep only last 10 entries
      const filteredHistory = history
        .filter((item) => item.pincode !== addressData.pincode)
        .slice(0, 9);

      const updatedHistory = [newEntry, ...filteredHistory];
      localStorage.setItem(
        this.storageKeys.addressHistory,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error saving to address history:", error);
    }
  }

  /**
   * Check if location permission has been granted
   * @returns {string} - 'granted', 'denied', 'prompt', or 'unknown'
   */
  getLocationPermissionStatus() {
    try {
      return (
        localStorage.getItem(this.storageKeys.locationPermission) || "unknown"
      );
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Save location permission status
   * @param {string} status - Permission status
   */
  saveLocationPermissionStatus(status) {
    try {
      localStorage.setItem(this.storageKeys.locationPermission, status);
    } catch (error) {
      console.error("Error saving location permission status:", error);
    }
  }

  /**
   * Validate Indian pincode format
   * @param {string} pincode - Pincode to validate
   * @returns {boolean} - True if valid
   */
  isValidPincode(pincode) {
    return /^[1-9][0-9]{5}$/.test(pincode);
  }

  /**
   * Attempt to get user's current location with permission handling
   * @returns {Promise<object>} - Location data or error
   */
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      timeout: 10000,
      enableHighAccuracy: false,
      maximumAge: 600000, // 10 minutes
      ...options,
    };

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      // Check saved permission status
      const savedPermission = this.getLocationPermissionStatus();
      if (savedPermission === "denied") {
        throw new Error("Location access was previously denied");
      }

      const location = await getCurrentLocation();

      if (location.success) {
        this.saveLocation(location.data);
        this.saveLocationPermissionStatus("granted");
        return location;
      } else {
        this.saveLocationPermissionStatus("denied");
        throw new Error(location.error || "Failed to get location");
      }
    } catch (error) {
      this.saveLocationPermissionStatus("denied");
      console.error("Location detection error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Auto-detect pincode using various methods
   * @returns {Promise<object>} - Pincode detection result
   */
  async autoDetectPincode() {
    const result = {
      success: false,
      pincode: null,
      method: null,
      error: null,
    };

    try {
      // Method 1: Check saved pincode first
      const savedPincode = this.getSavedPincode();
      if (savedPincode && this.isValidPincode(savedPincode)) {
        return {
          success: true,
          pincode: savedPincode,
          method: "localStorage",
          error: null,
        };
      }

      // Method 2: Try to get from current location
      const location = await this.getCurrentLocation();
      if (location.success) {
        // In a real implementation, you would use a reverse geocoding service
        // For now, we'll return the location data and let the user enter pincode
        return {
          success: false,
          pincode: null,
          method: "geolocation",
          error:
            "Location detected but pincode extraction requires geocoding service",
          locationData: location.data,
        };
      }

      // Method 3: Check address history for recent pincodes
      const history = this.getAddressHistory();
      if (history.length > 0) {
        const recentPincode = history[0].pincode;
        if (this.isValidPincode(recentPincode)) {
          return {
            success: true,
            pincode: recentPincode,
            method: "addressHistory",
            error: null,
          };
        }
      }

      return {
        success: false,
        pincode: null,
        method: null,
        error: "Could not auto-detect pincode. Please enter manually.",
      };
    } catch (error) {
      console.error("Auto-detect pincode error:", error);
      return {
        success: false,
        pincode: null,
        method: null,
        error: error.message,
      };
    }
  }

  /**
   * Extract pincode from address string
   * @param {string} addressString - Address containing pincode
   * @returns {string|null} - Extracted pincode or null
   */
  extractPincodeFromAddress(addressString) {
    if (!addressString) return null;

    const pincodeMatch = addressString.match(/\b\d{6}\b/g);
    if (pincodeMatch) {
      // Return the last 6-digit number found (most likely to be pincode)
      const lastMatch = pincodeMatch[pincodeMatch.length - 1];
      return this.isValidPincode(lastMatch) ? lastMatch : null;
    }

    return null;
  }

  /**
   * Get user's preferred pincodes based on usage history
   * @returns {Array} - Array of preferred pincodes with usage count
   */
  getPreferredPincodes() {
    try {
      const history = this.getAddressHistory();
      const pincodeCount = {};

      history.forEach((item) => {
        if (item.pincode && this.isValidPincode(item.pincode)) {
          pincodeCount[item.pincode] = (pincodeCount[item.pincode] || 0) + 1;
        }
      });

      return Object.entries(pincodeCount)
        .map(([pincode, count]) => ({ pincode, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Return top 5 most used pincodes
    } catch (error) {
      console.error("Error getting preferred pincodes:", error);
      return [];
    }
  }

  /**
   * Clear all saved location data
   */
  clearLocationData() {
    try {
      Object.values(this.storageKeys).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing location data:", error);
    }
  }

  /**
   * Check if cached location data is still valid
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   * @returns {boolean} - True if data is still valid
   */
  isCachedLocationValid(maxAge = 3600000) {
    // 1 hour default
    const saved = this.getSavedLocation();
    if (!saved || !saved.timestamp) return false;

    return Date.now() - saved.timestamp < maxAge;
  }

  /**
   * Get location suggestions for autocomplete
   * @param {string} query - Partial pincode or city name
   * @returns {Array} - Array of location suggestions
   */
  getLocationSuggestions(query) {
    const history = this.getAddressHistory();
    const suggestions = [];

    history.forEach((item) => {
      if (item.pincode && item.pincode.includes(query)) {
        suggestions.push({
          pincode: item.pincode,
          type: "pincode",
          source: "history",
        });
      }
      if (item.city && item.city.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          city: item.city,
          pincode: item.pincode,
          type: "city",
          source: "history",
        });
      }
    });

    // Remove duplicates and return top 5
    return suggestions
      .filter(
        (item, index, self) =>
          index === self.findIndex((s) => s.pincode === item.pincode)
      )
      .slice(0, 5);
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;

// Export individual functions for convenience
export const {
  getSavedPincode,
  savePincode,
  getSavedLocation,
  saveLocation,
  getAddressHistory,
  saveToAddressHistory,
  getCurrentLocation: detectCurrentLocation,
  autoDetectPincode,
  extractPincodeFromAddress,
  getPreferredPincodes,
  clearLocationData,
  isCachedLocationValid,
  getLocationSuggestions,
  isValidPincode,
} = locationService;
