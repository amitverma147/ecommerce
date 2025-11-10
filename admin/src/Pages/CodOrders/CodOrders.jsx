import React, { useState, useEffect } from 'react';
import { FaBox, FaClock, FaCheckCircle, FaTruck, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const CodOrders = () => {
  const [codOrders, setCodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://big-best-backend.vercel.app/api';

  useEffect(() => {
    fetchCodOrders();
  }, [currentPage]);

  const fetchCodOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching COD orders from:', `${API_BASE_URL}/cod-orders/all?page=${currentPage}&limit=10`);
      
      const response = await fetch(`${API_BASE_URL}/cod-orders/all?page=${currentPage}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        setCodOrders(result.cod_orders || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch COD orders');
      }
    } catch (err) {
      const errorMessage = err.message.includes('Failed to fetch') 
        ? 'Unable to connect to server. Please check if the backend is running.'
        : `Failed to fetch COD orders: ${err.message}`;
      setError(errorMessage);
      console.error('COD Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      
      const response = await fetch(`${API_BASE_URL}/cod-orders/status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Update response:', result);
      
      if (result.success) {
        // Update local state
        setCodOrders(orders => 
          orders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        alert('Order status updated successfully!');
      } else {
        alert('Failed to update order status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status: ' + error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this COD order? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting COD order:', orderId);
      
      const response = await fetch(`${API_BASE_URL}/cod-orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete response:', result);
      
      if (result.success) {
        // Remove from local state
        setCodOrders(orders => orders.filter(order => order.id !== orderId));
        alert('COD order deleted successfully!');
      } else {
        alert('Failed to delete COD order: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting COD order:', error);
      alert('Failed to delete COD order: ' + error.message);
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
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderModal = ({ order, onClose, onStatusUpdate }) => {
    const [newStatus, setNewStatus] = useState(order.status || 'pending');

    const handleStatusUpdate = () => {
      onStatusUpdate(order.id, newStatus);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">COD Order Details</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <p><strong>Order ID:</strong> #{order.id}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                    {order.status || 'Pending'}
                  </span>
                </p>
                <p><strong>Total Amount:</strong> ₹{order.product_total_price}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p><strong>Name:</strong> {order.user_name}</p>
                <p><strong>Email:</strong> {order.user_email || 'N/A'}</p>
                <p><strong>Address:</strong> {order.user_address}</p>
                <p><strong>Location:</strong> {order.user_location || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Product Information</h3>
              <p><strong>Product:</strong> {order.product_name}</p>
              <p><strong>Product ID:</strong> {order.product_id}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Update Status</h3>
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStatusUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update Status
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 COD Orders Management</h1>
            <p className="text-gray-600">Manage Cash on Delivery orders and track payments</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <div className="text-sm text-green-600 font-medium">Total Orders</div>
              <div className="text-2xl font-bold text-green-700">{codOrders.length}</div>
            </div>
            <button
              onClick={fetchCodOrders}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Connection Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchCodOrders}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {codOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBox className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No COD Orders Found</h3>
          <p className="text-gray-600">COD orders will appear here once customers place them</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📋 COD Orders List</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-100 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    📦 Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    👤 Customer Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    🛍️ Products
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    💰 Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    📊 Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {codOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900 mb-1">
                            #{order.id}
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full inline-block">
                            📅 {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold text-sm">{order.user_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-900 mb-1">
                            {order.user_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            📧 {order.user_email || 'No email provided'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {order.user_location || 'Location not specified'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="max-w-xs">
                        <div className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                          {order.product_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            📦 Qty: {order.quantity}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            🆔 {order.product_id.split(',')[0]}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 mb-1">
                          ₹{order.product_total_price}
                        </div>
                        <div className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">
                          💵 COD Payment
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className={`ml-2 px-3 py-2 inline-flex text-sm font-bold rounded-xl shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors duration-200 hover:scale-105 transform"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200 hover:scale-105 transform"
                          title="Delete Order"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border-2 border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors duration-200 font-medium"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="processing">⚙️ Processing</option>
                          <option value="shipped">🚚 Shipped</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={updateOrderStatus}
        />
      )}
    </div>
  );
};

export default CodOrders;