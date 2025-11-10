import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  getWarehouseProducts,
  updateWarehouseProduct,
  removeProductFromWarehouse,
  getSingleWarehouse,
  getAllProducts,
  addProductToWarehouse,
} from "../../utils/supabaseApi";

// ProductRow Component for better organization
const ProductRow = ({
  item,
  onUpdateStock,
  onRemove,
  getStockStatusColor,
  getStockStatusText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editStock, setEditStock] = useState(item.stock_quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    await onUpdateStock(item.product_id, editStock);
    setIsEditing(false);
    setIsUpdating(false);
  };

  const handleCancel = () => {
    setEditStock(item.stock_quantity);
    setIsEditing(false);
  };

  const handleQuickAdjust = async (adjustment) => {
    const newStock = Math.max(0, item.stock_quantity + adjustment);
    await onUpdateStock(item.product_id, newStock);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.product_name}
          </div>
          {item.delivery_type && (
            <div className="text-xs text-gray-500">
              <span
                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  item.delivery_type === "nationwide"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {item.delivery_type}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ₹{item.product_price}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              value={editStock}
              onChange={(e) => setEditStock(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="text-green-600 hover:text-green-800 text-xs"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {item.stock_quantity}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ✏️
            </button>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(
            item.stock_quantity
          )}`}
        >
          {getStockStatusText(item.stock_quantity)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex space-x-1">
          <button
            onClick={() => handleQuickAdjust(-1)}
            disabled={item.stock_quantity <= 0}
            className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -1
          </button>
          <button
            onClick={() => handleQuickAdjust(1)}
            className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
          >
            +1
          </button>
          <button
            onClick={() => handleQuickAdjust(10)}
            className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
          >
            +10
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => onRemove(item.product_id)}
          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

// PropTypes for ProductRow component
ProductRow.propTypes = {
  item: PropTypes.shape({
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    product_name: PropTypes.string.isRequired,
    product_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    stock_quantity: PropTypes.number.isRequired,
    delivery_type: PropTypes.string,
  }).isRequired,
  onUpdateStock: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  getStockStatusColor: PropTypes.func.isRequired,
  getStockStatusText: PropTypes.func.isRequired,
};

const WarehouseProducts = () => {
  const { id } = useParams(); // warehouse_id
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch warehouse info
  const fetchWarehouse = useCallback(async () => {
    try {
      const result = await getSingleWarehouse(id);
      if (result.success) {
        setWarehouse(result.data);
      } else {
        setError("Failed to fetch warehouse details: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch warehouse details");
      console.error(err);
    }
  }, [id]);

  // Fetch products with stock levels for this warehouse
  const fetchWarehouseProducts = useCallback(async () => {
    try {
      const result = await getWarehouseProducts(id);
      if (result.success) {
        setProducts(result.data || []);
      } else {
        setError("Failed to fetch warehouse products: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch warehouse products");
      console.error(err);
    }
  }, [id]);

  // Fetch all available products
  const fetchAllProducts = async () => {
    console.log("🔄 Fetching all products from Supabase");
    try {
      const result = await getAllProducts();
      if (result.success) {
        setAllProducts(result.products || []);
        console.log(
          "📦 Set allProducts:",
          result.products?.length || 0,
          "products"
        );
      } else {
        console.error("❌ Failed to fetch products:", result.error);
      }
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      setError(
        "Failed to fetch products: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId || !stockQuantity || parseInt(stockQuantity) <= 0) {
      setError("Please select a product and enter valid stock quantity");
      return;
    }
    console.log(selectedProductId);
    try {
      const result = await addProductToWarehouse(id, {
        product_id: selectedProductId,
        stock_quantity: parseInt(stockQuantity),
      });
      if (result.success) {
        setSelectedProductId("");
        setStockQuantity("");
        setError("");
        await fetchWarehouseProducts();
      } else {
        setError("Failed to add product to warehouse: " + result.error);
      }
    } catch (err) {
      setError("Failed to add product to warehouse");
      console.error(err);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    if (newStock < 0) {
      setError("Stock quantity cannot be negative");
      return;
    }

    try {
      const result = await updateWarehouseProduct(id, productId, {
        stock_quantity: parseInt(newStock),
      });
      if (result.success) {
        setError("");
        await fetchWarehouseProducts();
      } else {
        setError("Failed to update stock: " + result.error);
      }
    } catch (err) {
      setError("Failed to update stock");
      console.error(err);
    }
  };

  const handleRemoveProduct = async (productId) => {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this product from the warehouse?"
    );
    if (!confirmRemove) return;

    try {
      const result = await removeProductFromWarehouse(id, productId);
      if (result.success) {
        setError("");
        await fetchWarehouseProducts();
      } else {
        setError("Failed to remove product: " + result.error);
      }
    } catch (err) {
      setError("Failed to remove product");
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      console.log("🔄 Loading warehouse products page for warehouse ID:", id);
      setLoading(true);

      console.log("1️⃣ Fetching warehouse details...");
      await fetchWarehouse();

      console.log("2️⃣ Fetching warehouse products...");
      await fetchWarehouseProducts();

      console.log("3️⃣ Fetching all available products...");
      await fetchAllProducts();

      setLoading(false);
      console.log("✅ All data loaded");
    };
    load();
  }, [id, fetchWarehouse, fetchWarehouseProducts]);

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );

  const getStockStatusColor = (stock) => {
    if (stock === 0) return "text-red-600 bg-red-50";
    if (stock < 10) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock < 10) return "Low Stock";
    return "In Stock";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/warehouselist")}
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline mb-4 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Warehouses
        </button>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {warehouse?.name} - Stock Management
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      warehouse?.type === "zonal"
                        ? "bg-green-500"
                        : "bg-purple-500"
                    }`}
                  ></span>
                  {warehouse?.type === "zonal"
                    ? "Zonal Warehouse"
                    : "Division Warehouse"}
                </span>
                {warehouse?.pincode && (
                  <span>📍 Pincode: {warehouse.pincode}</span>
                )}
                {warehouse?.address && <span>🏢 {warehouse.address}</span>}
              </div>
              {warehouse?.zones && warehouse.zones.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Serves Zones: </span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {warehouse.zones.map((zone) => (
                      <span
                        key={zone.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {zone.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {products.length}
              </div>
              <div className="text-sm text-gray-500">Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Add Product Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ➕ Add Product to Warehouse
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log("🔍 Debug Info:");
                console.log("allProducts.length:", allProducts.length);
                console.log("products.length:", products.length);
                console.log("Sample allProducts:", allProducts.slice(0, 2));
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              🔍 Debug
            </button>
            <button
              onClick={fetchAllProducts}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              🔄 Refresh Products
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
              <span className="ml-2 text-xs text-gray-500">
                ({allProducts.length} total,{" "}
                {
                  allProducts.filter(
                    (product) =>
                      !products.some((p) => p.product_id === product.id)
                  ).length
                }{" "}
                available)
              </span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">
                {allProducts.length === 0
                  ? "No products available (check API connection)"
                  : "Choose a product..."}
              </option>
              {allProducts
                .filter(
                  (product) =>
                    !products.some((p) => p.product_id === product.id)
                )
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.price}
                  </option>
                ))}
            </select>
            {allProducts.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ No products found. Check API connection or refresh.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              placeholder="Enter quantity"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddProduct}
              disabled={!selectedProductId || !stockQuantity}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📦 Warehouse Inventory ({products.length} products)
          </h3>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products in warehouse
            </h3>
            <p className="text-gray-500">
              Add products to start managing inventory for this warehouse.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((item) => (
                  <ProductRow
                    key={item.product_id}
                    item={item}
                    onUpdateStock={handleUpdateStock}
                    onRemove={handleRemoveProduct}
                    getStockStatusColor={getStockStatusColor}
                    getStockStatusText={getStockStatusText}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseProducts;
