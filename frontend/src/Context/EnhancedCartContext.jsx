"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { enhancedCartApi } from "@/api/enhancedCart";
import { useAuth } from "@/contexts/AuthContext";

export const EnhancedCartContext = createContext();

export const EnhancedCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  const { currentUser } = useAuth();

  // Load from localStorage and sync with DB
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const storedCartItems = localStorage.getItem("cartItems");
      if (storedCartItems) {
        try {
          const parsedItems = JSON.parse(storedCartItems);
          setCartItems(parsedItems);
          
          // Sync with DB if user is logged in
          if (currentUser?.id) {
            syncCartWithDB();
          }
        } catch (error) {
          console.warn("Failed to parse cart items:", error);
          localStorage.removeItem("cartItems");
        }
      } else if (currentUser?.id) {
        // Load from DB if no local cart
        loadCartFromDB();
      }
    }
  }, [currentUser]);

  // Save to localStorage when cartItems change
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems, isHydrated]);

  // Load cart from database
  const loadCartFromDB = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const result = await enhancedCartApi.getUserCart(currentUser.id);
      if (result.success && result.cart_items) {
        const dbCartItems = result.cart_items.map(item => ({
          id: item.product_id,
          productId: item.product_id,
          name: item.products?.name || item.product_name,
          price: parseFloat(item.products?.price || item.price || 0),
          old_price: parseFloat(item.products?.old_price || item.old_price || 0),
          shipping_amount: parseFloat(item.products?.shipping_amount || 0),
          quantity: parseInt(item.quantity || 1),
          image: item.products?.image || item.image,
          stock: parseInt(item.products?.stock || 99),
          weight: item.products?.weight || item.weight
        }));
        setCartItems(dbCartItems);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error("Failed to load cart from DB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync local cart with database
  const syncCartWithDB = async () => {
    if (!currentUser?.id || cartItems.length === 0) return;
    
    try {
      // Validate current prices
      const validation = await enhancedCartApi.validateCartPrices(cartItems);
      if (validation.success && validation.updated_products) {
        const updatedItems = cartItems.map(item => {
          const updatedProduct = validation.updated_products.find(
            p => p.id === (item.productId || item.id)
          );
          if (updatedProduct) {
            const priceChanged = parseFloat(updatedProduct.price) !== parseFloat(item.price);
            if (priceChanged) {
              toast.info(`Price updated for ${item.name}`);
            }
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
        setCartItems(updatedItems);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error("Cart sync failed:", error);
    }
  };

  // Enhanced add to cart with stock management
  const addToCart = async (item) => {
    const quantityToAdd = item.quantity || 1;
    const productId = item.productId || item.id;
    
    // Check stock availability first if user is logged in
    if (currentUser?.id) {
      try {
        // Reserve stock before adding to cart
        const stockReservation = await enhancedCartApi.reserveStock(
          productId, 
          quantityToAdd, 
          currentUser.id
        );
        
        if (!stockReservation.success) {
          toast.error(stockReservation.error || "Product out of stock");
          return;
        }
        
        // Add to DB cart with stock decrease
        const dbResult = await enhancedCartApi.addToCart(currentUser.id, {
          product_id: productId,
          quantity: quantityToAdd,
          price: item.price,
          shipping_amount: item.shipping_amount || 0
        });
        
        if (!dbResult.success) {
          // Release reserved stock if DB operation fails
          await enhancedCartApi.releaseStock(productId, quantityToAdd, currentUser.id);
          toast.error(dbResult.error || "Failed to add to cart");
          return;
        }
        
      } catch (error) {
        console.error("Stock management error:", error);
        toast.warning("Added to cart locally. Stock will be reserved when online.");
      }
    }
    
    // Add to local cart (for immediate UI response)
    setCartItems(prevCartItems => {
      const existingItemIndex = prevCartItems.findIndex(
        cartItem => cartItem.id === item.id && 
        (cartItem.isBulkOrder === item.isBulkOrder || (!cartItem.isBulkOrder && !item.isBulkOrder))
      );

      let newCartItems;
      if (existingItemIndex !== -1 && !item.isBulkOrder) {
        newCartItems = prevCartItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem
        );
      } else {
        newCartItems = [...prevCartItems, { ...item, quantity: quantityToAdd }];
      }

      return newCartItems;
    });

    toast.success(`${item.name} added to cart!`);
  };

  // Enhanced remove from cart
  const removeFromCart = async (item) => {
    setCartItems(prevCartItems => {
      const existingItem = prevCartItems.find(
        cartItem => cartItem.id === item.id &&
        JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
      );

      if (!existingItem) return prevCartItems;

      if (existingItem.quantity === 1) {
        return prevCartItems.filter(
          cartItem => !(
            cartItem.id === item.id &&
            JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
          )
        );
      } else {
        return prevCartItems.map(cartItem =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
    });

    // Sync with DB
    if (currentUser?.id) {
      try {
        const newQuantity = Math.max(0, (item.quantity || 1) - 1);
        if (newQuantity === 0) {
          await enhancedCartApi.removeFromCart(currentUser.id, item.productId || item.id);
        } else {
          await enhancedCartApi.updateCartItem(currentUser.id, item.productId || item.id, newQuantity);
        }
      } catch (error) {
        console.error("Failed to sync cart removal:", error);
      }
    }
  };

  // Enhanced delete from cart with stock release
  const deleteFromCart = async (item) => {
    const productId = item.productId || item.id;
    const quantityToRelease = item.quantity || 1;
    
    // Release stock back to inventory if user is logged in
    if (currentUser?.id) {
      try {
        await enhancedCartApi.removeFromCart(currentUser.id, productId, quantityToRelease);
        // Also release any reserved stock
        await enhancedCartApi.releaseStock(productId, quantityToRelease, currentUser.id);
      } catch (error) {
        console.error("Failed to sync cart deletion:", error);
        toast.warning("Item removed locally. Stock will be released when online.");
      }
    }
    
    // Remove from local cart
    setCartItems(prevCartItems =>
      prevCartItems.filter(
        cartItem => !(
          cartItem.id === item.id &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
        )
      )
    );
  };

  // Enhanced clear cart
  const clearCart = async () => {
    setCartItems([]);
    
    if (currentUser?.id) {
      try {
        await enhancedCartApi.clearCart(currentUser.id);
      } catch (error) {
        console.error("Failed to clear cart in DB:", error);
      }
    }
  };

  // Calculate cart total with latest prices
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.isBulkOrder ? item.bulkPrice || item.price : item.price;
      const shippingAmount = parseFloat(item.shipping_amount) || 0;
      const itemTotal = (basePrice + shippingAmount) * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  // Get item quantity
  const getItemQuantity = (itemId) => {
    const item = cartItems.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  // Update quantity with DB sync
  const updateQuantity = async (itemId, newQuantity, maxStock = 999) => {
    if (newQuantity < 1 || newQuantity > maxStock) return;

    setCartItems(prevCartItems => {
      return prevCartItems.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      );
    });

    // Sync with DB
    if (currentUser?.id) {
      try {
        await enhancedCartApi.updateCartItem(currentUser.id, itemId, newQuantity);
      } catch (error) {
        console.error("Failed to sync quantity update:", error);
      }
    }
  };

  // Other utility functions
  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);
  const isItemInCart = (itemId) => cartItems.some(cartItem => cartItem.id === itemId);
  const getBulkItemsCount = () => cartItems.filter(item => item.isBulkOrder).length;
  const hasBulkItems = () => cartItems.some(item => item.isBulkOrder);

  const increaseQuantity = (itemId, maxStock = 999) => {
    const currentQuantity = getItemQuantity(itemId);
    if (currentQuantity < maxStock) {
      updateQuantity(itemId, currentQuantity + 1, maxStock);
    }
  };

  const decreaseQuantity = (itemId) => {
    const currentQuantity = getItemQuantity(itemId);
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      const item = cartItems.find(cartItem => cartItem.id === itemId);
      if (item) {
        deleteFromCart(item);
      }
    }
  };

  return (
    <EnhancedCartContext.Provider
      value={{
        cartItems,
        isLoading,
        lastSync,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
        getCartTotal,
        getItemQuantity,
        getTotalItems,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        isItemInCart,
        getBulkItemsCount,
        hasBulkItems,
        syncCartWithDB,
        loadCartFromDB
      }}
    >
      {children}
    </EnhancedCartContext.Provider>
  );
};