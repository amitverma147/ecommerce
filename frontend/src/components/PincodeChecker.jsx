"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { checkProductDelivery, getPincodeDetails } from "../api/deliveryApi";

const PincodeChecker = ({
  onPincodeChange,
  productId = null,
  variantId = null,
  onDeliveryStatusChange = null,
  showProductCheck = false,
  initialPincode = "",
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeData, setPincodeData] = useState(null);
  const [productDeliveryData, setProductDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce function for better UX
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const isValidPincode = (code) => {
    return /^[1-9][0-9]{5}$/.test(code);
  };

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
        setError("");

        // Also check product delivery if productId is provided
        if (showProductCheck && productId) {
          await checkProductDelivery(productId, pincodeToCheck, variantId);
        }
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
  const debouncedCheckPincode = useCallback(debounce(checkPincode, 800), [
    productId,
    variantId,
    showProductCheck,
  ]);
  const debouncedCheckProduct = useCallback(
    debounce(checkProductDeliveryHandler, 500),
    [productId, variantId]
  );

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);

    // Clear previous results
    if (value.length < 6) {
      setPincodeData(null);
      setProductDeliveryData(null);
      setError("");
      onDeliveryStatusChange?.(false, null);
    }
  };

  // Auto-check when pincode is complete
  useEffect(() => {
    if (pincode.length === 6) {
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

  // Load saved pincode on mount
  useEffect(() => {
    if (!initialPincode) {
      const savedPincode = localStorage.getItem("userPincode");
      if (savedPincode && isValidPincode(savedPincode)) {
        setPincode(savedPincode);
      }
    }
  }, [initialPincode]);

  // Save pincode to localStorage
  useEffect(() => {
    if (isValidPincode(pincode)) {
      localStorage.setItem("userPincode", pincode);
    }
  }, [pincode]);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200/60 rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 shadow-lg shadow-gray-200/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#FF7558]/10 to-[#FF7558]/20 rounded-lg">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#FF7558]" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg tracking-tight">
          Check Delivery Availability
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={handlePincodeChange}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7558]/20 focus:border-[#FF7558] transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm ${
              error
                ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                : productDeliveryData?.is_available
                ? "border-green-300 focus:ring-green-500/20 focus:border-green-400"
                : "border-gray-200 hover:border-gray-300"
            }`}
            maxLength="6"
          />
          {pincode.length === 6 && !error && (
            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
          )}
        </div>
        <button
          onClick={() => checkPincode(pincode)}
          disabled={loading || pincode.length !== 6}
          className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#FF7558] to-[#e66a4f] hover:from-[#e66a4f] hover:to-[#d45a3f] text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#FF7558] disabled:hover:to-[#e66a4f] flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          )}
          <span className="hidden xs:inline">Check Delivery</span>
          <span className="xs:hidden">Check</span>
        </button>
      </div>

      {/* Product-specific delivery status - only show when there's an issue */}
      {showProductCheck &&
        productId &&
        pincode.length === 6 &&
        productDeliveryData &&
        !productDeliveryData.is_available && (
          <div className="mb-3 sm:mb-4">
            {productLoading ? (
              <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200/50">
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500" />
                <span className="font-medium">
                  Checking product availability...
                </span>
              </div>
            ) : (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 bg-gradient-to-r from-red-50 to-pink-50 border-red-200/60 text-red-800 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="p-1 bg-red-100 rounded-full">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">
                    {productDeliveryData.message ||
                      "Product not available in your area"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

      {/* General pincode information - only show when there's an error */}
      {pincodeData && !pincodeData.deliveryAvailable && (
        <div className="space-y-2 sm:space-y-3 text-sm">
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-200/60 shadow-sm">
            <div className="p-1 bg-red-100 rounded-full">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <span className="font-medium text-red-800">
              Delivery not available to {pincodeData.city}, {pincodeData.state}
            </span>
          </div>
        </div>
      )}

      {/* Success state */}
      {pincodeData &&
        pincodeData.deliveryAvailable &&
        productDeliveryData?.is_available && (
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200/60 shadow-sm">
            <div className="p-1 bg-green-100 rounded-full">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <span className="font-medium text-green-800 text-sm sm:text-base">
              ✓ Delivery available to {pincodeData.city}, {pincodeData.state}
            </span>
          </div>
        )}
    </div>
  );
};

export default PincodeChecker;
