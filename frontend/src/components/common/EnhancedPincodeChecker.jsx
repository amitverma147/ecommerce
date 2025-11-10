"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  History,
} from "lucide-react";
import { checkProductDelivery, getPincodeDetails } from "../api/deliveryApi";
import locationService from "../services/locationService";

const EnhancedPincodeChecker = ({
  productId = null,
  variantId = null,
  onDeliveryStatusChange = null,
  onPincodeChange = null,
  showProductCheck = false,
  initialPincode = "",
  className = "",
  compact = false,
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeData, setPincodeData] = useState(null);
  const [productDeliveryData, setProductDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Debounce function for better UX
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Check pincode validity
  const isValidPincode = (code) => {
    return locationService.isValidPincode(code);
  };

  // Check general pincode details
  const checkPincode = async (pincodeToCheck = pincode) => {
    if (!pincodeToCheck || !isValidPincode(pincodeToCheck)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getPincodeDetails(pincodeToCheck);

      if (response.success) {
        setPincodeData(response.data);
        onPincodeChange?.(response.data);
        locationService.saveToAddressHistory({
          pincode: pincodeToCheck,
          city: response.data.city,
          state: response.data.state,
        });
        setError("");
      } else {
        setError(
          response.error ||
            response.message ||
            "Delivery not available in this area"
        );
        setPincodeData(null);
      }
    } catch (err) {
      setError("Failed to check pincode");
      setPincodeData(null);
    } finally {
      setLoading(false);
    }
  };

  // Check product-specific delivery
  const checkProductDeliveryHandler = async (pincodeToCheck = pincode) => {
    if (!productId || !isValidPincode(pincodeToCheck)) {
      return;
    }

    setProductLoading(true);

    try {
      const response = await checkProductDelivery(
        productId,
        pincodeToCheck,
        variantId
      );

      if (response.success) {
        setProductDeliveryData(response.data);
        onDeliveryStatusChange?.(response.data.is_available, response.data);
      } else {
        setProductDeliveryData(null);
        onDeliveryStatusChange?.(false, null);
      }
    } catch (err) {
      console.error("Error checking product delivery:", err);
      setProductDeliveryData(null);
      onDeliveryStatusChange?.(false, null);
    } finally {
      setProductLoading(false);
    }
  };

  // Debounced functions
  const debouncedCheckPincode = useCallback(debounce(checkPincode, 800), []);
  const debouncedCheckProduct = useCallback(
    debounce(checkProductDeliveryHandler, 500),
    [productId, variantId]
  );

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);

    // Show suggestions if typing
    if (value.length > 0 && value.length < 6) {
      const pinccodeSuggestions = locationService.getLocationSuggestions(value);
      setSuggestions(pinccodeSuggestions);
      setShowSuggestions(pinccodeSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }

    // Clear previous results
    if (value.length < 6) {
      setPincodeData(null);
      setProductDeliveryData(null);
      setError("");
      onDeliveryStatusChange?.(false, null);
    }

    // Save pincode if valid
    if (isValidPincode(value)) {
      locationService.savePincode(value);
    }
  };

  // Auto-check when pincode is complete
  useEffect(() => {
    if (pincode.length === 6 && isValidPincode(pincode)) {
      debouncedCheckPincode(pincode);
      if (showProductCheck && productId) {
        debouncedCheckProduct(pincode);
      }
    }
  }, [
    pincode,
    debouncedCheckPincode,
    debouncedCheckProduct,
    showProductCheck,
    productId,
  ]);

  // Auto-detect pincode on component mount
  useEffect(() => {
    if (!initialPincode) {
      setIsAutoDetecting(true);
      locationService
        .autoDetectPincode()
        .then((result) => {
          if (result.success && result.pincode) {
            setPincode(result.pincode);
          }
          setIsAutoDetecting(false);
        })
        .catch(() => {
          setIsAutoDetecting(false);
        });
    }
  }, [initialPincode]);

  // Get current location
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location.success) {
        // For demo purposes, show a success message
        // In production, you'd use reverse geocoding to get pincode
        setError(
          "Location detected! Please enter your pincode manually for accurate delivery check."
        );
        setTimeout(() => setError(""), 3000);
      } else {
        setError(
          location.error ||
            "Could not get your location. Please enter pincode manually."
        );
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Could not get your location. Please enter pincode manually.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setPincode(suggestion.pincode);
    setShowSuggestions(false);
  };

  // Get preferred pincodes for quick selection
  const preferredPincodes = locationService.getPreferredPincodes();

  if (compact) {
    return (
      <div className={`compact-pincode-checker ${className}`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pincode}
            onChange={handlePincodeChange}
            placeholder="Enter pincode"
            maxLength="6"
            className={`flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 transition-colors ${
              error
                ? "border-red-300 focus:ring-red-500"
                : productDeliveryData?.is_available
                ? "border-green-300 focus:ring-green-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {(loading || productLoading || isAutoDetecting) && (
            <Loader className="w-4 h-4 animate-spin text-blue-500" />
          )}
        </div>

        {/* Compact delivery status */}
        {showProductCheck && productDeliveryData && (
          <div
            className={`mt-2 text-xs flex items-center gap-1 ${
              productDeliveryData.is_available
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {productDeliveryData.is_available ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>{productDeliveryData.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`enhanced-pincode-checker bg-white border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-800">Check Delivery</h3>
        {isAutoDetecting && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader className="w-3 h-3 animate-spin" />
            <span>Auto-detecting...</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter pincode"
              value={pincode}
              onChange={handlePincodeChange}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow selection
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : productDeliveryData?.is_available
                  ? "border-green-300 focus:ring-green-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
              maxLength="6"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <History className="w-3 h-3 text-gray-400" />
                    <span>{suggestion.pincode}</span>
                    {suggestion.city && (
                      <span className="text-gray-500">- {suggestion.city}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => checkPincode(pincode)}
            disabled={loading || pincode.length !== 6}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            Check
          </button>

          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quick select from preferred pincodes */}
      {preferredPincodes.length > 0 && !pincode && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">Recently used:</div>
          <div className="flex gap-2 flex-wrap">
            {preferredPincodes.slice(0, 3).map((item, index) => (
              <button
                key={index}
                onClick={() => setPincode(item.pincode)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
              >
                {item.pincode}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded border border-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Product-specific delivery status */}
      {showProductCheck && productId && pincode.length === 6 && (
        <div className="mb-3">
          {productLoading ? (
            <div className="flex items-center gap-2 text-gray-600 text-sm p-2 bg-gray-50 rounded">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Checking product availability...</span>
            </div>
          ) : productDeliveryData ? (
            <div
              className={`p-3 rounded-lg border ${
                productDeliveryData.is_available
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {productDeliveryData.is_available ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {productDeliveryData.message ||
                    (productDeliveryData.is_available
                      ? "Product available for delivery"
                      : "Product not available")}
                </span>
              </div>

              {productDeliveryData.is_available && (
                <div className="space-y-1 text-sm">
                  {productDeliveryData.delivery_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Expected delivery: {productDeliveryData.delivery_time}
                      </span>
                    </div>
                  )}
                  {productDeliveryData.total_stock && (
                    <div className="text-sm opacity-75">
                      {productDeliveryData.total_stock} units available in your
                      area
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* General pincode information */}
      {pincodeData && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <Truck className="w-4 h-4" />
            <span>
              Delivery available to {pincodeData.city}, {pincodeData.state}
            </span>
          </div>

          {pincodeData.deliveryTime && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Standard delivery: {pincodeData.deliveryTime}</span>
            </div>
          )}

          {pincodeData.codAvailable && (
            <div className="text-blue-600 flex items-center gap-2">
              <span>💳</span>
              <span>Cash on Delivery available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedPincodeChecker;
