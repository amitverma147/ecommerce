"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowLeft, FaBox, FaClock, FaCheckCircle, FaTruck } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { codOrdersApi } from "@/api/codOrders";

const CodOrdersPage = () => {
  const [codOrders, setCodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get real authenticated user
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (currentUser?.id) {
      fetchCodOrders();
    }
  }, [currentUser]);

  const fetchCodOrders = async () => {
    if (!currentUser?.id) {
      setError('Please login to view your orders');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await codOrdersApi.getUserCodOrders(currentUser.id);
      
      if (result.success) {
        setCodOrders(result.cod_orders || []);
      } else {
        setError(result.error || 'Failed to fetch COD orders');
      }
    } catch (err) {
      setError('Failed to fetch COD orders');
      console.error('COD Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'shipped':
        return <FaTruck className="text-blue-500" />;
      case 'processing':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaBox className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to login to view your COD orders</p>
          <Link href="/pages/login" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your COD orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <FaArrowLeft className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COD Orders</h1>
            <p className="text-gray-600">Your Cash on Delivery orders</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchCodOrders}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Orders List */}
        {codOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FaBox className="text-gray-300 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No COD Orders Found</h3>
            <p className="text-gray-600 mb-4">You haven't placed any Cash on Delivery orders yet.</p>
            <Link 
              href="/"
              className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {codOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center gap-3 mb-2 md:mb-0">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{order.product_total_price}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {order.products?.image ? (
                        <img 
                          src={order.products.image} 
                          alt={order.product_name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <FaBox className="text-gray-400 text-xl" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{order.product_name}</h4>
                      <p className="text-sm text-gray-600 mb-2">Quantity: {order.quantity}</p>
                      <div className="text-sm text-gray-600">
                        <p><strong>Delivery Address:</strong></p>
                        <p>{order.user_address}</p>
                        {order.user_location && <p>{order.user_location}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      <p><strong>Customer:</strong> {order.user_name}</p>
                      {order.user_email && <p><strong>Email:</strong> {order.user_email}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Track Order
                      </button>
                      <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {codOrders.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{codOrders.length}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {codOrders.filter(o => o.status?.toLowerCase() === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{codOrders.reduce((sum, order) => sum + parseFloat(order.product_total_price || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodOrdersPage;