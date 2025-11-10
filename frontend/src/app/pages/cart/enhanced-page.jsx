"use client";
import Link from "next/link";
import { FaArrowLeft, FaAngleRight, FaSync } from "react-icons/fa";
import { useContext, useEffect, useState } from "react";
import { EnhancedCartContext } from "@/Context/EnhancedCartContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import AddToCartButton from "@/components/common/AddToCartButton";

const EnhancedCartPage = () => {
  const { 
    cartItems, 
    isLoading, 
    lastSync, 
    getCartTotal, 
    syncCartWithDB,
    deleteFromCart 
  } = useContext(EnhancedCartContext);
  
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);

  // Auto-sync every 30 seconds if user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      const interval = setInterval(() => {
        syncCartWithDB();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, syncCartWithDB]);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncCartWithDB();
    setSyncing(false);
  };

  const calculateSummary = () => {
    const totalMRP = cartItems.reduce((total, item) => 
      total + ((item.old_price || item.price) * item.quantity), 0
    );
    
    const discountOnMRP = cartItems.reduce((total, item) => 
      total + (((item.old_price || item.price) - item.price) * item.quantity), 0
    );
    
    const productTotal = cartItems.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
    
    const shippingCharges = cartItems.reduce((total, item) => 
      total + ((item.shipping_amount || 0) * item.quantity), 0
    );

    return { totalMRP, discountOnMRP, productTotal, shippingCharges };
  };

  const { totalMRP, discountOnMRP, productTotal, shippingCharges } = calculateSummary();

  return (
    <div className="w-full h-auto flex flex-col px-5 lg:px-10 py-8 gap-10">
      {/* Breadcrumb */}
      <div className="w-full h-auto flex gap-3 lg:gap-5 flex-wrap items-center font-outfit">
        <Link href="/" className="p-3 bg-[#2A2A2A] text-white rounded-full">
          <FaArrowLeft size={20} />
        </Link>
        <Link href="/" className="text-[#2F294D] font-semibold lg:text-lg">
          Home
        </Link>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#FF7558] font-semibold lg:text-lg">Cart</span>
        
        {/* Sync Status */}
        {currentUser && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 disabled:opacity-50"
            >
              <FaSync className={syncing ? "animate-spin" : ""} size={12} />
              {syncing ? "Syncing..." : "Sync"}
            </button>
            {lastSync && (
              <span className="text-xs text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7558]"></div>
          <span className="ml-2 text-gray-600">Loading cart...</span>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-8 font-outfit items-start">
        {/* Left: Order Items */}
        <div className="w-full lg:w-[65%] flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-1">Current Order</h2>
            <p className="text-sm text-gray-500 mb-6">
              Real-time pricing from database
            </p>
            
            <div className="flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link
                    href="/"
                    className="bg-[#FF7558] text-white px-6 py-2 rounded-lg"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between border border-gray-200 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 flex items-center justify-center bg-gray-50 rounded">
                        <Image
                          src={item.image || "/prod1.png"}
                          alt={item.name || "Product image"}
                          width={56}
                          height={56}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-base">
                          {item.name}
                          {item.isBulkOrder && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              🏪 Bulk Order
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.weight && `${item.weight} • `}
                          <div>MRP: ₹{(item.old_price || item.price).toFixed(2)}</div>
                          <div>Price: ₹{item.price.toFixed(2)}</div>
                          <div className="text-blue-600">
                            Shipping: {item.shipping_amount > 0 ? `₹${item.shipping_amount.toFixed(2)}` : 'FREE'}
                          </div>
                          {item.old_price && item.old_price > item.price && (
                            <div className="text-green-600">
                              You save: ₹{(item.old_price - item.price).toFixed(2)} per unit
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Stock: {item.stock || 'Available'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-[#FF7558] font-bold text-lg">
                        ₹{((parseFloat(item.price) + (item.shipping_amount || 0)) * item.quantity).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-3">
                        <AddToCartButton
                          product={item}
                          size="default"
                          showCheckoutButton={false}
                        />
                        <button
                          onClick={() => deleteFromCart(item)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-full lg:w-[35%] flex-shrink-0">
          <div className="bg-[#232224] text-white rounded-3xl shadow p-7 flex flex-col gap-4">
            <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
            <div className="border-b-2 border-gray-200 mb-1"></div>
            
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>Total MRP ({cartItems.reduce((total, item) => total + item.quantity, 0)} items)</span>
                <span>₹{totalMRP.toFixed(2)}</span>
              </div>
              
              {discountOnMRP > 0 && (
                <div className="flex justify-between">
                  <span>Discount on MRP</span>
                  <span className="text-green-500">- ₹{discountOnMRP.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Product Total</span>
                <span>₹{productTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span className={shippingCharges === 0 ? 'text-green-500' : ''}>
                  {shippingCharges === 0 ? 'FREE' : `₹${shippingCharges.toFixed(2)}`}
                </span>
              </div>
            </div>
            
            <div className="border-b-2 border-gray-200 my-1"></div>
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-gray-300 mt-1 text-center">
              (Product Total + Shipping Charges)
            </div>
            
            {/* DB Sync Status */}
            {currentUser && (
              <div className="text-xs text-gray-400 text-center mt-2 p-2 bg-gray-800 rounded">
                💾 Synced with database
                {lastSync && (
                  <div>Last updated: {lastSync.toLocaleTimeString()}</div>
                )}
              </div>
            )}
            
            <Link
              href="/pages/checkout"
              className="w-full flex justify-center items-center bg-[#FF7558] text-white py-3 rounded-2xl font-bold text-lg mt-2 shadow-md hover:bg-[#ff5a36] transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCartPage;