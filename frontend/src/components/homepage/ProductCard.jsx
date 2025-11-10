"use client";
import React, { useState, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { CartContext } from "@/Context/CartContext";
import dynamic from 'next/dynamic';

// Dynamically import AddToCartButton with no SSR to avoid hydration issues
const AddToCartButton = dynamic(() => import("@/components/common/AddToCartButton"), {
  ssr: false,
});

const ProductCard = ({
  product,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const { addToCart } = useContext(CartContext);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showVariants, setShowVariants] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Always show main product pricing on card (no dynamic price change)
  const cardPrice = parseFloat((product.price || 0).toString().replace(/,/g, ""));
  const cardOldPrice = parseFloat((product.oldPrice || product.old_price || (cardPrice * 1.2)).toString().replace(/,/g, ""));
  const cardSavings = cardOldPrice - cardPrice;
  const cardDiscountPercentage = Math.round((cardSavings / cardOldPrice) * 100);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setShowVariants(false);
    setIsOutOfStock(variant.variant_stock <= 0);
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      setShowVariants(true);
      return;
    }

    const activeVariant = selectedVariant;
    const currentStock = activeVariant ? activeVariant.variant_stock : (product.originalStock || product.stock);
    
    if (currentStock <= 0) {
      setIsOutOfStock(true);
      return;
    }

    const cartItem = {
      id: activeVariant ? `${product.id}_variant_${activeVariant.id}` : product.id,
      productId: product.id,
      variantId: activeVariant ? activeVariant.id : null,
      name: activeVariant ? `${product.name} - ${activeVariant.variant_weight} ${activeVariant.variant_unit}` : product.name,
      price: activeVariant ? activeVariant.variant_price : cardPrice,
      old_price: activeVariant ? activeVariant.variant_old_price : cardOldPrice,
      shipping_amount: parseFloat((product.shipping_amount || 0).toString().replace(/,/g, "")),
      image: activeVariant ? (activeVariant.variant_image || product.image) : product.image,
      rating: product.rating || 4.5,
      reviews: product.reviews || 0,
      brand: product.brand || 'BigBestMart',
      savings: activeVariant ? (activeVariant.variant_old_price - activeVariant.variant_price) : cardSavings,
      discountPercentage: activeVariant ? Math.round(((activeVariant.variant_old_price - activeVariant.variant_price) / activeVariant.variant_old_price) * 100) : cardDiscountPercentage,
      stock: currentStock,
      isVariant: !!activeVariant,
      variant: activeVariant,
      weight: activeVariant ? `${activeVariant.variant_weight} ${activeVariant.variant_unit}` : (product.weight || "1 Unit"),
      inStock: currentStock > 0,
      quantity: 1
    };

    addToCart(cartItem);
    setSelectedVariant(null);
  };

  return (
    <div
      className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 group flex-shrink-0 transform hover:scale-[1.02] hover:-translate-y-1 relative rounded-lg overflow-hidden
        ${hovered ? "md:scale-105 z-10" : ""}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Product Image */}
      <div
        className="h-32 sm:h-36 md:h-40 lg:h-44 bg-gray-50 ml-1 mt-1 overflow-hidden relative cursor-pointer"
        onClick={() => onClick && onClick(product)}
      >
        {product.image && product.image.includes('supabase.co') ? (
          <img
            src={product.image}
            alt={product.name}
            className="object-contain w-full h-full p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "/prod1.png";
            }}
          />
        ) : (
          <Image
            src={product.image || "/prod1.png"}
            alt={product.name}
            width={300}
            height={200}
            className="object-contain w-full h-full p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        {/* Brand Name - Always visible */}
        <div className="mb-2">
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            {product.brand || 'BigBestMart'}
          </span>
        </div>

        <h3
          className="text-sm sm:text-base font-semibold mb-2 line-clamp-2 leading-tight text-gray-900 cursor-pointer"
          onClick={() => onClick && onClick(product)}
        >
          {product.name}
        </h3>

        {/* Category Badge */}
        <div className="mb-2">
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            {product.category || "Product"}
          </span>
        </div>

        {/* Weight/Unit Display */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-full">
            {selectedVariant ? `${selectedVariant.variant_weight} ${selectedVariant.variant_unit}` : (product.weight || "1 Unit")}
          </span>
          {hasVariants && (
            <button
              onClick={() => setShowVariants(!showVariants)}
              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              {selectedVariant ? 'Change' : 'Choose'}
              <svg className={`w-3 h-3 transition-transform ${showVariants ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Variant Dropdown */}
        {hasVariants && showVariants && (
          <div className="mb-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">Choose Size/Weight:</div>
            <div className="space-y-1">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  disabled={variant.variant_stock <= 0}
                  className={`w-full text-left text-xs px-2 py-1 rounded border transition-colors ${
                    selectedVariant?.id === variant.id
                      ? 'bg-orange-500 text-white border-orange-500'
                      : variant.variant_stock <= 0
                      ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{variant.variant_weight} {variant.variant_unit}</span>
                    <span className="text-xs">
                      {variant.variant_stock <= 0 ? 'Out of Stock' : `₹${variant.variant_price}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price - ALWAYS show main product pricing (NEVER variant pricing) */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            ₹{product.cardPrice || product.originalPrice || cardPrice}
          </span>
          {cardSavings > 0 && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.cardOldPrice || product.originalOldPrice || cardOldPrice}
            </span>
          )}
        </div>

        {/* Savings Amount - Based on original product pricing */}
        {cardSavings > 0 && (
          <div className="flex flex-col mb-1">
            <div className="text-xs text-green-600">
              You Save:
            </div>
            <div className="text-sm font-semibold text-green-600">
              ₹{cardSavings.toFixed(2)} ({cardDiscountPercentage}% Off)
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center mb-3">
          <span className="text-xs sm:text-sm text-gray-500">
            ⭐ {product.rating || 4.5} ({product.reviews || 0} reviews)
          </span>
        </div>

        {/* Stock Status */}
        {isOutOfStock && (
          <div className="text-xs text-red-500 mb-2 text-center">
            Selected variant is out of stock
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 rounded font-medium transition-colors"
        >
          {hasVariants && !selectedVariant ? 'SELECT VARIANT' : 'ADD TO CART'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
