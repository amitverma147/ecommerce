"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { codOrdersApi } from "@/api/codOrders";
import OrderSuccessModal from "./OrderSuccessModal";

const CodPaymentOption = ({ 
  totalAmount, 
  cartItems, 
  selectedAddress, 
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Get real authenticated user data
  const { currentUser, userProfile } = useAuth();

  const handleCodOrder = async () => {
    if (!currentUser || !selectedAddress) {
      onPaymentError("Please login and select delivery address");
      return;
    }

    if (totalAmount >= 1000) {
      onPaymentError("COD is only available for orders below ₹1000");
      return;
    }

    setIsProcessing(true);

    try {
      // Create single COD order with total amount (not per item validation)
      const codOrderData = {
        user_id: currentUser.id,
        product_id: cartItems.map(item => item.productId || item.id).join(','), // Multiple products
        user_name: userProfile?.full_name || userProfile?.name || currentUser.user_metadata?.name || selectedAddress.label || 'Customer',
        user_email: currentUser.email,
        product_name: cartItems.map(item => `${item.name} (${item.quantity})`).join(', '), // All products
        product_total_price: totalAmount, // Total cart amount
        user_address: selectedAddress.address,
        user_location: selectedAddress.city || selectedAddress.area || selectedAddress.label,
        quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0) // Total quantity
      };

      console.log('Creating COD order:', codOrderData);
      const result = await codOrdersApi.createCodOrder(codOrderData);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create COD order");
      }

      // Set order details for success modal
      setOrderDetails({
        id: result.cod_order?.id || Date.now(),
        total_amount: totalAmount.toFixed(2),
        total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        order: result.cod_order
      });

      // Show success modal
      setShowSuccessModal(true);

      // Clear cart after successful COD orders
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://big-best-backend.vercel.app/api';
        await fetch(`${apiUrl}/cart/clear/${currentUser.id}`, {
          method: "DELETE",
        });
      } catch (cartError) {
        console.warn('Failed to clear cart:', cartError);
      }

      onPaymentSuccess({
        payment_method: "cod",
        cod_order: result.cod_order,
        message: "COD order placed successfully",
        total_amount: totalAmount,
        total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });

    } catch (error) {
      console.error("COD order error:", error);
      onPaymentError(error.message || "Failed to place COD order");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if COD is available (maximum ₹1000)
  const isCodAvailable = totalAmount < 1000;
  
  console.log('COD Check:', { totalAmount, isCodAvailable });

  return (
    <div className={`border rounded-lg p-4 ${isCodAvailable ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            💵
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Cash on Delivery (COD)</h3>
            <p className="text-sm text-gray-600">Pay when you receive your order</p>
          </div>
        </div>
        {!isCodAvailable && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
            Max ₹1000 allowed
          </span>
        )}
      </div>

      {isCodAvailable ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
            <p className="font-medium text-green-800 mb-1">✓ COD Available</p>
            <p>You can pay ₹{totalAmount.toFixed(2)} in cash when your order is delivered.</p>
            <p className="text-xs text-green-600 mt-1">Order value below ₹1000 - COD eligible</p>
          </div>
          
          <button
            onClick={handleCodOrder}
            disabled={isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isProcessing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isProcessing ? "Processing..." : "Place COD Order"}
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
          <p className="font-medium text-red-600 mb-1">❌ COD Not Available</p>
          <p>COD is only available for orders below ₹1000.</p>
          <p>Current order total: ₹{totalAmount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Remove ₹{(totalAmount - 999.99).toFixed(2)} to enable COD</p>
        </div>
      )}
      
      {/* Success Modal */}
      <OrderSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Redirect to home or orders page
          window.location.href = '/';
        }}
        orderDetails={orderDetails}
      />
    </div>
  );
};

export default CodPaymentOption;