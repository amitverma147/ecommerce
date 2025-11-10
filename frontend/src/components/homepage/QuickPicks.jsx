"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { productService } from "../../services/productService";
import { CartContext } from "@/Context/CartContext";
import { IoChevronDown } from "react-icons/io5";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://big-best-backend.vercel.app/api";

const QuickPicks = ({ sectionName, sectionDescription }) => {
  const [showBackArrow, setShowBackArrow] = useState(false);
  const [showForwardArrow, setShowForwardArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productVariants, setProductVariants] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});
  const [showVariants, setShowVariants] = useState({});
  const scrollContainerRef = useRef(null);
  const router = useRouter();
  const { addToCart } = useContext(CartContext);

  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowBackArrow(scrollLeft > 10);
      setShowForwardArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [checkScrollButtons]);

  useEffect(() => {
    // Check if Razorpay script is loaded
    const checkRazorpay = () => {
      if (!window.Razorpay) {
        console.log("Razorpay not loaded, retrying...");
        setTimeout(checkRazorpay, 1000);
      } else {
        console.log("Razorpay loaded successfully");
      }
    };
    checkRazorpay();

    const fetchQuickPicks = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching quick picks...");
        const fetchedProducts = await productService.getQuickPicks(30);
        console.log("Fetched products:", fetchedProducts);
        setProducts(fetchedProducts);

        // Fetch variants for each product
        const variantsData = {};
        const selectedData = {};
        for (const product of fetchedProducts) {
          try {
            const response = await fetch(
              `${API_BASE_URL}/product-variants/product/${product.id}/variants`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.variants) {
                variantsData[product.id] = data.variants;
                const defaultVariant =
                  data.variants.find((v) => v.is_default) || data.variants[0];
                selectedData[product.id] = defaultVariant;
              }
            }
          } catch (err) {
            console.error(
              `Error fetching variants for product ${product.id}:`,
              err
            );
          }
        }
        setProductVariants(variantsData);
        setSelectedVariants(selectedData);
      } catch (err) {
        console.error("Error fetching quick picks:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchQuickPicks();
  }, []);

  // Buy Now function
  const handleBuyNow = async (product) => {
    try {
      console.log("Buy Now clicked for product:", product.name);

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        alert("Payment system not loaded. Please refresh the page.");
        return;
      }

      const selectedVariant = selectedVariants[product.id];
      const quantity = 1;
      const price = selectedVariant
        ? selectedVariant.variant_price
        : product.price;
      const basePrice = Number(price) * quantity;
      const gstAmount = basePrice * 0.18;
      const shippingAmount = Number(product.shipping_amount) || 41;
      const totalAmount = basePrice + gstAmount + shippingAmount;

      console.log("Payment calculation:", {
        basePrice,
        gstAmount,
        shippingAmount,
        totalAmount,
      });

      const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const orderData = await response.json();
      console.log("Order creation response:", orderData);

      if (!orderData.success) {
        alert(
          "Payment initialization failed: " +
            (orderData.error || "Unknown error")
        );
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BigBest Mart",
        description: `${product.name} - ${
          selectedVariant ? selectedVariant.variant_weight : "1 Unit"
        }`,
        order_id: orderData.order_id,
        handler: async function (response) {
          console.log("Payment success:", response);
          try {
            const orderResponse = await fetch(`${API_BASE_URL}/order/place`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                quantity: quantity,
                totalAmount: totalAmount,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                variantId: selectedVariant?.id,
              }),
            });

            if (orderResponse.ok) {
              alert("Order placed successfully!");
              router.push("/pages/orders");
            } else {
              console.error("Order creation failed");
              alert("Order creation failed. Please contact support.");
            }
          } catch (error) {
            console.error("Order creation failed:", error);
            alert("Order creation failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled by user");
          },
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#FF7558",
        },
      };

      console.log("Opening Razorpay with options:", options);
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed: " + error.message);
    }
  };

  // Add to Cart function
  const handleAddToCart = (product) => {
    const selectedVariant = selectedVariants[product.id];
    const price = selectedVariant
      ? selectedVariant.variant_price
      : product.price;
    const oldPrice = selectedVariant
      ? selectedVariant.variant_old_price
      : product.old_price;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: Number(price),
      oldPrice: Number(oldPrice || price * 1.2),
      image: product.image || "/prod1.png",
      rating: product.rating || 4.0,
      reviews: product.review_count || 0,
      quantity: 1,
      variant: selectedVariant,
      weight: selectedVariant
        ? selectedVariant.variant_weight
        : product.uom || "1 Unit",
    };
    addToCart(cartItem);
  };

  // Toggle variants dropdown
  const toggleVariants = (productId) => {
    setShowVariants((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Select variant
  const selectVariant = (productId, variant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variant,
    }));
    setShowVariants((prev) => ({
      ...prev,
      [productId]: false,
    }));
  };

  const scrollForward = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollBackward = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  // Touch/drag handlers for mobile
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
    }
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full py-8 sm:py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {sectionName || "Top Picks"}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
              {sectionDescription ||
                "Discover our most popular and trending products"}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={scrollBackward}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-2 border-orange-500 ${
                showBackArrow
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
                  : "bg-white text-gray-400 cursor-not-allowed opacity-50"
              }`}
              disabled={!showBackArrow}
              aria-label="Scroll left"
            >
              <span className="text-lg sm:text-xl font-bold">←</span>
            </button>
            <button
              onClick={scrollForward}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-2 border-orange-500 ${
                showForwardArrow
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
                  : "bg-white text-gray-400 cursor-not-allowed opacity-50"
              }`}
              disabled={!showForwardArrow}
              aria-label="Scroll right"
            >
              <span className="text-lg sm:text-xl font-bold">→</span>
            </button>
          </div>
        </div>

        {/* Products Container */}
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-hide select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            <div className="flex gap-3 sm:gap-4 lg:gap-6 pb-4 w-max">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white shadow-md w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-48 animate-pulse"
                >
                  <div className="h-32 sm:h-36 md:h-40 lg:h-44 bg-gray-200"></div>
                  <div className="p-3 sm:p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p>{error}</p>
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 lg:gap-6 pb-4 w-max">
              {products.map((product, idx) => {
                const selectedVariant = selectedVariants[product.id];
                const variants = productVariants[product.id] || [];
                const hasVariants = variants.length > 0;
                // ALWAYS show original product pricing on card display
                const displayPrice = product.price;
                const displayOldPrice = product.old_price;
                const displayWeight = selectedVariant
                  ? selectedVariant.variant_weight
                  : product.uom || "1 Unit";
                const inStock = selectedVariant
                  ? selectedVariant.variant_stock > 0
                  : product.stock > 0;

                return (
                  <div
                    key={product.id || idx}
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 group flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 transform hover:scale-[1.02] hover:-translate-y-1 relative rounded-lg ${showVariants[product.id] ? 'overflow-visible' : 'overflow-hidden'}`}
                  >
                    {/* Product Image */}
                    <div
                      className="h-32 sm:h-36 md:h-40 lg:h-44 bg-gray-50 ml-1 mt-1 overflow-hidden relative cursor-pointer"
                      onClick={() =>
                        router.push(`/pages/singleproduct/${product.id}`)
                      }
                    >
                      <Image
                        src={product.image || "/placeholder.png"}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="object-contain w-full h-full p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                   

                      {/* Out of Stock Overlay */}
                      {!inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3 sm:p-4">

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
                        onClick={() =>
                          router.push(`/pages/singleproduct/${product.id}`)
                        }
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
                          {displayWeight}
                        </span>
                        {hasVariants && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVariants(product.id);
                            }}
                            className="p-1 hover:bg-green-50 rounded-full transition-all duration-200"
                          >
                            <IoChevronDown
                              className={`w-3 h-3 text-green-600 transition-all duration-300 ${
                                showVariants[product.id] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Price - ALWAYS show original product pricing */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          ₹{product.price}
                        </span>
                        {product.old_price && product.old_price > product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.old_price}
                          </span>
                        )}
                      </div>

                        {/* Savings Amount - Based on original product pricing */}
                        {product.old_price && product.old_price > product.price && (
                          <div className="flex flex-col mb-1">
                            <div className="text-xs text-green-600">
                              You Save:
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              ₹{Math.round(product.old_price - product.price)} ({Math.round(((product.old_price - product.price) / product.old_price) * 100)}% Off)
                            </div>
                          </div>
                        )}

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <span className="text-xs sm:text-sm text-gray-500">
                          ⭐ {product.rating || 4.5} (
                          {product.review_count || 0} reviews)
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={!inStock}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs py-2 rounded font-medium transition-colors"
                      >
                        ADD TO CART
                      </button>
                    </div>

                    {/* Variants Bottom Overlay - Same as New Arrivals */}
                    {showVariants[product.id] && hasVariants && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-b-lg shadow-lg border border-gray-100 p-2 overflow-hidden z-50 animate-slide-up">
                        {/* Header with Close Button */}
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-gray-800 font-medium text-[9px] sm:text-[10px]">Choose Pack Size</h3>
                          <button 
                            onClick={() => toggleVariants(product.id)} 
                            className="text-gray-500 hover:text-gray-700 p-0.5"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {/* Pack Sizes */}
                        <div className="space-y-0.5">
                          {variants.map((variant) => {
                            const variantDiscount = variant.variant_old_price && variant.variant_old_price > variant.variant_price
                              ? Math.round(((variant.variant_old_price - variant.variant_price) / variant.variant_old_price) * 100)
                              : 0;
                            
                            return (
                              <div
                                key={variant.id}
                                className="flex justify-between items-center border rounded-lg p-1 hover:bg-green-50 transition"
                              >
                                <div>
                                  <p className="text-[8px] sm:text-[9px] font-medium text-gray-500">{variant.variant_weight}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-900 font-bold text-[9px] sm:text-[10px]">₹{variant.variant_price}</span>
                                    {variant.variant_old_price && (
                                      <span className="text-gray-500 line-through text-[8px] sm:text-[9px]">₹{variant.variant_old_price}</span>
                                    )}
                                  </div>
                                  {variantDiscount > 0 && (
                                    <div className="bg-green-100 text-green-700 text-[7px] sm:text-[8px] font-medium px-0.5 py-0.5 rounded-md inline-block mt-0.5">
                                      Save ₹{(variant.variant_old_price - variant.variant_price).toFixed(0)}
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => selectVariant(product.id, variant)}
                                  disabled={variant.variant_stock === 0}
                                  className={`text-[7px] px-1 py-0.5 rounded hover:bg-green-700 transition ${
                                    variant.variant_stock === 0
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-green-600 text-white"
                                  }`}
                                >
                                  {variant.variant_stock === 0 ? "Out of Stock" : "Add"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-4 sm:mt-6">
          <div className="flex gap-1">
            {Array.from({ length: Math.ceil(products.length / 3) }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i ===
                  Math.floor(
                    scrollContainerRef.current?.scrollLeft /
                      (scrollContainerRef.current?.clientWidth * 0.8) || 0
                  )
                    ? "bg-orange-500 scale-125"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default QuickPicks;
