"use client";
import React, { useState, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";
import { FaRupeeSign, FaSpinner } from "react-icons/fa";
import AddToCartButton from "@/components/common/AddToCartButton";
import ProductVariantModal from "@/components/common/ProductVariantModal";
import BulkOrderModal from "@/components/BulkOrder/BulkOrderModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useBulkModal } from "@/hooks/useBulkModal";

const ProductCard = ({
  product,
  className = "",
  showDiscount = true,
  showBoughtBefore = true,
}) => {
  const [variants, setVariants] = useState([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [hasBulkPricing, setHasBulkPricing] = useState(false);
  const [bulkSettings, setBulkSettings] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  const { isOpen: isBulkModalOpen, selectedProduct, openBulkModal, closeBulkModal } = useBulkModal();
  const router = useRouter();
  
  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      oldPrice: Number(product.oldPrice || product.price * 1.2),
      image: product.image || "/prod1.png",
      rating: product.rating || 4.0,
      reviews: product.reviews || product.review_count || 0,
      quantity: 1,
      weight: product.weight || product.uom || "1 Unit",
    };
    // Add to cart logic here
    console.log('Adding to cart:', cartItem);
  };

  // Fetch variants and bulk settings when component mounts
  useEffect(() => {
    fetchVariants();
    checkBulkPricing();
  }, [product.id]);

  const fetchVariants = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/product-variants/product/${product.id}/variants`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.variants.length > 0) {
          setVariants(data.variants);
          setHasVariants(true);
        }
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const checkBulkPricing = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulk-wholesale/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasBulkPricing) {
          setHasBulkPricing(true);
          setBulkSettings(data.bulkSettings);
        }
      }
    } catch (error) {
      console.error('Error checking bulk pricing:', error);
    }
  };

  const handleVariantClick = () => {
    setShowVariantModal(true);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to buy now');
      router.push('/pages/login');
      return;
    }

    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setBuyNowLoading(true);
    
    try {
      const totalAmount = product.price + (product.shipping_amount || 0);
      const orderId = `ORDER_${Date.now()}_${product.id}`;
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
        amount: totalAmount * 100, // Amount in paisa
        currency: 'INR',
        name: 'BigBestMart',
        description: `Buy Now - ${product.name}`,
        image: '/logo.png',
        order_id: orderId,
        
        prefill: {
          name: currentUser?.user_metadata?.name || 'Customer',
          email: currentUser?.email || 'customer@bigbestmart.com',
          contact: currentUser?.user_metadata?.phone || '9999999999'
        },
        
        theme: {
          color: '#FF6B00'
        },
        
        handler: function (response) {
          console.log('Payment successful:', response);
          toast.success(`Payment successful for ${product.name}!`);
          
          // You can add order creation logic here
          router.push(`/pages/payment-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}&amount=${totalAmount}&productName=${encodeURIComponent(product.name)}`);
          setBuyNowLoading(false);
        },
        
        modal: {
          ondismiss: function() {
            setBuyNowLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setBuyNowLoading(false);
      });

      rzp.open();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment');
      setBuyNowLoading(false);
    }
  };
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group relative ${className}`}
    >
      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 bg-gray-50 ml-1 mt-1 overflow-hidden h-32 sm:h-36 md:h-40 lg:h-44 flex items-center justify-center">
        {/* Discount Badge - Top Left Corner */}
        {showDiscount &&
          product.oldPrice &&
          product.oldPrice > product.price && (
            <div className="absolute top-1 left-1 bg-red-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-bold leading-tight z-20 shadow-md">
              <span>-</span>
              {Math.round(
                ((product.oldPrice - product.price) / product.oldPrice) * 100
              )}
              %
            </div>
          )}
        
        <img
          src={product.image || "/prod1.png"}
          alt={product.name}
          width={300}
          height={200}
          className="object-contain w-full h-full p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "/prod1.png";
          }}
        />
        
        {/* Wishlist Heart Icon - Top Right */}
        <button className="absolute top-1 right-1 w-6 h-6 sm:w-8 sm:h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all duration-200 z-10">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 000-6.364 4.5 4.5 0 00-6.364 0L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Out of Stock Badge */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        {/* Bought Before - Keep at top */}
        {showBoughtBefore && (
          <p className="text-xs text-gray-500 mb-2 text-left">Bought Before</p>
        )}

        {/* Brand Name */}
        {product.brand && (
          <div className="mb-2">
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
              {product.brand}
            </span>
          </div>
        )}

        <h3
          className="text-sm sm:text-base font-semibold mb-2 line-clamp-2 leading-tight text-gray-900 cursor-pointer"
          onClick={() => router.push(`/pages/singleproduct/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Category Badge */}
        <div className="mb-2">
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            {product.category || "Product"}
          </span>
        </div>

        {/* Weight/Variant Selector */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-full">
            {product.weight || product.uom || "1 Unit"}
          </span>
          {hasVariants && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVariantClick();
              }}
              className="p-1 hover:bg-green-50 rounded-full transition-all duration-200"
            >
              <IoChevronDown className="w-3 h-3 text-green-600 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Price - ALWAYS show original product pricing */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            ₹{product.cardPrice || product.originalPrice || product.price}
          </span>
          {(product.cardOldPrice || product.originalOldPrice || product.oldPrice) && 
           (product.cardOldPrice || product.originalOldPrice || product.oldPrice) > (product.cardPrice || product.originalPrice || product.price) && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.cardOldPrice || product.originalOldPrice || product.oldPrice}
            </span>
          )}
        </div>

        {/* Savings Amount - Based on original product pricing */}
        {(product.cardOldPrice || product.originalOldPrice || product.oldPrice) && 
         (product.cardOldPrice || product.originalOldPrice || product.oldPrice) > (product.cardPrice || product.originalPrice || product.price) && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-green-600">You Save:</span>
            <span className="text-sm font-semibold text-green-600">
              ₹{Math.round((product.cardOldPrice || product.originalOldPrice || product.oldPrice) - (product.cardPrice || product.originalPrice || product.price))}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center mb-3">
          <span className="text-xs sm:text-sm text-gray-500">
            ⭐ {product.rating || 4.5} ({product.reviews || product.review_count || 0} reviews)
          </span>
        </div>

        {/* Bulk Pricing Badge */}
        {hasBulkPricing && bulkSettings && (
          <div className="bg-blue-50 border border-blue-200 rounded p-1 mb-2">
            <div className="text-xs text-blue-700 font-medium text-center">
              🏪 Bulk Available: {bulkSettings.min_quantity}+ units
            </div>
            <div className="text-xs text-blue-600 text-center">
              Save {bulkSettings.discount_percentage}% • ₹{bulkSettings.bulk_price}/unit
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(product);
          }}
          disabled={!product.inStock}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs py-2 rounded font-medium transition-colors mb-2"
        >
          ADD TO CART
        </button>
        {/* Bulk Order Button */}
        {hasBulkPricing && (
          <button
            onClick={() => openBulkModal(product)}
            className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>🏪</span>
            <span>Bulk Order</span>
          </button>
        )}
      </div>
      
      {/* Variant Modal */}
      <ProductVariantModal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        product={product}
        variants={variants}
      />
      
      {/* Bulk Order Modal */}
      <BulkOrderModal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        product={selectedProduct}
      />
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
