"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useContext, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaAngleRight, FaPlay } from "react-icons/fa6";
import { IoStarSharp, IoStarHalfSharp, IoStarOutline, IoChevronDown } from "react-icons/io5";
import { CiCircleCheck } from "react-icons/ci";
import ProductCard from "@/components/homepage/ProductCard";
import CustomerFeedback from "@/components/products/AllReviews";
import { CartContext } from "@/Context/CartContext";
import { productService } from "@/services/productService";
import BulkOrderModal from "@/components/BulkOrder/BulkOrderModal";
import PincodeChecker from "@/components/PincodeChecker";

// Normalize API base so it always includes the `/api` prefix. Accepts
// environment values like `http://localhost:8000` or `http://localhost:8000/api`.
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://big-best-backend.vercel.app/api";

const API_BASE_URL = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : RAW_API_BASE.replace(/\/+$/, "") + "/api";

// Helpful debug log (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("Using API_BASE_URL:", API_BASE_URL);
}

function page() {
  const params = useParams();
  const router = useRouter();

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const productId = params.id;
  const { addToCart, getItemQuantity } = useContext(CartContext);
  const cartQuantity = getItemQuantity(productId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variants, setVariants] = useState([]);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMobileVariants, setShowMobileVariants] = useState(false);
  const [parentCategory, setParentCategory] = useState("Category");
  const [hasBulkPricing, setHasBulkPricing] = useState(false);
  const [bulkSettings, setBulkSettings] = useState(null);

  // Delivery validation states
  const [isDeliverable, setIsDeliverable] = useState(null); // null = not checked, true = available, false = not available
  const [deliveryData, setDeliveryData] = useState(null);
  const [userPincode, setUserPincode] = useState("");

  const tabs = ["Description", "Portion", "Quantity", "FAQ"];
  const [activeTab, setActiveTab] = useState(0);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const tabRefs = useRef([]);

  // Fetch product data and variants
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/productsroute/${productId}`
        );
        const data = await response.json();

        if (data.success) {
          setProduct(data.product);
        } else {
          setError(data.error || "Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    const fetchVariants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/product-variants/product/${productId}/variants`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.variants.length > 0) {
            setVariants(data.variants);
          }
        }
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    };

    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId]);



  // Handle variant selection with notifications
  const handleVariantSelect = (variant) => {
    const previousVariant = selectedVariant;
    
    if (selectedVariant?.id === variant?.id) {
      setSelectedVariant(null); // Unselect if same variant clicked
      setSelectedImageIndex(0); // Reset to first image
      // Show notification for deselection
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
        notification.textContent = 'Variant deselected - showing default product';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    } else {
      setSelectedVariant(variant);
      // Always reset to first image when selecting a variant (which will be variant image if available)
      setSelectedImageIndex(0);
      // Show notification for selection
      if (typeof window !== 'undefined' && variant) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
        notification.innerHTML = `
          <div class="font-semibold">${variant.variant_weight} ${variant.variant_unit} selected</div>
          <div class="text-sm">Price: ₹${variant.variant_price}</div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    }
    
    setShowVariantDropdown(false);
    // Reset quantity to 1 when variant changes
    setQuantity(1);
  };

  // Dynamic pricing and data based on variant selection
  const currentPrice = selectedVariant ? selectedVariant.variant_price : product?.price;
  const currentOldPrice = selectedVariant ? selectedVariant.variant_old_price : (product?.old_price || product?.oldPrice);
  const currentWeight = selectedVariant ? `${selectedVariant.variant_weight} ${selectedVariant.variant_unit}` : (product?.uom || "1 Unit");
  const currentStock = selectedVariant ? selectedVariant.variant_stock : product?.stock;
  const currentImage = selectedVariant?.variant_image_url || product?.image || (product?.images && product?.images[0]) || "/prod1.png";
  const currentShippingAmount = selectedVariant?.shipping_amount || product?.shipping_amount || 0;
  const currentDiscount = selectedVariant ? selectedVariant.variant_discount : (product?.discount || 0);
  
  // Calculate current discount percentage
  const currentDiscountPercentage = currentOldPrice && currentOldPrice > currentPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : currentDiscount || 0;

  // Check bulk pricing settings for the product or variant
  const checkBulkPricing = async () => {
    if (!product || !product.id) return;

    try {
      const variantParam = selectedVariant ? `?variant_id=${selectedVariant.id}` : '';
      const response = await fetch(
        `${API_BASE_URL}/bulk-products/product/${product.id}${variantParam}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product.bulk_product_settings && data.product.bulk_product_settings.length > 0) {
          const settings = data.product.bulk_product_settings[0];
          setHasBulkPricing(settings.is_bulk_enabled);
          setBulkSettings(settings);
        } else {
          setHasBulkPricing(false);
          setBulkSettings(null);
        }
      } else {
        setHasBulkPricing(false);
        setBulkSettings(null);
      }
    } catch (error) {
      console.error("Error checking bulk pricing:", error);
      setHasBulkPricing(false);
      setBulkSettings(null);
    }
  };

  // Fetch related products and parent category when product is loaded
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product || !product.category) return;

      try {
        setRelatedLoading(true);
        const related = await productService.getProductsByCategory(
          product.category
        );
        // Filter out the current product and limit to 5 products
        const filtered = related.filter((p) => p.id !== product.id).slice(0, 5);
        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Error fetching related products:", err);
      } finally {
        setRelatedLoading(false);
      }
    };

    const fetchParentCategory = async () => {
      if (!product || !product.category) return;

      try {
        const categories = await productService.getCategoriesHierarchy();
        const parent =
          categories.find((cat) =>
            cat.subcategories.some((sub) => sub.name === product.category)
          )?.name || "Category";
        setParentCategory(parent);
      } catch (err) {
        console.error("Error fetching parent category:", err);
        setParentCategory("Category");
      }
    };

    fetchRelatedProducts();
    fetchParentCategory();
    checkBulkPricing();
  }, [product, selectedVariant]);

  // Initialize tab refs array
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs]);

  // Update underline position when active tab changes
  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      const { offsetLeft, offsetWidth } = tabRefs.current[activeTab];
      setUnderlineStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (tabRefs.current[activeTab]) {
        const { offsetLeft, offsetWidth } = tabRefs.current[activeTab];
        setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  // Handle delivery status change from pincode checker
  const handleDeliveryStatusChange = (deliverable, data) => {
    setIsDeliverable(deliverable);
    setDeliveryData(data);
  };

  // Handle pincode data change
  const handlePincodeChange = (data) => {
    if (data && data.pincode) {
      setUserPincode(data.pincode);
    }
  };

  // Tab content data
  const tabContents = [
    {
      title: "Product Description",
      content:
        product?.description ||
        "This premium product features high-quality materials and expert craftsmanship. Designed for durability and comfort, it combines style with functionality. Perfect for everyday use, it offers exceptional value and long-lasting performance.",
    },
    {
      title: "Portion Information",
      content:
        "Each serving provides a balanced nutritional profile. The recommended portion size is 200g per meal, containing approximately 250 calories, 20g of protein, 30g of carbohydrates, and 10g of healthy fats.",
    },
    {
      title: "Quantity Details",
      content:
        "Available in multiple package sizes: 1 unit, 3-pack, and 5-pack bundle. Each unit contains 500ml of product. The bulk packages offer discounted pricing and are ideal for frequent users or families.",
    },
    {
      title: "Frequently Asked Questions",
      content:
        "Q: How should I store this product? A: Store in a cool, dry place. Q: What is the return policy? A: We offer 30-day hassle-free returns. Q: Is this product eco-friendly? A: Yes, it's made from 100% recycled materials.",
    },
  ];

  // Create combined media array using useMemo for better performance and reliability
  const mediaItems = useMemo(() => {
    const items = [];
    
    // If variant is selected and has image, show variant image first
    if (selectedVariant?.variant_image_url) {
      items.push({ 
        type: "image", 
        src: selectedVariant.variant_image_url, 
        isVariant: true,
        id: `variant-${selectedVariant.id}`
      });
    }
    
    // Add product images
    if (product?.images && product.images.length > 0) {
      const productImages = product.images.map((img, index) => ({ 
        type: "image", 
        src: img, 
        isVariant: false,
        id: `product-${index}`
      }));
      items.push(...productImages);
    } else if (product?.image) {
      items.push({ 
        type: "image", 
        src: product.image, 
        isVariant: false,
        id: 'product-main'
      });
    }
    
    // Add video if available
    if (product?.video && getYouTubeVideoId(product.video)) {
      items.push({ 
        type: "video", 
        src: product.video, 
        isVariant: false,
        id: 'product-video'
      });
    }
    
    // Ensure we always have at least one image
    if (items.length === 0) {
      items.push({ 
        type: "image", 
        src: "/prod1.png", 
        isVariant: false,
        id: 'fallback'
      });
    }
    
    return items;
  }, [selectedVariant, product]);

  // Reset image index when variant changes to show variant image first
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant?.id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen px-5 lg:px-10 flex flex-col py-8 gap-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-screen px-5 lg:px-10 flex flex-col py-8 gap-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-red-500">
            {error || "Product not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-5 lg:px-10 flex flex-col py-8 gap-10">
      {/* Heading */}
      <div className="w-full h-auto flex gap-3 lg:gap-5 flex-wrap items-center font-outfit">
        <Link href={"/"} className="p-3 bg-[#2A2A2A] text-white rounded-full">
          <FaArrowLeft size={20} />
        </Link>
        <span className="text-[#2F294D] font-semibold lg:text-lg">
          {parentCategory}
        </span>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#2F294D] font-semibold lg:text-lg">
          {product.category || "Category"}
        </span>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#FF7558] font-semibold lg:text-lg">
          {product.name}
        </span>
      </div>
      {/* product details */}
      <div className="w-full h-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Side - Image Gallery */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          {/* Enhanced Main Media Display */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            {mediaItems[selectedImageIndex] ? (
              mediaItems[selectedImageIndex].type === "video" ? (
                <>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                      mediaItems[selectedImageIndex].src
                    )}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(
                      mediaItems[selectedImageIndex].src
                    )}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Product Video"
                  ></iframe>
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    PRODUCT VIDEO
                  </div>
                </>
              ) : (
                <>
                  <Image
                    key={`${mediaItems[selectedImageIndex].id}-${selectedImageIndex}`}
                    src={mediaItems[selectedImageIndex].src}
                    alt={mediaItems[selectedImageIndex].isVariant ? "variant image" : "product image"}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover transition-all duration-300"
                    priority={selectedImageIndex === 0}
                    onError={(e) => {
                      e.target.src = '/prod1.png';
                    }}
                  />
                  {mediaItems[selectedImageIndex].isVariant && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      VARIANT IMAGE
                    </div>
                  )}
                  {selectedVariant && mediaItems[selectedImageIndex].isVariant && (
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                      <div className="text-sm font-medium">
                        {selectedVariant.variant_weight} {selectedVariant.variant_unit}
                      </div>
                      <div className="text-xs text-gray-300">
                        ₹{selectedVariant.variant_price}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div>No media available</div>
                </div>
              </div>
            )}
            
            {/* Image Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : mediaItems.length - 1)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <FaArrowLeft size={16} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex < mediaItems.length - 1 ? selectedImageIndex + 1 : 0)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <FaAngleRight size={16} />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                {selectedImageIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>
          
          {/* Enhanced Thumbnail Gallery */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {mediaItems.map((media, index) => (
              <div
                onClick={() => setSelectedImageIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedImageIndex === index
                    ? "ring-2 ring-[#FF7558] ring-offset-2 shadow-md transform scale-110"
                    : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1 hover:transform hover:scale-105"
                }`}
                key={index}
              >
                {media.type === "video" ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <FaPlay className="text-white" size={14} />
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl text-[8px]">
                      VIDEO
                    </span>
                  </div>
                ) : (
                  <>
                    <Image
                      key={`thumb-${media.id}`}
                      src={media.src || "/prod1.png"}
                      alt="product thumbnail"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/prod1.png';
                      }}
                    />
                    {media.isVariant && (
                      <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl text-[8px] font-bold">
                        VARIANT
                      </span>
                    )}
                  </>
                )}
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-[#FF7558] bg-opacity-20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#FF7558] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Side - Product Details */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 font-outfit">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A] lg:text-4xl">
              {product.name}
              {selectedVariant && (
                <span className="text-lg font-medium text-[#FF7558] ml-2">
                  ({selectedVariant.variant_weight} {selectedVariant.variant_unit})
                </span>
              )}
            </h1>
            <p className="text-[#D9D3D3] font-semibold lg:text-xl">
              {product.category || "Sports & Nutrition"}
            </p>
            <p className="text-[#666666] font-medium text-base lg:text-lg">
              {currentWeight}
              {selectedVariant && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Variant Selected
                </span>
              )}
            </p>
          </div>

          {/* Enhanced Variant Selector */}
          {variants.length > 0 && (
            <div className="w-full bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-800">Choose Size/Quantity:</span>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{currentWeight}</span>
                </div>
                <button
                  onClick={() => setShowMobileVariants(true)}
                  className="md:hidden bg-[#FF7558] text-white px-3 py-1 rounded-lg text-sm font-medium"
                >
                  View All
                </button>
              </div>
              
              <div className="hidden md:grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Desktop Variant Grid */}
                {/* Default Product Option */}
                <button
                  onClick={() => handleVariantSelect(null)}
                  className={`relative p-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    !selectedVariant 
                      ? 'border-[#FF7558] bg-[#FF7558] text-white shadow-lg transform scale-105' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-[#FF7558] hover:shadow-md'
                  } ${
                    product?.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={product?.stock <= 0}
                >
                  <div className="text-center">
                    <div className="font-bold">{product?.uom || "1 Unit"}</div>
                    <div className="text-xs mt-1">₹{product?.price}</div>
                  </div>
                  {!selectedVariant && product?.stock > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      DEFAULT
                    </span>
                  )}
                  {product?.stock <= 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      OUT
                    </span>
                  )}
                </button>

                {/* Variant Options */}
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isPopular = variant.is_default;
                  const savingsAmount = variant.variant_old_price && variant.variant_old_price > variant.variant_price 
                    ? variant.variant_old_price - variant.variant_price 
                    : 0;
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative p-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#FF7558] bg-[#FF7558] text-white shadow-lg transform scale-105' 
                          : 'border-gray-300 bg-white text-gray-700 hover:border-[#FF7558] hover:shadow-md'
                      } ${
                        variant.variant_stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={variant.variant_stock === 0}
                    >
                      <div className="text-center">
                        <div className="font-bold">{variant.variant_weight} {variant.variant_unit}</div>
                        <div className="text-xs mt-1">
                          ₹{variant.variant_price}
                          {variant.variant_old_price && variant.variant_old_price > variant.variant_price && (
                            <span className="line-through text-gray-400 ml-1">₹{variant.variant_old_price}</span>
                          )}
                        </div>
                        {savingsAmount > 0 && (
                          <div className="text-xs text-green-600 font-semibold mt-1">
                            Save ₹{Math.round(savingsAmount)}
                          </div>
                        )}
                      </div>
                      {isPopular && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          POPULAR
                        </span>
                      )}
                      {variant.variant_stock === 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          OUT
                        </span>
                      )}
                      {variant.variant_stock > 0 && variant.variant_stock <= 5 && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {variant.variant_stock} LEFT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile Variant Summary */}
              <div className="md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {/* Default Product Option */}
                  <button
                    onClick={() => handleVariantSelect(null)}
                    className={`flex-shrink-0 px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                      !selectedVariant 
                        ? 'border-[#FF7558] bg-[#FF7558] text-white' 
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {product?.uom || "1 Unit"}
                  </button>
                  
                  {/* First 3 Variants */}
                  {variants.slice(0, 3).map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`flex-shrink-0 px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected 
                            ? 'border-[#FF7558] bg-[#FF7558] text-white' 
                            : 'border-gray-300 bg-white text-gray-700'
                        }`}
                        disabled={variant.variant_stock === 0}
                      >
                        {variant.variant_weight} {variant.variant_unit}
                      </button>
                    );
                  })}
                  
                  {variants.length > 3 && (
                    <button
                      onClick={() => setShowMobileVariants(true)}
                      className="flex-shrink-0 px-4 py-2 border-2 border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium"
                    >
                      +{variants.length - 3} more
                    </button>
                  )}
                </div>
              </div>
              
              {/* Selected Variant Info */}
              {selectedVariant && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-800">Selected: </span>
                      <span className="text-sm font-bold text-blue-900">
                        {selectedVariant.variant_name || `${selectedVariant.variant_weight} ${selectedVariant.variant_unit}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-900">₹{selectedVariant.variant_price}</div>
                      {selectedVariant.variant_old_price && selectedVariant.variant_old_price > selectedVariant.variant_price && (
                        <div className="text-xs text-gray-500 line-through">₹{selectedVariant.variant_old_price}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Stock: {selectedVariant.variant_stock} units available
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Price Section */}
          <div className="w-full bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl lg:text-5xl font-bold text-[#FD5B00]">
                ₹{currentPrice}
              </span>
              {currentOldPrice && currentOldPrice > currentPrice && (
                <span className="text-xl lg:text-2xl text-gray-400 line-through">
                  ₹{currentOldPrice}
                </span>
              )}
              {currentDiscountPercentage > 0 && (
                <span className="bg-[#FD5B00] text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  {currentDiscountPercentage}% OFF
                </span>
              )}
            </div>
            
            {/* Price per unit calculation */}
            {selectedVariant && (
              <div className="text-sm text-gray-600 mb-2">
                Price per {selectedVariant.variant_unit}: ₹{(currentPrice / parseFloat(selectedVariant.variant_weight)).toFixed(2)}
              </div>
            )}
            
            {/* Shipping info */}
            {currentShippingAmount > 0 && (
              <div className="text-sm text-gray-600">
                + ₹{currentShippingAmount} shipping charges
              </div>
            )}
          </div>
          {/* Enhanced Savings Information */}
          {currentOldPrice && currentOldPrice > currentPrice && (
            <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-700 font-bold text-xl">
                    You Save ₹{Math.round(currentOldPrice - currentPrice)}
                  </span>
                  <div className="text-sm text-green-600 mt-1">
                    {selectedVariant ? 'on this variant' : 'on this product'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {currentDiscountPercentage}% OFF
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentShippingAmount > 0 && (
            <div className="w-full bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-[#666666] text-base lg:text-lg">
                  Shipping Charges: +₹{currentShippingAmount}
                </span>
                {selectedVariant && selectedVariant.shipping_amount !== product.shipping_amount && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Variant-specific shipping
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-[#2F294D] lg:text-xl">(Incl. of all taxes)</p>

          <div className="w-full h-auto flex gap-2 items-center flex-wrap">
            {[1, 2, 3, 4, 5].map((star) => {
              if (product.rating >= star) {
                return (
                  <IoStarSharp
                    key={star}
                    size={20}
                    className="text-[#F1D900] lg:size-8"
                  />
                );
              } else if (product.rating >= star - 0.5) {
                return (
                  <IoStarHalfSharp
                    key={star}
                    size={20}
                    className="text-[#F1D900] lg:size-8"
                  />
                );
              } else {
                return (
                  <IoStarOutline
                    key={star}
                    size={20}
                    className="text-[#D9D3D3] lg:size-8"
                  />
                );
              }
            })}
            <span className="text-[#2F294D] font-semibold lg:text-xl">
              {product.rating || 4.0}
            </span>
            <span className="text-[#2F294D] lg:text-xl">
              From {product.review_count || 0} Reviews
            </span>
          </div>

          {/* Pincode Checker for Delivery Validation */}
          <div className="w-full max-w-full overflow-hidden">
            <PincodeChecker
              productId={productId}
              variantId={selectedVariant?.id}
              onDeliveryStatusChange={handleDeliveryStatusChange}
              onPincodeChange={handlePincodeChange}
              showProductCheck={true}
              initialPincode={userPincode}
            />
          </div>

          {/* Enhanced Quantity Selector */}
          <div className="w-full bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <label className="text-lg font-semibold text-gray-800">Quantity:</label>
              <div className="text-sm text-gray-600">
                Max: {currentStock} units
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="w-12 h-12 rounded-xl border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:bg-gray-100 hover:border-[#FF7558] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  className="w-full h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#FF7558] focus:outline-none"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= currentStock) {
                      setQuantity(value);
                    } else if (e.target.value === "") {
                      setQuantity("");
                    }
                  }}
                  onBlur={(e) => {
                    if (quantity === "" || quantity < 1) {
                      setQuantity(1);
                    } else if (quantity > currentStock) {
                      setQuantity(currentStock);
                    }
                  }}
                  min="1"
                  max={currentStock}
                />
                {quantity > currentStock && (
                  <div className="absolute -bottom-6 left-0 text-xs text-red-500">
                    Max {currentStock} available
                  </div>
                )}
              </div>
              <button
                className="w-12 h-12 rounded-xl border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:bg-gray-100 hover:border-[#FF7558] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => quantity < currentStock && setQuantity(quantity + 1)}
                disabled={quantity >= currentStock}
              >
                +
              </button>
            </div>
            
            {/* Quick Quantity Buttons */}
            <div className="flex gap-2 mt-3">
              {[1, 2, 5, 10].filter(num => num <= currentStock).map(num => (
                <button
                  key={num}
                  onClick={() => setQuantity(num)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    quantity === num 
                      ? 'bg-[#FF7558] text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-[#FF7558]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            {/* Total Price Preview */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Price:</span>
                <span className="text-lg font-bold text-[#FF7558]">
                  ₹{(currentPrice * quantity).toLocaleString()}
                </span>
              </div>
              {currentShippingAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                  <span>+ Shipping:</span>
                  <span>₹{currentShippingAmount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Status Indicator */}
          {userPincode && (
            <div className="w-full h-auto flex gap-2 items-center text-sm">
              {isDeliverable ? (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Delivery available to pincode {userPincode}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Delivery not available to pincode {userPincode}</span>
                </div>
              )}
            </div>
          )}

          <div className="w-full h-auto flex flex-row gap-2 items-center">
            <button
              onClick={() => {
                // Check delivery availability
                if (isDeliverable === false) {
                  alert(
                    "This product is not deliverable to your pincode. Please check delivery availability."
                  );
                  return;
                }

                if (isDeliverable === null) {
                  alert(
                    "Please check delivery availability for your pincode first."
                  );
                  return;
                }

                // Check stock availability
                const availableStock = selectedVariant ? selectedVariant.variant_stock : product.stock;
                if (availableStock <= 0) {
                  alert("This item is currently out of stock.");
                  return;
                }

                if (quantity > availableStock) {
                  alert(`Only ${availableStock} items available in stock.`);
                  return;
                }

                const cartItem = {
                  id: selectedVariant ? `${product.id}_variant_${selectedVariant.id}` : product.id || productId,
                  productId: product.id || productId,
                  variantId: selectedVariant?.id || null,
                  name: selectedVariant ? `${product.name} - ${selectedVariant.variant_weight} ${selectedVariant.variant_unit}` : product.name,
                  price: Number(currentPrice),
                  old_price: Number(currentOldPrice || currentPrice * 1.2),
                  shipping_amount: Number(currentShippingAmount),
                  image: currentImage,
                  rating: product.rating || 4.0,
                  reviews: product.review_count || 0,
                  quantity: quantity,
                  variant: selectedVariant ? {
                    id: selectedVariant.id,
                    name: selectedVariant.variant_name,
                    weight: selectedVariant.variant_weight,
                    unit: selectedVariant.variant_unit,
                    price: selectedVariant.variant_price,
                    old_price: selectedVariant.variant_old_price,
                    stock: selectedVariant.variant_stock,
                    image_url: selectedVariant.variant_image_url,
                    discount: selectedVariant.variant_discount
                  } : null,
                  weight: currentWeight,
                  stock: availableStock,
                  isVariant: !!selectedVariant,
                  discount_percentage: currentDiscountPercentage
                };
                addToCart({ ...cartItem, quantity: quantity });
              }}
              disabled={isDeliverable === false || currentStock <= 0}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                currentStock <= 0
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : isDeliverable === true
                  ? "bg-[#FF7558] text-white hover:bg-[#e66a4f]"
                  : isDeliverable === false
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#FF7558] text-white hover:bg-[#e66a4f]"
              }`}
              title={
                currentStock <= 0
                  ? "Out of Stock"
                  : isDeliverable === false
                  ? "Product not deliverable to your pincode"
                  : ""
              }
            >
              {currentStock <= 0
                ? "Out of Stock"
                : isDeliverable === false
                ? "Not Available in Your Area"
                : selectedVariant
                ? `Add ${selectedVariant.variant_weight}${selectedVariant.variant_unit} to Cart ${cartQuantity > 0 ? `(${cartQuantity})` : ""}`
                : `Add to Cart ${cartQuantity > 0 ? `(${cartQuantity})` : ""}`}
            </button>
            <button
              onClick={async () => {
                // Check delivery availability
                if (isDeliverable === false) {
                  alert(
                    "This product is not deliverable to your pincode. Please check delivery availability."
                  );
                  return;
                }

                if (isDeliverable === null) {
                  alert(
                    "Please check delivery availability for your pincode first."
                  );
                  return;
                }

                // Check stock availability
                const availableStock = selectedVariant ? selectedVariant.variant_stock : product.stock;
                if (availableStock <= 0) {
                  alert("This item is currently out of stock.");
                  return;
                }

                if (quantity > availableStock) {
                  alert(`Only ${availableStock} items available in stock.`);
                  return;
                }

                try {
                  // Calculate total amount with GST and shipping
                  const basePrice = Number(currentPrice) * quantity;
                  const gstAmount = basePrice * 0.18; // 18% GST
                  const shippingAmount = Number(product.shipping_amount) || 41;
                  const totalAmount = basePrice + gstAmount + shippingAmount;

                  // Create Razorpay order
                  const response = await fetch(
                    `${API_BASE_URL}/payment/create-order`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount: totalAmount }),
                    }
                  );

                  const orderData = await response.json();

                  if (!orderData.success) {
                    alert("Payment initialization failed");
                    return;
                  }

                  // Initialize Razorpay
                  const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "BigBest Mart",
                    description: `${product.name} - Qty: ${quantity}`,
                    order_id: orderData.order_id,
                    handler: async function (response) {
                      // Payment success - create order
                      try {
                        const orderResponse = await fetch(
                          `${API_BASE_URL}/order/place`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              productId: product.id,
                              quantity: quantity,
                              totalAmount: totalAmount,
                              paymentId: response.razorpay_payment_id,
                              orderId: response.razorpay_order_id,
                            }),
                          }
                        );

                        if (orderResponse.ok) {
                          alert("Order placed successfully!");
                          router.push("/pages/orders");
                        }
                      } catch (error) {
                        console.error("Order creation failed:", error);
                      }
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

                  const rzp = new window.Razorpay(options);
                  rzp.open();
                } catch (error) {
                  console.error("Payment error:", error);
                  alert("Payment failed. Please try again.");
                }
              }}
              disabled={isDeliverable === false || currentStock <= 0}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                currentStock <= 0
                  ? "border border-gray-400 text-gray-400 cursor-not-allowed"
                  : isDeliverable === true
                  ? "border border-[#FF7558] text-[#FF7558] hover:bg-[#FF7558] hover:text-white"
                  : isDeliverable === false
                  ? "border border-gray-300 text-gray-500 cursor-not-allowed"
                  : "border border-[#FF7558] text-[#FF7558] hover:bg-[#FF7558] hover:text-white"
              }`}
              title={
                currentStock <= 0
                  ? "Out of Stock"
                  : isDeliverable === false
                  ? "Product not deliverable to your pincode"
                  : ""
              }
            >
              {currentStock <= 0
                ? "Out of Stock"
                : isDeliverable === false
                ? "Not Deliverable"
                : "Buy Now"}
            </button>
          </div>

          {/* Product Specifications */}
          <div className="w-full h-auto flex flex-col gap-3 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-[#2A2A2A]">
              Product Specifications
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm lg:text-base">
              {product.specifications ? (
                product.specifications.split("\n").map((spec, index) => (
                  <div key={index} className="text-[#2F294D] flex items-center">
                    <span className="w-2 h-2 bg-[#FF7558] rounded-full mr-3 flex-shrink-0"></span>
                    {spec.trim()}
                  </div>
                ))
              ) : (
                <>
                  <div className="text-[#2F294D] flex items-center">
                    <span className="w-2 h-2 bg-[#FF7558] rounded-full mr-3 flex-shrink-0"></span>
                    Electric Wheelchairs/Scooters
                  </div>
                  <div className="text-[#2F294D] flex items-center">
                    <span className="w-2 h-2 bg-[#FF7558] rounded-full mr-3 flex-shrink-0"></span>
                    Solar Power Banks/Storage
                  </div>
                  <div className="text-[#2F294D] flex items-center">
                    <span className="w-2 h-2 bg-[#FF7558] rounded-full mr-3 flex-shrink-0"></span>
                    RV (Recreational Vehicle) or Marine Power Systems
                  </div>
                  <div className="text-[#2F294D] flex items-center">
                    <span className="w-2 h-2 bg-[#FF7558] rounded-full mr-3 flex-shrink-0"></span>
                    Electric Vehicle/E-Bike battery builds
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-auto flex flex-row gap-2 items-center">
            <button
              onClick={() => {
                console.log("Added to wishlist:", product.name);
                // Add wishlist functionality here
              }}
              className={`${
                hasBulkPricing ? "flex-1" : "w-full"
              } bg-red-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors`}
            >
              Add To Wishlist
            </button>
            {hasBulkPricing && (
              <button
                onClick={() => setShowBulkModal(true)}
                disabled={isDeliverable === false || currentStock <= 0}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  currentStock <= 0
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : isDeliverable === true
                    ? "bg-blue-800 text-white hover:bg-blue-900"
                    : isDeliverable === false
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-800 text-white hover:bg-blue-900"
                }`}
                title={
                  currentStock <= 0
                    ? "Bulk order not available - out of stock"
                    : isDeliverable === false
                    ? "Bulk order not available - product not deliverable to your pincode"
                    : ""
                }
              >
                {currentStock <= 0
                  ? "Out of Stock"
                  : isDeliverable === false
                  ? "Not Deliverable"
                  : "Bulk Order"}
              </button>
            )}
          </div>
          {/* Enhanced Stock Display */}
          <div className="w-full bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CiCircleCheck size={24} className={currentStock > 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-[#2F294D] font-semibold lg:text-xl">
                  {currentStock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  currentStock > 10 ? "text-green-600" : 
                  currentStock > 5 ? "text-orange-600" : 
                  currentStock > 0 ? "text-red-600" : "text-gray-500"
                }`}>
                  {currentStock > 0 ? `${currentStock} units available` : "Currently unavailable"}
                </div>
                {selectedVariant && (
                  <div className="text-xs text-gray-500 mt-1">
                    For {selectedVariant.variant_weight} {selectedVariant.variant_unit} variant
                  </div>
                )}
              </div>
            </div>
            
            {/* Stock Level Indicator */}
            {currentStock > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentStock > 10 ? "bg-green-500" : 
                    currentStock > 5 ? "bg-orange-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min((currentStock / 20) * 100, 100)}%` }}
                ></div>
              </div>
            )}
            
            {/* Low Stock Warning */}
            {currentStock > 0 && currentStock <= 5 && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Hurry! Only {currentStock} left in stock
              </div>
            )}
          </div>
          
          {/* Variant Comparison Table */}
          {variants.length > 1 && (
            <div className="w-full bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Compare All Variants</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2 text-blue-800">Size</th>
                      <th className="text-left py-2 text-blue-800">Price</th>
                      <th className="text-left py-2 text-blue-800">Per Unit</th>
                      <th className="text-left py-2 text-blue-800">Stock</th>
                      <th className="text-left py-2 text-blue-800">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Default Product Row */}
                    <tr className={`border-b border-blue-100 ${
                      !selectedVariant ? "bg-blue-100 font-semibold" : "hover:bg-blue-50"
                    }`}>
                      <td className="py-2">{product?.uom || "1 Unit"}</td>
                      <td className="py-2">₹{product?.price}</td>
                      <td className="py-2">-</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product?.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {product?.stock > 0 ? `${product.stock} units` : "Out of stock"}
                        </span>
                      </td>
                      <td className="py-2">-</td>
                    </tr>
                    
                    {/* Variant Rows */}
                    {variants.map((variant) => {
                      const perUnitPrice = (variant.variant_price / parseFloat(variant.variant_weight)).toFixed(2);
                      const savings = variant.variant_old_price && variant.variant_old_price > variant.variant_price 
                        ? variant.variant_old_price - variant.variant_price 
                        : 0;
                      const isSelected = selectedVariant?.id === variant.id;
                      
                      return (
                        <tr key={variant.id} className={`border-b border-blue-100 cursor-pointer ${
                          isSelected ? "bg-blue-100 font-semibold" : "hover:bg-blue-50"
                        }`} onClick={() => handleVariantSelect(variant)}>
                          <td className="py-2">{variant.variant_weight} {variant.variant_unit}</td>
                          <td className="py-2">
                            ₹{variant.variant_price}
                            {variant.variant_old_price && variant.variant_old_price > variant.variant_price && (
                              <span className="line-through text-gray-400 ml-1 text-xs">
                                ₹{variant.variant_old_price}
                              </span>
                            )}
                          </td>
                          <td className="py-2">₹{perUnitPrice}/{variant.variant_unit}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              variant.variant_stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {variant.variant_stock > 0 ? `${variant.variant_stock} units` : "Out of stock"}
                            </span>
                          </td>
                          <td className="py-2">
                            {savings > 0 ? (
                              <span className="text-green-600 font-medium">₹{Math.round(savings)}</span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Click on any row to select that variant
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Section */}
      {/* {product.video && getYouTubeVideoId(product.video) && (
        <div className="w-full h-auto flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-[#2A2A2A]">Product Video</h2>
          <div className="w-full max-w-4xl mx-auto">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                product.video
              )}`}
              title="Product Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      )} */}

      {/* Tabs Section */}
      <div className="w-full h-auto flex flex-col gap-6">
        <div className="w-full h-auto relative">
          <div className="flex gap-8 border-b border-gray-200">
            {tabs.map((tab, index) => (
              <button
                key={index}
                ref={(el) => (tabRefs.current[index] = el)}
                className={`pb-2 text-lg font-semibold transition-colors ${
                  activeTab === index
                    ? "text-[#FF7558]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(index)}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div
            className="absolute bottom-0 h-0.5 bg-[#FF7558] transition-all duration-300"
            style={underlineStyle}
          />
        </div>
        <div className="w-full h-auto">
          <h2 className="text-2xl font-bold text-[#2A2A2A] mb-4">
            {tabContents[activeTab].title}
          </h2>
          <p className="text-[#2F294D] text-lg leading-relaxed">
            {tabContents[activeTab].content}
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="w-full h-auto flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[#2A2A2A]">Customer Reviews</h2>
        <CustomerFeedback productId={productId} />
      </div>

      {/* Related Products */}
      <div className="w-full h-auto flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[#2A2A2A]">Related Products</h2>
        <div className="flex justify-center mt-4 sm:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>←</span>
            <span>Swipe to explore</span>
            <span>→</span>
          </div>
        </div>
        {relatedLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-lg">Loading related products...</div>
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 sm:gap-4 pb-4 w-max">
              {relatedProducts.map((prod, index) => (
                <div
                  key={prod.id || index}
                  className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 flex-shrink-0"
                >
                  <ProductCard
                    product={{
                      id: prod.id,
                      name: prod.name,
                      image: prod.image,
                      price: prod.price,
                      oldPrice: prod.old_price,
                      rating: prod.rating || 4.0,
                      reviews: prod.review_count || 0,
                      category: prod.category,
                      brand: prod.brand,
                      weight: prod.weight || prod.uom,
                    }}
                    onClick={() =>
                      router.push(`/pages/singleproduct/${prod.id}`)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <div className="text-lg text-gray-500">
              No related products found
            </div>
          </div>
        )}
      </div>

      {/* Mobile Variants Bottom Sheet */}
      {showMobileVariants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setShowMobileVariants(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Choose Variant</h3>
                <button
                  onClick={() => setShowMobileVariants(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Default Product Option */}
                <button
                  onClick={() => {
                    handleVariantSelect(null);
                    setShowMobileVariants(false);
                  }}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                    !selectedVariant 
                      ? 'border-[#FF7558] bg-[#FF7558] text-white' 
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{product?.uom || "1 Unit"}</div>
                      <div className="text-sm opacity-75">₹{product?.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Stock: {product?.stock}</div>
                      {!selectedVariant && (
                        <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded mt-1">
                          SELECTED
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                
                {/* All Variants */}
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const savingsAmount = variant.variant_old_price && variant.variant_old_price > variant.variant_price 
                    ? variant.variant_old_price - variant.variant_price 
                    : 0;
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        handleVariantSelect(variant);
                        setShowMobileVariants(false);
                      }}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        isSelected 
                          ? 'border-[#FF7558] bg-[#FF7558] text-white' 
                          : 'border-gray-300 bg-white text-gray-700'
                      } ${
                        variant.variant_stock === 0 ? 'opacity-50' : ''
                      }`}
                      disabled={variant.variant_stock === 0}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{variant.variant_weight} {variant.variant_unit}</div>
                          <div className="text-sm opacity-75">
                            ₹{variant.variant_price}
                            {variant.variant_old_price && variant.variant_old_price > variant.variant_price && (
                              <span className="line-through ml-2">₹{variant.variant_old_price}</span>
                            )}
                          </div>
                          {savingsAmount > 0 && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              Save ₹{Math.round(savingsAmount)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Stock: {variant.variant_stock}</div>
                          {isSelected && (
                            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded mt-1">
                              SELECTED
                            </div>
                          )}
                          {variant.variant_stock === 0 && (
                            <div className="text-xs bg-red-500 text-white px-2 py-1 rounded mt-1">
                              OUT OF STOCK
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Order Modal */}
      <BulkOrderModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        product={product}
        selectedVariant={selectedVariant}
      />
    </div>
  );
}

export default page;
