// src/components/ProductCard2/ProductCard.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
// 🎯 Import the new enquiry creation function
import { addToCart, getProductEnquiryStatus, createSingleProductEnquiry } from "../../utils/supabaseApi"; 
import { FaHeart, FaRegHeart } from "react-icons/fa";

const ProductCard = ({
  product_id,
  id,
  image,
  second_preview_image,
  name,
  old_price,
  price,
  rating,
  uom,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [cartLoading, setCartLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  // 🎯 State to hold all enquiry statuses fetched from the API
  const [enquiryStatuses, setEnquiryStatuses] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 🎯 Use this for the image to be saved
  const displayImage = second_preview_image || image; 
  const actualProductId = product_id || id;
  
  // 🎯 EFFECT: Fetch the enquiry status for all products on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      const { success, productEnquiryStatuses } = await getProductEnquiryStatus();
      if (success) {
        setEnquiryStatuses(productEnquiryStatuses);
      }
    };
    fetchStatuses();
    // NOTE: This function runs once for EVERY single product card, 
    // leading to a performance hit if many cards are rendered.
  }, []);


  // 🎯 DERIVED STATE: Determine if the CURRENT product should show 'ENQUIRY'
  const currentProductStatus = enquiryStatuses.find(
    (p) => p.id === actualProductId
  );
  const isEnquiryProduct = currentProductStatus ? currentProductStatus.enquiry : false;


  // --- Original Cart Logic ---

  const handleAddToCart = async (productIdToUse) => {
    if (!currentUser) {
      alert("Please login to add items to cart.");
      return;
    }
    if (!productIdToUse) return;

    setCartLoading(true);
    try {
      const { success } = await addToCart(currentUser.id, productIdToUse, 1);
      if (success) {
        setCartAdded(true);
        window.dispatchEvent(new Event('cartUpdated'));
        setTimeout(() => setCartAdded(false), 1200);
      }
    } finally {
      setCartLoading(false);
    }
  };

  // 🎯 NEW: Wrapper function for the button click (NOW HANDLES ENQUIRY CREATION)
  const handleButtonClick = async () => { // Made async
    if (!actualProductId) return;
    
    if (!currentUser) {
        alert("Please login to proceed.");
        return;
    }

    if (isEnquiryProduct) {
      // 🎯 ACTION: Create the single product enquiry
        const productDetails = {
            id: actualProductId,
            name: name,
            price: price,
            quantity: 1, 
            // 🎯 ADDED IMAGE TO productDetails object
            image: displayImage, 
        };

        setCartLoading(true); // Use cartLoading state to disable button while submitting
        
        const result = await createSingleProductEnquiry({
            user_id: currentUser.id,
            // Use current user details for the enquiry
            name: currentUser.user_metadata?.name || currentUser.email, 
            email: currentUser.email,
            phone: currentUser.user_metadata?.phone || 'N/A',
            message: `Quick enquiry submitted for product: ${name} (ID: ${actualProductId}).`,
            product: productDetails,
        });

        setCartLoading(false);

        if (result.success) {
            alert("Enquiry submitted! Redirecting to your enquiry history.");
            // 🎯 Navigate to the specified enquiry history page
            navigate(`/enquiry-history`); 
        } else {
            alert(`Failed to submit enquiry: ${result.error}`);
        }

    } else {
      // If ENQUIRY is false, proceed with cart logic
      handleAddToCart(actualProductId);
    }
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden w-full max-w-[140px] h-[210px] flex flex-col">
      {/* 👇 Wishlist Button */}
      <span>
      <button
        onClick={onToggleWishlist}
        disabled={!currentUser}
        className="absolute !min-w-5 top-0 right-0 z-10 bg-opacity-20 rounded-full text-white disabled:opacity-50"
        aria-label="Toggle Wishlist"
        style={{ minHeight: 27 }}
      >
        {isWishlisted ? <FaHeart size={16} className="text-pink-500" /> : <FaRegHeart size={16} />}
      </button>
      </span>

      <Link to={`/product/${actualProductId}`}>
        <div className="w-full h-[140px] bg-gray-300 flex items-center justify-center overflow-hidden">
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/100x100?text=Image";
            }}
          />
        </div>
        <div className="p-3 flex flex-col justify-between flex-grow">
          <div className="mt-auto flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {old_price != 0 && old_price && (
                <span className="line-through text-[10px] text-gray-500">₹{old_price}</span>
              )}
              <span className="text-[10px] font-bold text-black truncate">₹{price}</span>
            </div>
          </div>
          {uom ? (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-600 lineclamp">{uom}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-600 lineclamp">1 Variant</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-black truncate-2 ">{name}</p>
          </div>
        </div>
      </Link>
      <button
        onClick={handleButtonClick}
        disabled={cartLoading || !currentUser} 
        style={{ minHeight: 27 }}
        className={`absolute bottom-17.5 right-0 border-2 rounded-md bg-white w-[65px] !h-5 text-center text-black text-sm font-bold ${
          isEnquiryProduct ? "text-blue-500" : (cartAdded ? "text-green-400" : "text-pink-500")
        }`}
      >
        {/* 🎯 Conditionally render button text */}
        {isEnquiryProduct ? (cartLoading ? "..." : "ENQUIRY") : (cartAdded ? "✔" : "ADD")}
      </button>
    </div>
  );
};

export default ProductCard;