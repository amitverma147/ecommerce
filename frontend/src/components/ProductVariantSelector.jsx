'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, Package, Tag } from 'lucide-react';

const ProductVariantSelector = ({ productId, onVariantSelect, selectedVariant, onImageChange }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://big-best-backend.vercel.app/api';
      const response = await fetch(`${apiUrl}/variants/product/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setVariants(data.data);
        // PRICE ISOLATION: Only auto-select first variant if explicitly requested
        // This prevents automatic override of main product pricing
        // if (data.data.length > 0 && !selectedVariant) {
        //   onVariantSelect(data.data[0]); // Commented out to preserve main product pricing
        // }
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  const handleVariantSelect = (variant) => {
    // PRICE ISOLATION: Pass variant data without affecting main product pricing
    // The variant object contains independent pricing: price, mrp, stock_quantity
    onVariantSelect(variant);
    
    // Update image if variant has image and callback provided
    if (onImageChange && variant.variant_image_url) {
      onImageChange(variant.variant_image_url);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Choose Size/Variant</span>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <div className="flex items-center gap-2">
            {selectedVariant && (
              <>
                <span className="font-medium">{selectedVariant.variant_value}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>₹{selectedVariant.price}</span>
                  {selectedVariant.mrp > selectedVariant.price && (
                    <span className="line-through text-gray-400">₹{selectedVariant.mrp}</span>
                  )}
                </div>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(variant)}
                className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                  selectedVariant?.id === variant.id ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {variant.variant_image_url && (
                      <img
                        src={variant.variant_image_url}
                        alt={variant.variant_name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <div className="font-medium">{variant.variant_value || variant.variant_name}</div>
                      <div className="text-sm text-gray-600">{variant.variant_name}</div>
                      {variant.weight && (
                        <div className="text-xs text-gray-500">Weight: {variant.weight}kg</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">₹{variant.price}</div>
                    {variant.mrp > variant.price && (
                      <div className="text-sm text-gray-400 line-through">₹{variant.mrp}</div>
                    )}
                    <div className="text-xs text-green-600">
                      {Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)}% OFF
                    </div>
                  </div>
                </div>
                {variant.stock_quantity <= 5 && variant.stock_quantity > 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    Only {variant.stock_quantity} left!
                  </div>
                )}
                {variant.stock_quantity === 0 && (
                  <div className="text-xs text-red-600 mt-1">Out of Stock</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariantSelector;