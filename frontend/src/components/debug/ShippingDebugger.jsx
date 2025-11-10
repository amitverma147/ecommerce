"use client";
import React, { useContext } from "react";
import { CartContext } from "@/Context/CartContext";

const ShippingDebugger = ({ showDebug = false }) => {
  const { cartItems, getCartTotal } = useContext(CartContext);

  if (!showDebug) return null;

  const calculateBreakdown = () => {
    const productTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingTotal = cartItems.reduce((total, item) => total + ((item.shipping_amount || 0) * item.quantity), 0);
    const finalTotal = getCartTotal();

    return { productTotal, shippingTotal, finalTotal };
  };

  const { productTotal, shippingTotal, finalTotal } = calculateBreakdown();

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 max-w-sm z-50">
      <h4 className="font-bold text-red-800 mb-2">🐛 Shipping Debug Info</h4>
      
      <div className="text-sm space-y-1">
        <div><strong>Cart Items:</strong> {cartItems.length}</div>
        <div><strong>Product Total:</strong> ₹{productTotal.toFixed(2)}</div>
        <div><strong>Shipping Total:</strong> ₹{shippingTotal.toFixed(2)}</div>
        <div><strong>Final Total:</strong> ₹{finalTotal.toFixed(2)}</div>
        <div><strong>Match:</strong> {(productTotal + shippingTotal).toFixed(2) === finalTotal.toFixed(2) ? '✅' : '❌'}</div>
      </div>

      <div className="mt-3 border-t pt-2">
        <div className="text-xs text-gray-600">
          <strong>Items Breakdown:</strong>
        </div>
        {cartItems.map((item, index) => (
          <div key={index} className="text-xs">
            {item.name}: ₹{item.price} + ₹{item.shipping_amount || 0} × {item.quantity}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShippingDebugger;