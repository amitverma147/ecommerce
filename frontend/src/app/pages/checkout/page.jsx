"use client";
import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa6";
import { FiEdit2 } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { FaRegCircle, FaRegDotCircle } from "react-icons/fa";
import { FaRupeeSign } from "react-icons/fa";
import WalletPaymentOption from "@/components/checkout/WalletPaymentOption";
import RazorpayPayment from "@/components/checkout/RazorpayPayment";
import CodPaymentOption from "@/components/checkout/CodPaymentOption";
import { CartContext } from "@/Context/CartContext";
import {
  checkProductDelivery,
  checkCartDeliveryAvailability,
} from "@/api/deliveryApi";

const initialAddresses = [
  {
    id: 1,
    label: "Shubham Home",
    address: "246 Punjabi Bagh, Club road, New Delhi, Delhi-110063",
    mobile: "78544554584",
  },
];

const page = () => {
  const searchParams = useSearchParams();
  const { getCartTotal, cartItems } = useContext(CartContext);

  // Check if this is a direct purchase
  const isDirect = searchParams.get("direct") === "true";
  const directProductId = searchParams.get("productId");
  const directQuantity = parseInt(searchParams.get("quantity")) || 1;
  const directAmount = parseFloat(searchParams.get("amount")) || 0;

  // Address state
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id || null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: "",
    address: "",
    mobile: "",
  });
  const [errors, setErrors] = useState({});

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [orderId] = useState("ORDER_" + Date.now()); // Generate order ID

  // Delivery validation state
  const [deliveryValidation, setDeliveryValidation] = useState({
    isValidating: false,
    isValid: true,
    invalidItems: [],
    validItems: [],
    error: null,
  });
  const [addressPincode, setAddressPincode] = useState("");

  // Delivery date (placeholder logic)
  const deliveryStart = "21 may";
  const deliveryEnd = "22 may";

  // Calculate pricing based on direct purchase or cart
  const calculatePricing = () => {
    if (isDirect) {
      // For direct purchase, we need to get product details
      // Note: This should fetch actual product data including shipping
      return {
        totalMRP: directAmount,
        discountOnMRP: 0,
        shippingCharges: 0, // TODO: Get actual shipping from product data
        totalAmount: directAmount,
      };
    } else {
      // For cart items
      const totalMRP = cartItems.reduce((total, item) => {
        const mrp = item.old_price || item.price;
        return total + mrp * item.quantity;
      }, 0);

      const discountOnMRP = cartItems.reduce((total, item) => {
        const mrp = item.old_price || item.price;
        const discount = mrp - item.price;
        return total + discount * item.quantity;
      }, 0);

      const shippingCharges = cartItems.reduce((total, item) => {
        return total + (item.shipping_amount || 0) * item.quantity;
      }, 0);

      const discountedPrice = totalMRP - discountOnMRP;
      const totalAmount = discountedPrice + shippingCharges;

      return {
        totalMRP,
        discountOnMRP,
        shippingCharges,
        totalAmount,
      };
    }
  };

  const { totalMRP, discountOnMRP, shippingCharges, totalAmount } =
    calculatePricing();

  // Extract pincode from address string (assumes Indian format with 6-digit pincode)
  const extractPincodeFromAddress = (addressString) => {
    const pincodeMatch = addressString.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : null;
  };

  // Validate delivery for selected address
  const validateDeliveryForAddress = async (address) => {
    const pincode = extractPincodeFromAddress(address.address);

    if (!pincode) {
      setDeliveryValidation({
        isValidating: false,
        isValid: false,
        error:
          "Unable to extract pincode from address. Please ensure your address includes a valid 6-digit pincode.",
        invalidItems: [],
        validItems: [],
      });
      return;
    }

    setAddressPincode(pincode);
    setDeliveryValidation((prev) => ({
      ...prev,
      isValidating: true,
      error: null,
    }));

    try {
      if (isDirect && directProductId) {
        // Validate single product for direct purchase
        const response = await checkProductDelivery(directProductId, pincode);

        setDeliveryValidation({
          isValidating: false,
          isValid: response.success && response.data?.is_available,
          error:
            response.success && !response.data?.is_available
              ? `Product not deliverable to ${pincode}`
              : response.error,
          invalidItems:
            response.success && !response.data?.is_available
              ? [directProductId]
              : [],
          validItems:
            response.success && response.data?.is_available
              ? [directProductId]
              : [],
        });
      } else {
        // Validate cart items
        const cartItemsForValidation = cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        }));

        const response = await checkCartDeliveryAvailability(
          cartItemsForValidation,
          0, // latitude - using 0 as placeholder since we're validating by pincode
          0 // longitude - using 0 as placeholder since we're validating by pincode
        );

        if (response.success) {
          setDeliveryValidation({
            isValidating: false,
            isValid: response.undeliverableProductIds?.length === 0,
            error:
              response.undeliverableProductIds?.length > 0
                ? `${response.undeliverableProductIds.length} items in your cart are not deliverable to ${pincode}`
                : null,
            invalidItems: response.undeliverableProductIds || [],
            validItems: response.deliverableProductIds || [],
          });
        } else {
          setDeliveryValidation({
            isValidating: false,
            isValid: false,
            error: response.error || "Failed to validate delivery",
            invalidItems: [],
            validItems: [],
          });
        }
      }
    } catch (error) {
      console.error("Delivery validation error:", error);
      setDeliveryValidation({
        isValidating: false,
        isValid: false,
        error: "Failed to check delivery availability. Please try again.",
        invalidItems: [],
        validItems: [],
      });
    }
  };

  // Validate delivery when selected address changes
  useEffect(() => {
    const selectedAddress = addresses.find(
      (addr) => addr.id === selectedAddressId
    );
    if (selectedAddress) {
      validateDeliveryForAddress(selectedAddress);
    }
  }, [selectedAddressId, addresses, cartItems, isDirect, directProductId]);

  const handlePaymentSuccess = (paymentData) => {
    console.log("Payment successful:", paymentData);
    // Handle successful payment
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // Handle payment error
  };

  // Address form handlers
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };
  const validateFields = () => {
    const newErrors = {};
    if (!newAddress.label.trim()) newErrors.label = "Name required";
    if (!newAddress.address.trim()) newErrors.address = "Address required";
    if (!/^\d{10,}$/.test(newAddress.mobile))
      newErrors.mobile = "Valid mobile required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleAddAddress = () => {
    if (!validateFields()) return;
    const newId =
      addresses.length > 0 ? Math.max(...addresses.map((a) => a.id)) + 1 : 1;
    setAddresses([...addresses, { ...newAddress, id: newId }]);
    setSelectedAddressId(newId);
    setNewAddress({ label: "", address: "", mobile: "" });
    setShowAddForm(false);
    setErrors({});
  };
  const startEditAddress = (id) => {
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      setNewAddress({
        label: addr.label,
        address: addr.address,
        mobile: addr.mobile,
      });
      setEditingAddressId(id);
      setShowEditForm(true);
    }
  };
  const handleSaveEditedAddress = () => {
    if (!validateFields()) return;
    setAddresses(
      addresses.map((a) =>
        a.id === editingAddressId ? { ...a, ...newAddress } : a
      )
    );
    setShowEditForm(false);
    setEditingAddressId(null);
    setNewAddress({ label: "", address: "", mobile: "" });
    setErrors({});
  };
  const handleRemoveAddress = (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (selectedAddressId === id && updated.length > 0)
      setSelectedAddressId(updated[0].id);
    else if (updated.length === 0) setSelectedAddressId(null);
  };

  return (
    <div className="min-h-screen bg-white font-[outfit] px-2 md:px-8 py-6">
      {/* Breadcrumb */}
      <div className="w-full h-auto flex gap-3 lg:gap-5 flex-wrap items-center font-outfit">
        <Link href={"/"} className="p-3 bg-[#2A2A2A] text-white rounded-full">
          <FaArrowLeft size={20} />
        </Link>
        <Link href={"/"} className="text-[#2F294D] font-semibold lg:text-lg">
          Home
        </Link>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#2F294D] font-semibold lg:text-lg">
          Product Categories
        </span>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#2F294D] font-semibold lg:text-lg">
          Single Product
        </span>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#2F294D] font-semibold lg:text-lg">Cart</span>
        <span className="text-[#2F294D] font-semibold">
          <FaAngleRight size={20} />
        </span>
        <span className="text-[#FF7558] font-semibold lg:text-lg">
          Checkout
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-10">
        {/* LEFT SIDE */}
        <div className="w-full lg:w-[65%] flex flex-col gap-8">
          {/* Order Items */}
          {!isDirect && cartItems.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg"
                  >
                    <img
                      src={item.image || "/prod1.png"}
                      alt={item.name}
                      className="w-16 h-16 object-contain bg-gray-50 rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>
                          MRP: ₹{item.old_price || item.price} × {item.quantity}
                        </div>
                        <div>
                          Price: ₹{item.price} × {item.quantity} = ₹
                          {(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div>
                          Shipping: ₹{item.shipping_amount || 0} ×{" "}
                          {item.quantity} = ₹
                          {(
                            (item.shipping_amount || 0) * item.quantity
                          ).toFixed(2)}
                        </div>
                        {item.old_price && item.old_price > item.price && (
                          <div className="text-green-600">
                            Discount: ₹
                            {(
                              (item.old_price - item.price) *
                              item.quantity
                            ).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">
                        ₹
                        {(
                          (item.price + (item.shipping_amount || 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div>
            <h2 className="text-2xl font-bold mb-1">Select Delivery Address</h2>
            <p className="text-gray-500 text-sm my-4">
              Enter Your Delivery Address for smooth order Delivery.
            </p>
            {/* Address Card(s) */}
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`border-2 rounded-3xl px-6 py-5 mb-4 flex flex-col gap-2 relative transition-all ${
                  selectedAddressId === addr.id
                    ? "border-[#222] shadow-[0_2px_8px_#0001]"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedAddressId(addr.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg mb-1">{addr.label}</div>
                    <div className="text-sm text-[#222] leading-snug">
                      {addr.address}
                    </div>
                    <div className="text-sm mt-1">
                      Mobile:{" "}
                      <span className="text-[#FF7558]">{addr.mobile}</span>
                    </div>

                    {/* Delivery validation status for selected address */}
                    {selectedAddressId === addr.id && (
                      <div className="mt-3 p-3 rounded-lg border">
                        {deliveryValidation.isValidating ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">
                              Validating delivery availability...
                            </span>
                          </div>
                        ) : deliveryValidation.isValid ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <span className="text-lg">✅</span>
                            <div>
                              <div className="text-sm font-medium">
                                Delivery Available
                              </div>
                              <div className="text-xs text-gray-600">
                                All items can be delivered to pincode{" "}
                                {addressPincode}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <span className="text-lg">❌</span>
                            <div>
                              <div className="text-sm font-medium">
                                Delivery Issue
                              </div>
                              <div className="text-xs text-gray-700">
                                {deliveryValidation.error}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="mt-1">
                      {selectedAddressId === addr.id ? (
                        <span className="text-[#FF7558] text-xl">
                          <FaRegDotCircle />
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xl">
                          <FaRegCircle />
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    className="bg-[#FF7558] text-white px-5 py-1.5 rounded-2xl text-sm font-semibold flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAddress(addr.id);
                    }}
                  >
                    Remove
                  </button>
                  <button
                    className="border border-gray-300 px-5 py-1.5 rounded-2xl text-sm font-semibold flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditAddress(addr.id);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
            {/* Add new address button or form */}
            {showAddForm ? (
              <div className="border-2 border-gray-300 rounded-3xl px-6 py-5 mb-4 bg-white">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="label"
                    placeholder="Name (e.g. Home, Office)"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.label ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.label}
                    onChange={handleAddressInputChange}
                  />
                  {errors.label && (
                    <span className="text-xs text-red-500">{errors.label}</span>
                  )}
                  <input
                    type="text"
                    name="address"
                    placeholder="Full Address"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.address}
                    onChange={handleAddressInputChange}
                  />
                  {errors.address && (
                    <span className="text-xs text-red-500">
                      {errors.address}
                    </span>
                  )}
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Mobile Number"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.mobile ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.mobile}
                    onChange={handleAddressInputChange}
                  />
                  {errors.mobile && (
                    <span className="text-xs text-red-500">
                      {errors.mobile}
                    </span>
                  )}
                  <div className="flex gap-3 mt-2">
                    <button
                      className="bg-[#FF7558] text-white px-5 py-1.5 rounded-2xl text-sm font-semibold"
                      onClick={handleAddAddress}
                    >
                      Add Address
                    </button>
                    <button
                      className="border border-gray-300 px-5 py-1.5 rounded-2xl text-sm font-semibold"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewAddress({ label: "", address: "", mobile: "" });
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : showEditForm ? (
              <div className="border-2 border-gray-300 rounded-xl px-6 py-5 mb-4 bg-white">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="label"
                    placeholder="Name (e.g. Home, Office)"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.label ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.label}
                    onChange={handleAddressInputChange}
                  />
                  {errors.label && (
                    <span className="text-xs text-red-500">{errors.label}</span>
                  )}
                  <input
                    type="text"
                    name="address"
                    placeholder="Full Address"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.address}
                    onChange={handleAddressInputChange}
                  />
                  {errors.address && (
                    <span className="text-xs text-red-500">
                      {errors.address}
                    </span>
                  )}
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Mobile Number"
                    className={`border rounded-lg px-3 py-2 ${
                      errors.mobile ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newAddress.mobile}
                    onChange={handleAddressInputChange}
                  />
                  {errors.mobile && (
                    <span className="text-xs text-red-500">
                      {errors.mobile}
                    </span>
                  )}
                  <div className="flex gap-3 mt-2">
                    <button
                      className="bg-[#FF7558] text-white px-5 py-1.5 rounded-2xl text-sm font-semibold"
                      onClick={handleSaveEditedAddress}
                    >
                      Save
                    </button>
                    <button
                      className="border border-gray-300 px-5 py-1.5 rounded-2xl text-sm font-semibold"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingAddressId(null);
                        setNewAddress({ label: "", address: "", mobile: "" });
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="w-full border-2 border-gray-300 rounded-3xl px-6 py-4 flex items-center gap-2 text-lg font-semibold text-[#222] bg-white hover:bg-gray-50 transition"
                onClick={() => setShowAddForm(true)}
              >
                <span className="text-2xl text-[#222]">+</span> Add new Address
              </button>
            )}
          </div>
        </div>
        {/* RIGHT SIDE: SUMMARY */}
        <div className="w-full lg:w-[35%] flex-shrink-0">
          <div className="bg-[#232224] text-white rounded-3xl p-6 flex flex-col gap-4 shadow-lg">
            {/* Deliver Between */}
            <div className="bg-white text-[#232224] rounded-xl px-4 py-3 mb-2 flex flex-col gap-1">
              <div className="text-sm font-medium">
                Deliver Between{" "}
                <span className="text-[#FF7558] font-bold pl-1">
                  {deliveryStart} - {deliveryEnd}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {addresses.find((a) => a.id === selectedAddressId)?.address ||
                  ""}
              </div>
            </div>

            {/* Summary Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">
                {isDirect ? "Direct Purchase" : "Order Summary"}
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    Total MRP (
                    {isDirect
                      ? directQuantity
                      : cartItems.reduce(
                          (total, item) => total + item.quantity,
                          0
                        )}{" "}
                    items)
                  </span>
                  <span>₹{totalMRP.toFixed(2)}</span>
                </div>
                {discountOnMRP > 0 && (
                  <div className="flex justify-between">
                    <span>Discount on MRP</span>
                    <span className="text-green-400">
                      - ₹{discountOnMRP.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Product Total</span>
                  <span>₹{(totalMRP - discountOnMRP).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <span>₹{shippingCharges.toFixed(2)}</span>
                </div>
                {isDirect && (
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Direct Purchase</span>
                    <span>Qty: {directQuantity}</span>
                  </div>
                )}
              </div>
              <div className="border-b border-gray-600 my-3"></div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-[#FF7558]">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-2 text-center">
                (Product Total + Shipping Charges)
              </div>
            </div>
          </div>

          {/* Payment Methods - Separate Card */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Choose Payment Method
            </h4>

            {/* Delivery validation warning */}
            {!deliveryValidation.isValid && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold">
                      Cannot proceed with payment
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                      {deliveryValidation.error ||
                        "Please resolve delivery issues before proceeding."}
                    </div>
                    {deliveryValidation.invalidItems.length > 0 && (
                      <div className="text-xs text-red-600 mt-2">
                        Items not deliverable:{" "}
                        {deliveryValidation.invalidItems.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`space-y-4 ${
                !deliveryValidation.isValid
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              {/* Wallet Payment Option */}
              <WalletPaymentOption
                totalAmount={totalAmount}
                orderId={orderId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={!deliveryValidation.isValid}
              />

              {/* Razorpay Payment Option */}
              <RazorpayPayment
                totalAmount={totalAmount}
                orderId={orderId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={!deliveryValidation.isValid}
                customerDetails={{
                  name:
                    addresses.find((a) => a.id === selectedAddressId)?.label ||
                    "Customer",
                  phone:
                    addresses.find((a) => a.id === selectedAddressId)?.mobile ||
                    "9999999999",
                  email: "customer@bigbestmart.com",
                }}
              />

              {/* COD Payment Option */}
              <CodPaymentOption
                totalAmount={totalAmount}
                cartItems={cartItems}
                selectedAddress={addresses.find(
                  (a) => a.id === selectedAddressId
                )}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={!deliveryValidation.isValid}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
