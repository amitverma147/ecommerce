"use client";
import React from "react";

const OrderSuccessModal = ({ isOpen, onClose, orderDetails }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 transform transition-all duration-300 animate-bounce">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">🎉 Order Placed Successfully!</h2>
          <p className="text-gray-600 text-lg">Your COD order has been confirmed and will be delivered soon</p>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">📋</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-gray-700 font-medium">Order ID:</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">#{orderDetails.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-gray-700 font-medium">Total Amount:</span>
                <span className="font-bold text-green-700 text-xl">₹{orderDetails.total_amount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-gray-700 font-medium">Payment Method:</span>
                <span className="font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">💵 Cash on Delivery</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 font-medium">Total Items:</span>
                <span className="font-bold text-gray-900">{orderDetails.total_items} items</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🛍️ Continue Shopping
          </button>
          <button
            onClick={() => window.location.href = '/pages/cod-orders'}
            className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            📦 View My Orders
          </button>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800 font-semibold mb-2">
              <span className="text-lg">⏰</span>
              <span>What's Next?</span>
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Our team will contact you within 24 hours</p>
              <p>• Prepare exact cash amount for delivery</p>
              <p>• Track your order in "My Orders" section</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;