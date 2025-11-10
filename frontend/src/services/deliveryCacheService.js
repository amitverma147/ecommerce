/**
 * Caching and optimization service for delivery validation
 * Provides intelligent caching, batch requests, and performance optimizations
 */
class DeliveryCacheService {
  constructor() {
    this.caches = {
      pincodeDetails: new Map(),
      productDelivery: new Map(),
      batchRequests: new Map(),
    };

    this.config = {
      maxCacheSize: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      pincodeDetailsTTL: 60 * 60 * 1000, // 1 hour (pincodes don't change often)
      productDeliveryTTL: 15 * 60 * 1000, // 15 minutes (inventory can change)
      batchDelay: 100, // Batch requests after 100ms
      maxBatchSize: 10,
    };

    this.pendingRequests = new Map();
    this.batchTimeouts = new Map();

    // Cleanup interval to remove expired entries
    this.startCleanupInterval();
  }

  /**
   * Generate cache key
   * @param {string} type - Cache type
   * @param {object} params - Parameters to create key from
   * @returns {string} - Cache key
   */
  generateKey(type, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${type}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if cache entry is valid
   * @param {object} entry - Cache entry
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} - True if entry is still valid
   */
  isValidEntry(entry, ttl) {
    if (!entry || !entry.timestamp) return false;
    return Date.now() - entry.timestamp < ttl;
  }

  /**
   * Set cache entry
   * @param {Map} cache - Cache map
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live
   */
  setCache(cache, key, data, ttl) {
    // Remove oldest entries if cache is too large
    if (cache.size >= this.config.maxCacheSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cache entry
   * @param {Map} cache - Cache map
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live
   * @returns {any|null} - Cached data or null
   */
  getCache(cache, key, ttl) {
    const entry = cache.get(key);
    if (this.isValidEntry(entry, ttl)) {
      return entry.data;
    }

    // Remove expired entry
    if (entry) {
      cache.delete(key);
    }

    return null;
  }

  /**
   * Cache pincode details
   * @param {string} pincode - Pincode
   * @param {object} data - Pincode details data
   */
  cachePincodeDetails(pincode, data) {
    const key = this.generateKey("pincode", { pincode });
    this.setCache(
      this.caches.pincodeDetails,
      key,
      data,
      this.config.pincodeDetailsTTL
    );
  }

  /**
   * Get cached pincode details
   * @param {string} pincode - Pincode
   * @returns {object|null} - Cached data or null
   */
  getCachedPincodeDetails(pincode) {
    const key = this.generateKey("pincode", { pincode });
    return this.getCache(
      this.caches.pincodeDetails,
      key,
      this.config.pincodeDetailsTTL
    );
  }

  /**
   * Cache product delivery data
   * @param {string} productId - Product ID
   * @param {string} pincode - Pincode
   * @param {string} variantId - Variant ID (optional)
   * @param {object} data - Delivery data
   */
  cacheProductDelivery(productId, pincode, variantId, data) {
    const key = this.generateKey("product_delivery", {
      productId,
      pincode,
      variantId,
    });
    this.setCache(
      this.caches.productDelivery,
      key,
      data,
      this.config.productDeliveryTTL
    );
  }

  /**
   * Get cached product delivery data
   * @param {string} productId - Product ID
   * @param {string} pincode - Pincode
   * @param {string} variantId - Variant ID (optional)
   * @returns {object|null} - Cached data or null
   */
  getCachedProductDelivery(productId, pincode, variantId) {
    const key = this.generateKey("product_delivery", {
      productId,
      pincode,
      variantId,
    });
    return this.getCache(
      this.caches.productDelivery,
      key,
      this.config.productDeliveryTTL
    );
  }

  /**
   * Create a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }

  /**
   * Create a throttled function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Batch multiple requests together
   * @param {string} type - Request type
   * @param {object} params - Request parameters
   * @param {Function} batchProcessor - Function to process batch
   * @returns {Promise} - Promise that resolves when batch is processed
   */
  batchRequest(type, params, batchProcessor) {
    const batchKey = type;

    return new Promise((resolve, reject) => {
      // Add to pending requests
      if (!this.pendingRequests.has(batchKey)) {
        this.pendingRequests.set(batchKey, []);
      }

      this.pendingRequests.get(batchKey).push({ params, resolve, reject });

      // Clear existing timeout
      if (this.batchTimeouts.has(batchKey)) {
        clearTimeout(this.batchTimeouts.get(batchKey));
      }

      // Set new timeout to process batch
      const timeout = setTimeout(async () => {
        const requests = this.pendingRequests.get(batchKey) || [];
        this.pendingRequests.delete(batchKey);
        this.batchTimeouts.delete(batchKey);

        if (requests.length === 0) return;

        try {
          const results = await batchProcessor(requests.map((r) => r.params));

          // Resolve individual promises
          requests.forEach((request, index) => {
            if (results[index]) {
              request.resolve(results[index]);
            } else {
              request.reject(new Error("Batch request failed"));
            }
          });
        } catch (error) {
          // Reject all promises on batch failure
          requests.forEach((request) => {
            request.reject(error);
          });
        }
      }, this.config.batchDelay);

      this.batchTimeouts.set(batchKey, timeout);

      // Process immediately if batch is full
      if (
        this.pendingRequests.get(batchKey).length >= this.config.maxBatchSize
      ) {
        clearTimeout(timeout);
        setTimeout(() => this.batchTimeouts.get(batchKey), 0);
      }
    });
  }

  /**
   * Preload delivery data for multiple products and pincodes
   * @param {Array} productIds - Array of product IDs
   * @param {Array} pincodes - Array of pincodes
   * @returns {Promise} - Promise that resolves when preloading is complete
   */
  async preloadDeliveryData(productIds, pincodes) {
    const promises = [];

    // Preload pincode details
    pincodes.forEach((pincode) => {
      if (!this.getCachedPincodeDetails(pincode)) {
        // In a real implementation, you'd make the API call here
        // For now, we'll just create a placeholder
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              this.cachePincodeDetails(pincode, {
                pincode,
                city: "Unknown",
                state: "Unknown",
                deliveryAvailable: true,
                deliveryTime: "2-3 days",
                codAvailable: true,
              });
              resolve();
            }, Math.random() * 100);
          })
        );
      }
    });

    // Preload product delivery combinations
    productIds.forEach((productId) => {
      pincodes.forEach((pincode) => {
        if (!this.getCachedProductDelivery(productId, pincode, null)) {
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => {
                this.cacheProductDelivery(productId, pincode, null, {
                  is_available: Math.random() > 0.2, // 80% availability rate
                  total_stock: Math.floor(Math.random() * 100) + 1,
                  delivery_time: "1-2 days",
                  message: "Available for delivery",
                });
                resolve();
              }, Math.random() * 100);
            })
          );
        }
      });
    });

    return Promise.all(promises);
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getCacheStats() {
    return {
      pincodeDetails: {
        size: this.caches.pincodeDetails.size,
        maxSize: this.config.maxCacheSize,
      },
      productDelivery: {
        size: this.caches.productDelivery.size,
        maxSize: this.config.maxCacheSize,
      },
      pendingRequests: this.pendingRequests.size,
      config: this.config,
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.caches.pincodeDetails.clear();
    this.caches.productDelivery.clear();
    this.caches.batchRequests.clear();

    // Clear pending requests
    this.pendingRequests.clear();

    // Clear timeouts
    this.batchTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.batchTimeouts.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredEntries() {
    const now = Date.now();

    // Clear expired pincode details
    for (const [key, entry] of this.caches.pincodeDetails.entries()) {
      if (!this.isValidEntry(entry, this.config.pincodeDetailsTTL)) {
        this.caches.pincodeDetails.delete(key);
      }
    }

    // Clear expired product delivery data
    for (const [key, entry] of this.caches.productDelivery.entries()) {
      if (!this.isValidEntry(entry, this.config.productDeliveryTTL)) {
        this.caches.productDelivery.delete(key);
      }
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.clearExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Update cache configuration
   * @param {object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Export cache data for persistence
   * @returns {object} - Serializable cache data
   */
  exportCache() {
    return {
      pincodeDetails: Array.from(this.caches.pincodeDetails.entries()),
      productDelivery: Array.from(this.caches.productDelivery.entries()),
      timestamp: Date.now(),
    };
  }

  /**
   * Import cache data from persistence
   * @param {object} cacheData - Cache data to import
   */
  importCache(cacheData) {
    if (!cacheData || !cacheData.timestamp) return;

    // Only import if data is not too old (max 1 hour)
    if (Date.now() - cacheData.timestamp > 60 * 60 * 1000) return;

    if (cacheData.pincodeDetails) {
      this.caches.pincodeDetails = new Map(cacheData.pincodeDetails);
    }

    if (cacheData.productDelivery) {
      this.caches.productDelivery = new Map(cacheData.productDelivery);
    }
  }
}

// Create singleton instance
const deliveryCacheService = new DeliveryCacheService();

// Export for use in browser environment
if (typeof window !== "undefined") {
  // Save cache data before page unload
  window.addEventListener("beforeunload", () => {
    try {
      const cacheData = deliveryCacheService.exportCache();
      sessionStorage.setItem("deliveryCache", JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error saving cache data:", error);
    }
  });

  // Load cache data on page load
  try {
    const savedCache = sessionStorage.getItem("deliveryCache");
    if (savedCache) {
      const cacheData = JSON.parse(savedCache);
      deliveryCacheService.importCache(cacheData);
    }
  } catch (error) {
    console.error("Error loading cache data:", error);
  }
}

export default deliveryCacheService;

// Export utility functions
export const {
  debounce,
  throttle,
  cachePincodeDetails,
  getCachedPincodeDetails,
  cacheProductDelivery,
  getCachedProductDelivery,
  preloadDeliveryData,
  clearAllCaches,
  getCacheStats,
} = deliveryCacheService;
