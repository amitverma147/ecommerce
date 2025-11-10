'use client';
import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { CartContext } from '@/Context/CartContext';
import { useRouter } from 'next/navigation';

const BulkOrderModal = ({ isOpen, onClose, product, selectedVariant = null }) => {
  const router = useRouter();
  const { addToCart } = useContext(CartContext);
  const [bulkSettings, setBulkSettings] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(50);

  useEffect(() => {
    if (isOpen && product?.id) {
      fetchBulkSettings();
    }
  }, [isOpen, product, selectedVariant]);

  const fetchBulkSettings = async () => {
    try {
      console.log('Fetching bulk settings for product ID:', product.id, 'variant:', selectedVariant?.id);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://big-best-backend.vercel.app/api';
      const variantParam = selectedVariant ? `?variant_id=${selectedVariant.id}` : '';
      const url = `${apiUrl}/bulk-products/product/${product.id}${variantParam}`;
      console.log('API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('API response:', result);
      
      if (result.success && result.product.bulk_product_settings && result.product.bulk_product_settings.length > 0) {
        const settings = result.product.bulk_product_settings;
        console.log('Bulk settings found:', settings);
        // Convert single setting to array format for compatibility
        setBulkSettings([settings[0]]);
        setSelectedTier(settings[0]);
        setQuantity(settings[0].min_quantity);
      } else {
        console.log('No bulk pricing available for this product/variant');
        setBulkSettings([]);
        setSelectedTier(null);
      }
    } catch (error) {
      console.error('Error fetching bulk settings:', error);
      setBulkSettings([]);
      setSelectedTier(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!bulkSettings) return 0;
    return quantity * bulkSettings.bulk_price;
  };

  const calculateSavings = () => {
    if (!bulkSettings) return 0;
    const regularTotal = quantity * (product.discounted_single_product_price || product.price);
    const bulkTotal = calculateTotal();
    return regularTotal - bulkTotal;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-start justify-end z-50 p-4"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="bg-white rounded-2xl w-96 max-h-[90vh] overflow-y-auto p-6 mt-8 mr-8 shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Bulk Order Discounts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !bulkSettings || bulkSettings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Bulk ordering is not available for this product.</p>
            <p className="text-sm text-gray-500 mb-4">Contact our sales team for bulk pricing inquiries.</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 text-lg font-semibold mb-2">
                <span className="text-2xl">🏪</span>
                <span>{selectedVariant ? 'Variant' : 'Product'} Bulk Pricing Available</span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedVariant ? `${selectedVariant.variant_weight} ${selectedVariant.variant_unit} - ` : ''}
                Choose your preferred bulk option and save more!
              </p>
            </div>

            {/* Professional Pricing Cards */}
            <div className="space-y-3">
              {bulkSettings.map((tier, index) => {
                const savings = product.price - tier.bulk_price;
                const isSelected = selectedTier?.id === tier.id;
                
                return (
                  <div 
                    key={tier.id} 
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 shadow-lg transform scale-[1.02]' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                    }`}
                    onClick={() => {
                      setSelectedTier(tier);
                      setQuantity(tier.min_quantity);
                    }}
                  >
                    {/* Selection Indicator */}
                    <div className="absolute top-3 right-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>

                    {/* Tier Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-blue-100 text-blue-700' :
                        index === 1 ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {tier.tier_name}
                      </div>
                      <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                        {tier.discount_percentage}% OFF
                      </div>
                    </div>

                    {/* Quantity Range */}
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">Quantity Range</div>
                      <div className="text-lg font-bold text-gray-900">
                        {tier.min_quantity} - {tier.max_quantity || '∞'} units
                      </div>
                    </div>

                    {/* Pricing Details */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600">Regular Price</div>
                        <div className="text-lg text-gray-400 line-through">₹{product.price}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Bulk Price</div>
                        <div className="text-xl font-bold text-green-600">₹{tier.bulk_price}</div>
                      </div>
                    </div>

                    {/* Savings Highlight */}
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">You Save Per Unit:</span>
                        <span className="text-lg font-bold text-green-700">₹{savings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-medium text-gray-700">Total Savings ({tier.min_quantity} units):</span>
                        <span className="text-sm font-bold text-green-700">₹{(savings * tier.min_quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Input Section */}
            {selectedTier && (
              <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Selected: {selectedTier.tier_name}</h4>
                  <p className="text-sm text-gray-600">Range: {selectedTier.min_quantity} - {selectedTier.max_quantity || '∞'} units</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-base font-semibold text-gray-800 mb-3 text-center">
                    📝 Enter Your Quantity
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(selectedTier.min_quantity, quantity - 1))}
                      className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-xl text-gray-800 shadow-md transition-all duration-200 hover:scale-105"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Allow empty input for typing
                        if (inputValue === '') {
                          setQuantity('');
                          return;
                        }
                        
                        const newQty = parseInt(inputValue);
                        
                        // Allow any number while typing, validate on blur
                        if (!isNaN(newQty) && newQty >= 0) {
                          setQuantity(newQty);
                        }
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value;
                        let newQty = parseInt(inputValue);
                        
                        // Validate and correct on blur
                        if (isNaN(newQty) || newQty < selectedTier.min_quantity) {
                          newQty = selectedTier.min_quantity;
                        }
                        
                        if (selectedTier.max_quantity && newQty > selectedTier.max_quantity) {
                          newQty = selectedTier.max_quantity;
                        }
                        
                        setQuantity(newQty);
                      }}
                      min={selectedTier.min_quantity}
                      max={selectedTier.max_quantity || 999}
                      className="w-28 px-4 py-3 border-2 border-green-400 rounded-xl text-center text-xl font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-md"
                      placeholder={selectedTier.min_quantity.toString()}
                    />
                    <button
                      onClick={() => {
                        const newQty = quantity + 1;
                        if (!selectedTier.max_quantity || newQty <= selectedTier.max_quantity) {
                          setQuantity(newQty);
                        }
                      }}
                      className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md transition-all duration-200 hover:scale-105"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      Min: {selectedTier.min_quantity} {selectedTier.max_quantity && `• Max: ${selectedTier.max_quantity}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            {selectedTier && quantity >= selectedTier.min_quantity && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-800 mb-1">📋 Order Summary</h4>
                  <p className="text-sm text-gray-600">{selectedTier.tier_name}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-gray-800 font-semibold">Quantity:</span>
                    <span className="font-bold text-lg text-gray-900">{quantity} units</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-gray-800 font-semibold">Bulk Price per unit:</span>
                    <span className="font-bold text-lg text-green-700">₹{selectedTier.bulk_price}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-gray-800 font-semibold">Regular Price per unit:</span>
                    <span className="text-gray-600 line-through text-lg font-medium">₹{product.price}</span>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border-2 border-green-400 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-700">
                        ₹{(selectedTier.bulk_price * quantity).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-green-800 font-semibold">🎉 You Save:</span>
                      <span className="text-xl font-bold text-green-800">
                        ₹{((product.price - selectedTier.bulk_price) * quantity).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm font-bold text-green-800 bg-green-100 px-4 py-2 rounded-full border border-green-300">
                        🏷️ {selectedTier.discount_percentage}% Discount Applied
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 mt-6">
              {!selectedTier ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-2 font-medium">👆 Please select a bulk pricing option above</p>
                </div>
              ) : (
                <>
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      if (quantity < selectedTier.min_quantity) {
                        toast.error(`Minimum quantity required: ${selectedTier.min_quantity}`);
                        return;
                      }
                      const bulkItem = {
                        id: selectedVariant ? `${product.id}_variant_${selectedVariant.id}_bulk_${selectedTier.id}` : `${product.id}_bulk_${selectedTier.id}`,
                        productId: product.id,
                        variantId: selectedVariant?.id || null,
                        name: selectedVariant ? `${product.name} - ${selectedVariant.variant_weight} ${selectedVariant.variant_unit} (Bulk)` : `${product.name} (Bulk)`,
                        price: Number(selectedTier.bulk_price),
                        old_price: selectedVariant ? Number(selectedVariant.variant_old_price || selectedVariant.variant_price) : Number(product.price),
                        shipping_amount: Number(product.shipping_amount) || 0,
                        image: selectedVariant?.variant_image || product.image,
                        quantity: Number(quantity),
                        isBulkOrder: true,
                        isVariant: !!selectedVariant,
                        variant: selectedVariant,
                        bulkPrice: Number(selectedTier.bulk_price),
                        bulkTierName: selectedTier.tier_name || 'Bulk Order',
                        bulkRange: `${selectedTier.min_quantity}-${selectedTier.max_quantity || '∞'} units`,
                        discountPercentage: selectedTier.discount_percentage || 0,
                        weight: selectedVariant ? `${selectedVariant.variant_weight} ${selectedVariant.variant_unit}` : (product.weight || "1 Unit")
                      };
                      addToCart(bulkItem);
                      toast.success(`🎉 Added ${quantity} units to cart! Saved ₹${((product.price - selectedTier.bulk_price) * quantity).toFixed(2)}`);
                      onClose();
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-orange-600 py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-2 border-orange-400 hover:border-orange-500"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl animate-bounce">🛒</span>
                      <div className="flex flex-col items-start">
                        <span className="text-lg font-bold">Add to Cart</span>
                        <span className="text-sm opacity-90">{quantity} Units</span>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl">
                      <span className="text-black font-bold text-base">
                        ₹{(selectedTier.bulk_price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </button>
                  
                  {/* Buy Now Button */}
                  <button
                    onClick={() => {
                      if (quantity < selectedTier.min_quantity) {
                        toast.error(`Minimum quantity required: ${selectedTier.min_quantity}`);
                        return;
                      }
                      
                      try {
                        // Add bulk item to cart first
                        const bulkItem = {
                          id: selectedVariant ? `${product.id}_variant_${selectedVariant.id}_bulk_${selectedTier.id}_${Date.now()}` : `${product.id}_bulk_${selectedTier.id}_${Date.now()}`,
                          productId: product.id,
                          variantId: selectedVariant?.id || null,
                          name: selectedVariant ? `${product.name} - ${selectedVariant.variant_weight} ${selectedVariant.variant_unit} (Bulk)` : `${product.name} (Bulk)`,
                          price: Number(selectedTier.bulk_price),
                          old_price: selectedVariant ? Number(selectedVariant.variant_old_price || selectedVariant.variant_price) : Number(product.price),
                          shipping_amount: Number(product.shipping_amount) || 0,
                          image: selectedVariant?.variant_image || product.image,
                          quantity: Number(quantity),
                          isBulkOrder: true,
                          isVariant: !!selectedVariant,
                          variant: selectedVariant,
                          bulkPrice: Number(selectedTier.bulk_price),
                          bulkTierName: selectedTier.tier_name || 'Bulk Order',
                          bulkRange: `${selectedTier.min_quantity}-${selectedTier.max_quantity || '∞'} units`,
                          discountPercentage: selectedTier.discount_percentage || 0,
                          weight: selectedVariant ? `${selectedVariant.variant_weight} ${selectedVariant.variant_unit}` : (product.weight || "1 Unit")
                        };
                        
                        addToCart(bulkItem);
                        
                        // Calculate total for checkout redirect
                        const basePrice = Number(selectedTier.bulk_price) * Number(quantity);
                        const shippingAmount = Number(product.shipping_amount) || 0;
                        const totalAmount = basePrice + (shippingAmount * quantity);
                        
                        toast.success(`🎉 Added ${quantity} units to cart!`);
                        onClose();
                        
                        // Redirect to checkout page
                        router.push('/pages/checkout');
                        
                      } catch (error) {
                        console.error("Buy now error:", error);
                        toast.error("Failed to process order. Please try again.");
                      }
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-green-600 py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-2 border-green-400 hover:border-green-500"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl animate-pulse">⚡</span>
                      <div className="flex flex-col items-start">
                        <span className="text-lg font-bold">Buy Now</span>
                        <span className="text-sm opacity-90">{quantity} Units</span>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl">
                      <span className="text-black font-bold text-base">
                        ₹{(selectedTier.bulk_price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </button>
                  
                  {/* Additional Info */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold mb-2">
                      <span className="text-lg">💡</span>
                      <span>Quick Order Tips</span>
                    </div>
                    <div className="text-sm text-blue-600 space-y-1">
                      <p>• Add to Cart: Save for later checkout</p>
                      <p>• Buy Now: Instant purchase & payment</p>
                      <p>• Free shipping on bulk orders above ₹500</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOrderModal;