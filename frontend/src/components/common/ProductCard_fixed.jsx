"use client";
import React, { useState, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";
import AddToCartButton from "@/components/common/AddToCartButton";
import { useRouter } from "next/navigation";

const ProductCard = ({
  product,
  className = "",
  showDiscount = true,
  showBoughtBefore = true,
}) => {
  const [variants, setVariants] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const router = useRouter();

  // Fetch variants when component mounts
  useEffect(() => {
    fetchVariants();
  }, [product.id]);

  const fetchVariants = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product-variants/product/${product.id}/variants`);
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

  const handleVariantClick = () => {
    setShowVariantDropdown(!showVariantDropdown);
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setShowVariantDropdown(false);
  };

  // Always show main product price on card - variants only in dropdown
  const currentProduct = {
    ...product,
    price: product.price, // Always main product price
    oldPrice: product.oldPrice || product.old_price, // Always main product old price
    weight: product.weight || product.uom,
    stock: product.stock,
    inStock: product.inStock
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group relative ${className}`}
    >
      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 bg-gray-50 ml-1 mt-1 overflow-hidden h-32 sm:h-36 md:h-40 lg:h-44 flex items-center justify-center">
        {/* Discount Badge */}
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
        
        {/* Wishlist Heart Icon */}
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
        {/* Bought Before */}
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
        <div className="relative mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-full">
              {currentProduct.weight || currentProduct.uom || "1 Unit"}
            </span>
            {hasVariants && variants.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVariantClick();
                }}
                className="p-1 hover:bg-green-50 rounded-full transition-all duration-200"
              >
                <IoChevronDown className={`w-3 h-3 text-green-600 transition-all duration-300 ${showVariantDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          
          {/* Variant Dropdown */}
          {hasVariants && variants.length > 0 && showVariantDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-40 overflow-y-auto">
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const discountPercent = variant.variant_old_price && variant.variant_old_price > variant.variant_price
                  ? Math.round(((variant.variant_old_price - variant.variant_price) / variant.variant_old_price) * 100)
                  : 0;
                
                return (
                  <div
                    key={variant.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVariantSelect(variant);
                    }}
                    className={`p-2 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {variant.variant_weight} {variant.variant_unit}
                          </span>
                          {discountPercent > 0 && (
                            <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs font-medium">
                              -{discountPercent}%
                            </span>
                          )}
                          {isSelected && (
                            <span className="bg-green-600 text-white px-1 py-0.5 rounded text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-gray-900">
                            ₹{variant.variant_price}
                          </span>
                          {variant.variant_old_price && variant.variant_old_price > variant.variant_price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{variant.variant_old_price}
                            </span>
                          )}
                        </div>
                        {variant.variant_stock <= 5 && variant.variant_stock > 0 && (
                          <span className="text-xs text-orange-600">
                            Only {variant.variant_stock} left
                          </span>
                        )}
                        {variant.variant_stock === 0 && (
                          <span className="text-xs text-red-600">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Price - Always show main product price */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            ₹{currentProduct.price}
          </span>
          {currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{currentProduct.oldPrice}
            </span>
          )}
        </div>

        {/* Savings Amount */}
        {currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-green-600">You Save:</span>
            <span className="text-sm font-semibold text-green-600">
              ₹{Math.round(currentProduct.oldPrice - currentProduct.price)}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center mb-3">
          <span className="text-xs sm:text-sm text-gray-500">
            ⭐ {product.rating || 4.5} ({product.reviews || product.review_count || 0} reviews)
          </span>
        </div>

        {/* Action Button */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddToCartButton
            product={product}
            variant={selectedVariant}
            size="default"
            className="w-full"
            showCheckoutButton={false}
          />
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showVariantDropdown && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowVariantDropdown(false)}
        />
      )}
      
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