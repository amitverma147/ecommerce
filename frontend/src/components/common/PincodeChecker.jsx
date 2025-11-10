"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  checkProductDelivery,
  getPincodeDetails,
  getCurrentLocation,
} from "../../../api/deliveryApi";

const PincodeChecker = ({
  productId,
  variantId = null,
  onDeliveryStatusChange,
  showShippingInfo = true,
  className = "",
  initialPincode = "",
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Debounce function to avoid too many API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Function to validate pincode format (Indian pincodes are 6 digits)
  const isValidPincode = (code) => {
    return /^[1-9][0-9]{5}$/.test(code);
  };

  // Function to check delivery
  const checkDelivery = async (pincodeToCheck) => {
    if (!pincodeToCheck || !isValidPincode(pincodeToCheck)) {
      setDeliveryData(null);
      setError(null);
      onDeliveryStatusChange?.(false, null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await checkProductDelivery(
        productId,
        pincodeToCheck,
        variantId
      );

      if (response.success) {
        setDeliveryData(response.data);
        onDeliveryStatusChange?.(response.data.is_available, response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to check delivery");
        setDeliveryData(null);
        onDeliveryStatusChange?.(false, null);
      }
    } catch (err) {
      setError("Something went wrong while checking delivery");
      setDeliveryData(null);
      onDeliveryStatusChange?.(false, null);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced version of checkDelivery
  const debouncedCheckDelivery = useCallback(debounce(checkDelivery, 800), [
    productId,
    variantId,
  ]);

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6); // Only numbers, max 6 digits
    setPincode(value);

    // Clear previous results immediately for better UX
    if (value.length < 6) {
      setDeliveryData(null);
      setError(null);
      onDeliveryStatusChange?.(false, null);
    }
  };

  // Effect to trigger delivery check when pincode changes
  useEffect(() => {
    if (pincode.length === 6) {
      debouncedCheckDelivery(pincode);
    }
  }, [pincode, debouncedCheckDelivery]);

  // Get user's current location and derive pincode
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location.success) {
        // For now, we'll show a success message and ask user to enter pincode manually
        // In a real app, you'd use a reverse geocoding service to get pincode from coordinates
        alert("Location detected! Please enter your pincode manually for now.");
      }
    } catch (error) {
      setError("Could not get your location. Please enter pincode manually.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Load pincode from localStorage on component mount
  useEffect(() => {
    if (!initialPincode) {
      const savedPincode = localStorage.getItem("userPincode");
      if (savedPincode && isValidPincode(savedPincode)) {
        setPincode(savedPincode);
      }
    }
  }, [initialPincode]);

  // Save pincode to localStorage when it changes and is valid
  useEffect(() => {
    if (isValidPincode(pincode)) {
      localStorage.setItem("userPincode", pincode);
    }
  }, [pincode]);

  return (
    <div className={`pincode-checker ${className}`}>
      <div className="pincode-input-section">
        <div
          className="pincode-input-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              maxWidth: "200px",
            }}
          >
            <input
              type="text"
              value={pincode}
              onChange={handlePincodeChange}
              placeholder="Enter pincode"
              maxLength="6"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                borderColor: error
                  ? "#ff4444"
                  : deliveryData?.is_available
                  ? "#28a745"
                  : "#ddd",
              }}
              onFocus={() => setIsExpanded(true)}
            />
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  border: "2px solid #f3f3f3",
                  borderTop: "2px solid #007bff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
          </div>

          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            style={{
              padding: "8px 12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              opacity: isGettingLocation ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            📍 {isGettingLocation ? "Getting..." : "Use Location"}
          </button>
        </div>

        {/* Delivery Status Display */}
        {deliveryData && (
          <div
            style={{
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: deliveryData.is_available
                ? "#d4edda"
                : "#f8d7da",
              border: `1px solid ${
                deliveryData.is_available ? "#c3e6cb" : "#f5c6cb"
              }`,
              color: deliveryData.is_available ? "#155724" : "#721c24",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>
                {deliveryData.is_available ? "✅" : "❌"}
              </span>
              <span style={{ fontWeight: "500" }}>
                {deliveryData.message ||
                  (deliveryData.is_available
                    ? "Available for delivery"
                    : "Not deliverable")}
              </span>
            </div>

            {deliveryData.is_available && deliveryData.delivery_time && (
              <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.8 }}>
                Expected delivery: {deliveryData.delivery_time}
              </div>
            )}

            {deliveryData.is_available &&
              deliveryData.total_stock &&
              showShippingInfo && (
                <div
                  style={{ marginTop: "4px", fontSize: "12px", opacity: 0.8 }}
                >
                  {deliveryData.total_stock} units available in your area
                </div>
              )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              color: "#721c24",
              borderRadius: "4px",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            {error}
          </div>
        )}

        {/* Pincode Format Helper */}
        {isExpanded && pincode.length > 0 && pincode.length < 6 && (
          <div
            style={{
              fontSize: "12px",
              color: "#6c757d",
              marginTop: "4px",
            }}
          >
            Please enter a 6-digit pincode
          </div>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: translateY(-50%) rotate(0deg);
          }
          100% {
            transform: translateY(-50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default PincodeChecker;
