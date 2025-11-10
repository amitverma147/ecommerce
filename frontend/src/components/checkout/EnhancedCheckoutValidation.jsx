"use client";
import React, { useState, useEffect } from "react";
import { enhancedCartApi } from "@/api/enhancedCart";
import { toast } from "react-toastify";

const EnhancedCheckoutValidation = ({ 
  cartItems, 
  onValidationComplete, 
  onValidationError 
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [priceChanges, setPriceChanges] = useState([]);

  useEffect(() => {
    if (cartItems.length > 0) {
      validateCheckoutData();
    }
  }, [cartItems]);

  const validateCheckoutData = async () => {
    setIsValidating(true);
    try {
      // Step 1: Validate prices with latest DB data
      const priceValidation = await enhancedCartApi.validateCartPrices(cartItems);
      
      if (!priceValidation.success) {
        throw new Error(priceValidation.error || "Price validation failed");
      }

      // Step 2: Check for price changes
      const changes = [];
      if (priceValidation.updated_products) {
        priceValidation.updated_products.forEach(updatedProduct => {
          const cartItem = cartItems.find(item => 
            (item.productId || item.id) === updatedProduct.id
          );
          
          if (cartItem) {
            const oldPrice = parseFloat(cartItem.price);
            const newPrice = parseFloat(updatedProduct.price);
            const oldShipping = parseFloat(cartItem.shipping_amount || 0);
            const newShipping = parseFloat(updatedProduct.shipping_amount || 0);
            
            if (oldPrice !== newPrice || oldShipping !== newShipping) {
              changes.push({
                productId: updatedProduct.id,
                name: cartItem.name,
                oldPrice,
                newPrice,
                oldShipping,
                newShipping,
                quantity: cartItem.quantity
              });
            }
          }
        });
      }

      // Step 3: Check stock availability
      const stockValidation = await enhancedCartApi.getProductsForCart(
        cartItems.map(item => item.productId || item.id)
      );

      const outOfStockItems = [];
      if (stockValidation.success && stockValidation.products) {
        stockValidation.products.forEach(product => {
          const cartItem = cartItems.find(item => 
            (item.productId || item.id) === product.id
          );
          
          if (cartItem && product.stock < cartItem.quantity) {
            outOfStockItems.push({
              ...cartItem,
              availableStock: product.stock,
              requestedQuantity: cartItem.quantity
            });
          }
        });
      }

      // Step 4: Calculate updated totals
      const updatedCartItems = cartItems.map(item => {
        const updatedProduct = priceValidation.updated_products?.find(
          p => p.id === (item.productId || item.id)
        );
        
        if (updatedProduct) {
          return {
            ...item,
            price: parseFloat(updatedProduct.price),
            old_price: parseFloat(updatedProduct.old_price || updatedProduct.price),
            shipping_amount: parseFloat(updatedProduct.shipping_amount || 0),
            stock: parseInt(updatedProduct.stock || 99)
          };
        }
        return item;
      });

      const validationResult = {
        isValid: changes.length === 0 && outOfStockItems.length === 0,
        priceChanges: changes,
        outOfStockItems,
        updatedCartItems,
        originalTotal: calculateTotal(cartItems),
        updatedTotal: calculateTotal(updatedCartItems)
      };

      setValidationResults(validationResult);
      setPriceChanges(changes);

      if (validationResult.isValid) {
        onValidationComplete(validationResult);
      } else {
        onValidationError(validationResult);
      }

    } catch (error) {
      console.error("Checkout validation error:", error);
      onValidationError({ 
        isValid: false, 
        error: error.message || "Validation failed" 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price || 0);
      const shippingAmount = parseFloat(item.shipping_amount || 0);
      return total + ((basePrice + shippingAmount) * item.quantity);
    }, 0);
  };

  const acceptPriceChanges = () => {
    if (validationResults?.updatedCartItems) {
      onValidationComplete({
        ...validationResults,
        isValid: validationResults.outOfStockItems.length === 0,
        priceChangesAccepted: true
      });
    }
  };

  if (isValidating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <div className="font-semibold text-blue-800">Validating Order</div>
            <div className="text-sm text-blue-600">
              Checking latest prices and stock availability...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (validationResults && !validationResults.isValid) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div className="flex-1">
            <div className="font-semibold text-yellow-800 mb-2">
              Order Validation Issues
            </div>
            
            {/* Price Changes */}
            {priceChanges.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-yellow-700 mb-2">
                  Price Updates Detected:
                </div>
                {priceChanges.map((change, index) => (
                  <div key={index} className="text-sm text-yellow-600 mb-1 pl-4">
                    • {change.name}: ₹{change.oldPrice.toFixed(2)} → ₹{change.newPrice.toFixed(2)}
                    {change.oldShipping !== change.newShipping && (
                      <span> (Shipping: ₹{change.oldShipping.toFixed(2)} → ₹{change.newShipping.toFixed(2)})</span>
                    )}
                  </div>
                ))}
                <div className="text-sm font-medium text-yellow-700 mt-2">
                  Total: ₹{validationResults.originalTotal.toFixed(2)} → ₹{validationResults.updatedTotal.toFixed(2)}
                </div>
              </div>
            )}

            {/* Stock Issues */}
            {validationResults.outOfStockItems.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-red-700 mb-2">
                  Stock Issues:
                </div>
                {validationResults.outOfStockItems.map((item, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1 pl-4">
                    • {item.name}: Requested {item.requestedQuantity}, Available {item.availableStock}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {priceChanges.length > 0 && validationResults.outOfStockItems.length === 0 && (
                <button
                  onClick={acceptPriceChanges}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  Accept Price Changes
                </button>
              )}
              <button
                onClick={validateCheckoutData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Refresh Validation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (validationResults?.isValid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <div className="font-semibold text-green-800">Order Validated</div>
            <div className="text-sm text-green-600">
              All prices and stock verified. Ready for checkout.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EnhancedCheckoutValidation;