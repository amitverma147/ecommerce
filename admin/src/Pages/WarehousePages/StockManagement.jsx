import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const API_BASE_URL = "http://localhost:8000/api";

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [warehouses, setWarehouses] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [stockModalData, setStockModalData] = useState({
    type: "add", // add, remove, adjust
    product_id: "",
    warehouse_id: "",
    quantity: "",
    reason: "",
  });
  const [transferModalData, setTransferModalData] = useState({
    product_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "",
    reason: "",
  });

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses`);
      setWarehouses(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch warehouses");
      console.error(err);
    }
  }, []);

  // Fetch stock data across all warehouses
  const fetchStockData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/overview`);
      setStockData(response.data);
    } catch (err) {
      setError("Failed to fetch stock data");
      console.error(err);
    }
  }, []);

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/low-stock`);
      setLowStockItems(response.data);
    } catch (err) {
      setError("Failed to fetch low stock items");
      console.error(err);
    }
  }, []);

  // Fetch stock movements/history
  const fetchStockMovements = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/movements`);
      setStockMovements(response.data);
    } catch (err) {
      setError("Failed to fetch stock movements");
      console.error(err);
    }
  }, []);

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (
      !stockModalData.product_id ||
      !stockModalData.warehouse_id ||
      !stockModalData.quantity
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/stock/adjust`, {
        product_id: parseInt(stockModalData.product_id),
        warehouse_id: parseInt(stockModalData.warehouse_id),
        quantity: parseInt(stockModalData.quantity),
        type: stockModalData.type,
        reason: stockModalData.reason,
      });

      setShowStockModal(false);
      setStockModalData({
        type: "add",
        product_id: "",
        warehouse_id: "",
        quantity: "",
        reason: "",
      });

      await fetchStockData();
      await fetchLowStockItems();
      await fetchStockMovements();
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to adjust stock");
      console.error(err);
    }
  };

  // Handle stock transfer
  const handleStockTransfer = async () => {
    if (
      !transferModalData.product_id ||
      !transferModalData.from_warehouse_id ||
      !transferModalData.to_warehouse_id ||
      !transferModalData.quantity
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (
      transferModalData.from_warehouse_id === transferModalData.to_warehouse_id
    ) {
      setError("Source and destination warehouses must be different");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/stock/transfer`, {
        product_id: parseInt(transferModalData.product_id),
        from_warehouse_id: parseInt(transferModalData.from_warehouse_id),
        to_warehouse_id: parseInt(transferModalData.to_warehouse_id),
        quantity: parseInt(transferModalData.quantity),
        reason: transferModalData.reason,
      });

      setShowTransferModal(false);
      setTransferModalData({
        product_id: "",
        from_warehouse_id: "",
        to_warehouse_id: "",
        quantity: "",
        reason: "",
      });

      await fetchStockData();
      await fetchLowStockItems();
      await fetchStockMovements();
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to transfer stock");
      console.error(err);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWarehouses(),
        fetchStockData(),
        fetchLowStockItems(),
        fetchStockMovements(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchWarehouses,
    fetchStockData,
    fetchLowStockItems,
    fetchStockMovements,
  ]);

  // Get stock statistics
  const getStockStats = () => {
    const totalProducts = stockData.length;
    const outOfStockItems = stockData.filter(
      (item) => item.total_stock === 0
    ).length;
    const lowStockCount = lowStockItems.length;
    const totalStockValue = stockData.reduce(
      (sum, item) => sum + item.total_stock * item.product_price,
      0
    );

    return { totalProducts, outOfStockItems, lowStockCount, totalStockValue };
  };

  const stats = getStockStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Stock Management
        </h1>
        <p className="text-gray-600">
          Monitor and manage inventory across all warehouses
        </p>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfStockItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Stock Value
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{stats.totalStockValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowStockModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>📥</span>
          <span>Adjust Stock</span>
        </button>
        <button
          onClick={() => setShowTransferModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Transfer Stock</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", name: "Stock Overview", icon: "📊" },
              {
                id: "low-stock",
                name: "Low Stock Alerts",
                icon: "⚠️",
                count: stats.lowStockCount,
              },
              { id: "movements", name: "Stock Movements", icon: "📈" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === "overview" && (
          <StockOverviewTab
            stockData={stockData}
            warehouses={warehouses}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
        )}
        {activeTab === "low-stock" && (
          <LowStockTab lowStockItems={lowStockItems} />
        )}
        {activeTab === "movements" && (
          <StockMovementsTab stockMovements={stockMovements} />
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <StockModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          data={stockModalData}
          setData={setStockModalData}
          onSubmit={handleStockAdjustment}
          warehouses={warehouses}
          stockData={stockData}
        />
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          data={transferModalData}
          setData={setTransferModalData}
          onSubmit={handleStockTransfer}
          warehouses={warehouses}
          stockData={stockData}
        />
      )}
    </div>
  );
};

// Stock Overview Tab Component
const StockOverviewTab = ({
  stockData,
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
}) => {
  const filteredData = selectedWarehouse
    ? stockData.filter(
        (item) =>
          item.warehouses &&
          item.warehouses.some(
            (w) => w.warehouse_id === parseInt(selectedWarehouse)
          )
      )
    : stockData;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stock Overview</h3>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Warehouse:
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.parent_warehouse_id ? "└─ " : ""}
                {warehouse.name}(
                {warehouse.type === "zonal" ? "Zonal" : "Division"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warehouse Distribution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No stock data available
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{item.product_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.total_stock || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.warehouses && item.warehouses.length > 0 ? (
                        item.warehouses.map((warehouse) => (
                          <span
                            key={warehouse.warehouse_id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {warehouse.warehouse_name}:{" "}
                            {warehouse.stock_quantity}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No warehouse assignments
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        (item.total_stock || 0) === 0
                          ? "bg-red-100 text-red-800"
                          : (item.total_stock || 0) < 10
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {(item.total_stock || 0) === 0
                        ? "Out of Stock"
                        : (item.total_stock || 0) < 10
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹
                    {(
                      (item.total_stock || 0) * item.product_price
                    ).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// PropTypes for StockOverviewTab component
StockOverviewTab.propTypes = {
  stockData: PropTypes.arrayOf(
    PropTypes.shape({
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product_name: PropTypes.string,
      product_price: PropTypes.number,
      total_stock: PropTypes.number,
      warehouses: PropTypes.arrayOf(
        PropTypes.shape({
          warehouse_id: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]),
          warehouse_name: PropTypes.string,
          stock_quantity: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ).isRequired,
  selectedWarehouse: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedWarehouse: PropTypes.func.isRequired,
};

// Low Stock Tab Component
const LowStockTab = ({ lowStockItems }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Low Stock Alerts
      </h3>

      {lowStockItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            All products are well stocked
          </h3>
          <p className="text-gray-500">No low stock alerts at this time.</p>
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
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{item.product_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.warehouse_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.warehouse_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {item.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.stock_quantity === 0
                      ? "Restock immediately"
                      : "Restock soon"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// PropTypes for LowStockTab component
LowStockTab.propTypes = {
  lowStockItems: PropTypes.arrayOf(
    PropTypes.shape({
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product_name: PropTypes.string,
      stock_quantity: PropTypes.number,
      minimum_threshold: PropTypes.number,
      warehouse_name: PropTypes.string,
    })
  ).isRequired,
};

// Stock Movements Tab Component
const StockMovementsTab = ({ stockMovements }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Stock Movements
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warehouse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockMovements.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No stock movements recorded
                </td>
              </tr>
            ) : (
              stockMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movement.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        movement.movement_type === "add"
                          ? "bg-green-100 text-green-800"
                          : movement.movement_type === "remove"
                          ? "bg-red-100 text-red-800"
                          : movement.movement_type === "transfer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {movement.movement_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        movement.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.reason || "No reason provided"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// PropTypes for StockMovementsTab component
StockMovementsTab.propTypes = {
  stockMovements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product_name: PropTypes.string,
      warehouse_name: PropTypes.string,
      type: PropTypes.string,
      quantity: PropTypes.number,
      reason: PropTypes.string,
      created_at: PropTypes.string,
    })
  ).isRequired,
};

// Stock Modal Component
const StockModal = ({
  isOpen,
  onClose,
  data,
  setData,
  onSubmit,
  warehouses,
  stockData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Adjust Stock</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Type
            </label>
            <select
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
              <option value="adjust">Adjust Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={data.product_id}
              onChange={(e) => setData({ ...data, product_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Product</option>
              {stockData.map((item) => (
                <option key={item.product_id} value={item.product_id}>
                  {item.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              value={data.warehouse_id}
              onChange={(e) =>
                setData({ ...data, warehouse_id: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={data.quantity}
              onChange={(e) => setData({ ...data, quantity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <textarea
              value={data.reason}
              onChange={(e) => setData({ ...data, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter reason for adjustment"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Adjust Stock
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes for StockModal component
StockModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    type: PropTypes.string,
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    warehouse_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reason: PropTypes.string,
  }).isRequired,
  setData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ).isRequired,
  stockData: PropTypes.arrayOf(
    PropTypes.shape({
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product_name: PropTypes.string,
    })
  ).isRequired,
};

// Transfer Modal Component
const TransferModal = ({
  isOpen,
  onClose,
  data,
  setData,
  onSubmit,
  warehouses,
  stockData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Transfer Stock</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={data.product_id}
              onChange={(e) => setData({ ...data, product_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Product</option>
              {stockData.map((item) => (
                <option key={item.product_id} value={item.product_id}>
                  {item.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Warehouse
            </label>
            <select
              value={data.from_warehouse_id}
              onChange={(e) =>
                setData({ ...data, from_warehouse_id: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Source Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Warehouse
            </label>
            <select
              value={data.to_warehouse_id}
              onChange={(e) =>
                setData({ ...data, to_warehouse_id: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Destination Warehouse</option>
              {warehouses
                .filter((w) => w.id !== parseInt(data.from_warehouse_id))
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Transfer
            </label>
            <input
              type="number"
              min="1"
              value={data.quantity}
              onChange={(e) => setData({ ...data, quantity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <textarea
              value={data.reason}
              onChange={(e) => setData({ ...data, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter reason for transfer"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Transfer Stock
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes for TransferModal component
TransferModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    from_warehouse_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    to_warehouse_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reason: PropTypes.string,
  }).isRequired,
  setData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ).isRequired,
  stockData: PropTypes.arrayOf(
    PropTypes.shape({
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product_name: PropTypes.string,
    })
  ).isRequired,
};

export default StockManagement;
