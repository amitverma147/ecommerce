"use client";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { enhancedCartApi } from "@/api/enhancedCart";

export const SafeCartContext = createContext();

export const SafeCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load from localStorage after component mounts
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const storedCartItems = localStorage.getItem("cartItems");
      if (storedCartItems) {
        try {
          setCartItems(JSON.parse(storedCartItems));
        } catch (error) {
          console.warn("Failed to parse cart items from localStorage:", error);
          localStorage.removeItem("cartItems");
        }
      }
      
      // Get current user (you may need to adjust this based on your auth system)
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setCurrentUser(JSON.parse(userData));
        } catch (error) {
          console.warn("Failed to parse user data:", error);
        }
      }
    }
  }, []);

  // Save to localStorage when cartItems change
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems, isHydrated]);

  // Enhanced addToCart with stock management
  const addToCart = async (item) => {
    const quantityToAdd = item.quantity || 1;
    const productId = item.productId || item.id;

    // Stock management for logged-in users
    if (currentUser?.id) {
      try {
        // Check and reserve stock
        const stockCheck = await enhancedCartApi.reserveStock(
          productId, 
          quantityToAdd, 
          currentUser.id
        );
        
        if (!stockCheck.success) {
          toast.error(stockCheck.error || "Product out of stock");
          return;
        }

        // Add to DB cart
        const dbResult = await enhancedCartApi.addToCart(currentUser.id, {
          product_id: productId,
          quantity: quantityToAdd,
          price: item.price,
          shipping_amount: item.shipping_amount || 0
        });

        if (!dbResult.success) {
          // Release stock if DB operation fails
          await enhancedCartApi.releaseStock(productId, quantityToAdd, currentUser.id);
          toast.error(dbResult.error || "Failed to add to cart");
          return;
        }
      } catch (error) {
        console.error("Stock management error:", error);
        // Continue with local cart for offline support
      }
    }

    // Local cart update (existing logic preserved)
    setCartItems((prevCartItems) => {
      const existingItemIndex = prevCartItems.findIndex(
        (cartItem) => cartItem.id === item.id && 
        (cartItem.isBulkOrder === item.isBulkOrder || (!cartItem.isBulkOrder && !item.isBulkOrder))
      );

      let newCartItems;
      if (existingItemIndex !== -1 && !item.isBulkOrder) {
        newCartItems = prevCartItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem
        );
        setLastAction({ type: "update", name: item.name });
      } else {
        newCartItems = [...prevCartItems, { ...item, quantity: quantityToAdd }];
        setLastAction({ type: "add", name: item.name + (item.isBulkOrder ? ' (Bulk)' : '') });
      }

      return newCartItems;
    });
  };

  // Enhanced removeFromCart with stock release
  const removeFromCart = async (item) => {
    const productId = item.productId || item.id;
    
    // Find current item in cart
    const currentItem = cartItems.find(
      (cartItem) =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
    );

    if (!currentItem) return;

    // Release stock for logged-in users
    if (currentUser?.id && currentItem.quantity === 1) {
      try {
        await enhancedCartApi.releaseStock(productId, 1, currentUser.id);
      } catch (error) {
        console.error("Stock release error:", error);
      }
    }

    // Local cart update (existing logic preserved)
    setCartItems((prevCartItems) => {
      const existingItem = prevCartItems.find(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
      );

      if (!existingItem) return prevCartItems;

      if (existingItem.quantity === 1) {
        return prevCartItems.filter(
          (cartItem) =>
            !(
              cartItem.id === item.id &&
              JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
            )
        );
      } else {
        return prevCartItems.map((cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
    });
  };

  // Enhanced deleteFromCart with stock release
  const deleteFromCart = async (item) => {
    const productId = item.productId || item.id;
    const quantityToRelease = item.quantity || 1;

    // Release stock for logged-in users
    if (currentUser?.id) {
      try {
        await enhancedCartApi.releaseStock(productId, quantityToRelease, currentUser.id);
      } catch (error) {
        console.error("Stock release error:", error);
      }
    }

    // Local cart update (existing logic preserved)
    setCartItems((prevCartItems) =>
      prevCartItems.filter(
        (cartItem) =>
          !(
            cartItem.id === item.id &&
            JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
          )
      )
    );
  };

  // Handle toast notifications (existing logic preserved)
  useEffect(() => {
    if (lastAction) {
      if (lastAction.type === "add") {
        toast.success(`${lastAction.name} added to cart successfully!`);
      } else if (lastAction.type === "update") {
        toast.success(`${lastAction.name} quantity updated in cart!`);
      }
      setLastAction(null);
    }
  }, [lastAction]);

  // All other existing functions preserved
  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => {
        const basePrice = item.isBulkOrder ? item.bulkPrice || item.price : item.price;
        const shippingAmount = parseFloat(item.shipping_amount) || 0;
        const itemTotal = (basePrice + shippingAmount) * item.quantity;
        return total + itemTotal;
      },
      0
    );
  };

  const getBulkItemsCount = () => {
    return cartItems.filter(item => item.isBulkOrder).length;
  };

  const hasBulkItems = () => {
    return cartItems.some(item => item.isBulkOrder);
  };

  const getItemQuantity = (itemId) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const updateQuantity = (itemId, newQuantity, maxStock = 999) => {
    if (newQuantity < 1 || newQuantity > maxStock) return;

    setCartItems((prevCartItems) => {
      return prevCartItems.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      );
    });
  };

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
      const item = cartItems.find((cartItem) => cartItem.id === itemId);
      if (item) {
        deleteFromCart(item);
      }
    }
  };

  const isItemInCart = (itemId) => {
    return cartItems.some((cartItem) => cartItem.id === itemId);
  };

  return (
    <SafeCartContext.Provider
      value={{
        cartItems,
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
      }}
    >
      {children}
    </SafeCartContext.Provider>
  );
};