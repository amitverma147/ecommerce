import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  Title,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  Button,
  FileInput,
  Group,
  Switch,
  LoadingOverlay,
  MultiSelect,
  Radio,
  Text,
  Divider,
  Badge,
} from "@mantine/core";
import { getAllCategories } from "../../utils/supabaseApi";
import {
  fetchWarehouses,
  createProductWithWarehouse,
} from "../../utils/warehouseApi";
import { Link } from "react-router-dom";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    price: 0,
    old_price: 0,
    discount: 0,
    stock: 0,
    category_id: "",
    description: "",
    specifications: "",
    image: null,
    rating: 0,
    review_count: 0,
    featured: false,
    popular: false,
    in_stock: true,
    active: true,
    shipping_amount: 0,
    weight_value: "",
    weight_unit: "kg",
    weight_display: "",
    brand_name: "",
    store_id: "",
    product_type: "nationwide", // New: nationwide, zonal, perishable
    // Warehouse mapping settings
    warehouse_mapping_type: "auto_zonal_to_division",
    assigned_warehouse_ids: [],
    // Enhanced fallback system
    primary_warehouses: [], // Zonal warehouses (first priority)
    fallback_warehouses: [], // Division warehouses (fallback)
    enable_fallback: true,
    warehouse_notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [storeOptions, setStoreOptions] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

  // Warehouse management state
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [zonalWarehouses, setZonalWarehouses] = useState([]);
  const [divisionWarehouses, setDivisionWarehouses] = useState([]);

  React.useEffect(() => {
    console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);

    async function fetchCategories() {
      setCategoriesLoading(true);
      const result = await getAllCategories();
      setCategoriesLoading(false);
      if (result.success) {
        setCategoryOptions(
          result.categories.map((cat) => ({ value: cat.id, label: cat.name }))
        );
      }
    }

    async function fetchBrands() {
      setBrandsLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${apiUrl}/brand/list`);
        console.log("Brands API Response:", response.data);
        if (response.data.success && response.data.brands) {
          setBrandOptions(
            response.data.brands.map((brand) => ({
              value: brand.name,
              label: brand.name,
            }))
          );
        } else {
          console.warn("No brands found or invalid response structure");
          setBrandOptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
        setBrandOptions([]);
      } finally {
        setBrandsLoading(false);
      }
    }

    async function fetchStores() {
      setStoresLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${apiUrl}/recommended-stores/list`);
        console.log("Stores API Response:", response.data);
        if (response.data.success && response.data.recommendedStores) {
          setStoreOptions(
            response.data.recommendedStores.map((store) => ({
              value: store.id.toString(),
              label: store.name,
            }))
          );
        } else {
          console.warn("No stores found or invalid response structure");
          setStoreOptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch stores:", error);
        setStoreOptions([]);
      } finally {
        setStoresLoading(false);
      }
    }

    async function fetchWarehousesData() {
      console.log("🔄 Starting warehouse fetch in AddProduct...");
      setWarehousesLoading(true);
      try {
        console.log("📡 Calling fetchWarehouses API...");
        // Fetch all warehouses
        const allWarehousesResult = await fetchWarehouses();
        console.log("📦 Warehouse API result:", allWarehousesResult);

        if (allWarehousesResult.success) {
          const allWarehouses = allWarehousesResult.warehouses;
          console.log("✅ Raw warehouses data:", allWarehouses);

          // Create warehouse select options with hierarchy information
          const warehouseSelectOptions = allWarehouses.map((warehouse) => ({
            value: warehouse.id.toString(),
            label: `${warehouse.parent_warehouse_id ? "└─ " : ""}${
              warehouse.name
            } (${warehouse.type})`,
            type: warehouse.type,
            parent_warehouse_id: warehouse.parent_warehouse_id,
          }));
          setWarehouseOptions(warehouseSelectOptions);

          // Separate zonal and division warehouses
          const zonalWarehouses = allWarehouses.filter(
            (w) => w.type === "zonal"
          );
          const divisionWarehouses = allWarehouses.filter(
            (w) => w.type === "division"
          );

          setZonalWarehouses(zonalWarehouses);
          setDivisionWarehouses(divisionWarehouses);

          console.log("🏗️ Warehouses separated and state updated:", {
            total: allWarehouses.length,
            zonal: zonalWarehouses.length,
            division: divisionWarehouses.length,
            zonalNames: zonalWarehouses.map((w) => w.name),
            divisionNames: divisionWarehouses.map((w) => w.name),
          });
        } else {
          console.error(
            "❌ Warehouse fetch failed:",
            allWarehousesResult.error
          );
        }
      } catch (error) {
        console.error("💥 Exception during warehouse fetch:", error);
        setWarehouseOptions([]);
        setDivisionWarehouses([]);
        setZonalWarehouses([]);
      } finally {
        setWarehousesLoading(false);
        console.log("🏁 Warehouse loading finished");
      }
    }

    fetchCategories();
    fetchBrands();
    fetchStores();
    fetchWarehousesData();
  }, []);

  // Refresh warehouses when warehouse mapping type changes
  React.useEffect(() => {
    if (form.warehouse_mapping_type) {
      console.log(
        "Warehouse mapping type changed to:",
        form.warehouse_mapping_type
      );
      // Small delay to allow UI to update before refreshing
      setTimeout(() => {
        refreshWarehousesData();
      }, 100);
    }
  }, [form.warehouse_mapping_type]);

  // Function to refresh warehouse data
  const refreshWarehousesData = async () => {
    setWarehousesLoading(true);
    try {
      const allWarehousesResult = await fetchWarehouses();
      if (allWarehousesResult.success) {
        const allWarehouses = allWarehousesResult.warehouses;

        // Create warehouse select options with hierarchy information
        const warehouseSelectOptions = allWarehouses.map((warehouse) => ({
          value: warehouse.id.toString(),
          label: `${warehouse.parent_warehouse_id ? "└─ " : ""}${
            warehouse.name
          } (${warehouse.type})`,
          type: warehouse.type,
          parent_warehouse_id: warehouse.parent_warehouse_id,
        }));
        setWarehouseOptions(warehouseSelectOptions);

        // Separate zonal and division warehouses
        const zonalWarehouses = allWarehouses.filter((w) => w.type === "zonal");
        const divisionWarehouses = allWarehouses.filter(
          (w) => w.type === "division"
        );

        setZonalWarehouses(zonalWarehouses);
        setDivisionWarehouses(divisionWarehouses);

        console.log("Warehouses refreshed:", {
          total: allWarehouses.length,
          zonal: zonalWarehouses.length,
          division: divisionWarehouses.length,
        });
      }
    } catch (error) {
      console.error("Failed to refresh warehouses:", error);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // If warehouse mapping type changes, refresh warehouses to get latest data
    if (field === "warehouse_mapping_type") {
      refreshWarehousesData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.category_id) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    // Convert 'active' boolean to a boolean value for Supabase
    const payload = { ...form };

    // Convert warehouse IDs to integers for database compatibility
    if (
      payload.assigned_warehouse_ids &&
      Array.isArray(payload.assigned_warehouse_ids)
    ) {
      payload.assigned_warehouse_ids = payload.assigned_warehouse_ids.map(
        (id) => parseInt(id, 10)
      );
    }

    // Convert primary warehouse IDs to integers
    if (
      payload.primary_warehouses &&
      Array.isArray(payload.primary_warehouses)
    ) {
      payload.primary_warehouses = payload.primary_warehouses.map((id) =>
        parseInt(id, 10)
      );
    }

    // Convert fallback warehouse IDs to integers
    if (
      payload.fallback_warehouses &&
      Array.isArray(payload.fallback_warehouses)
    ) {
      payload.fallback_warehouses = payload.fallback_warehouses.map((id) =>
        parseInt(id, 10)
      );
    }

    // Ensure enable_fallback is boolean
    payload.enable_fallback = Boolean(payload.enable_fallback);

    // Map UI warehouse types to backend-compatible format
    const originalMappingType = payload.warehouse_mapping_type;
    console.log("🔄 Mapping warehouse type:", originalMappingType);

    switch (payload.warehouse_mapping_type) {
      case "auto_zonal_to_division":
        payload.warehouse_mapping_type = "nationwide";
        payload.auto_distribute_to_zones = true;
        console.log("✅ Mapped auto_zonal_to_division → nationwide");
        break;
      case "selective_zonal":
        payload.warehouse_mapping_type = "zonal_with_fallback";
        payload.auto_distribute_to_zones = false;
        console.log("✅ Mapped selective_zonal → zonal_with_fallback");
        break;
      case "zonal_only":
        payload.warehouse_mapping_type = "zonal";
        payload.auto_distribute_to_zones = false;
        payload.enable_fallback = false;
        console.log("✅ Mapped zonal_only → zonal");
        break;
      default:
        payload.auto_distribute_to_zones = false;
        console.log("⚠️ No mapping applied for:", originalMappingType);
    }

    console.log(
      "📦 Final warehouse mapping type:",
      payload.warehouse_mapping_type
    );

    // Add warehouse-specific fields for enhanced backend
    payload.initial_stock = parseInt(payload.stock) || 100;
    payload.zone_distribution_quantity = 50;

    // Debug: Log final payload before API call
    console.log(
      "📡 Final payload being sent to API:",
      JSON.stringify(
        {
          name: payload.name,
          warehouse_mapping_type: payload.warehouse_mapping_type,
          primary_warehouses: payload.primary_warehouses,
          fallback_warehouses: payload.fallback_warehouses,
          enable_fallback: payload.enable_fallback,
          auto_distribute_to_zones: payload.auto_distribute_to_zones,
        },
        null,
        2
      )
    );

    // Use the enhanced warehouse-aware product creation
    const result = await createProductWithWarehouse(payload);
    setLoading(false);
    if (result.success) {
      console.log(
        "Product created with warehouse assignments:",
        result.warehouse_assignments
      );
      navigate("/products");
    } else {
      setError(result.error || "Failed to add product");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card shadow="sm" p="lg" radius="md" className="max-w-xl mx-auto">
        <Title order={2} className="mb-6">
          Add New Product
        </Title>

        {/* Debug info - remove in production */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
          <strong>Debug Info:</strong>
          <br />
          Warehouses Loading: {warehousesLoading ? "Yes" : "No"}
          <br />
          Warehouse Options: {warehouseOptions.length}
          <br />
          Stores Loading: {storesLoading ? "Yes" : "No"}
          <br />
          Store Options: {storeOptions.length}
          <br />
          Division Warehouses: {divisionWarehouses.length}
          <br />
          Zonal Warehouses: {zonalWarehouses.length}
          <br />
          Warehouse Strategy: {form.warehouse_mapping_type}
          <br />
          Selected Zonal: {form.primary_warehouses.length}
          <br />
          Selected Division Fallback: {form.fallback_warehouses.length}
          <br />
          Fallback Enabled: {form.enable_fallback ? "Yes" : "No"}
          <br />
          Initial Stock: {form.stock || 100} units
        </div>
        <form onSubmit={handleSubmit}>
          {/* Removed unsupported overlayBlur prop */}
          <LoadingOverlay visible={loading} />
          <TextInput
            label="Product Name"
            placeholder="Enter product name"
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mb-4"
          />
          <NumberInput
            label="Price"
            placeholder="Enter price"
            required
            value={form.price}
            onChange={(value) => handleChange("price", value)}
            min={0}
            className="mb-4"
          />
          <NumberInput
            label="Old Price"
            placeholder="Enter old price (optional)"
            value={form.old_price}
            onChange={(value) => handleChange("old_price", value)}
            min={0}
            className="mb-4"
          />
          <NumberInput
            label="Discount (%)"
            placeholder="Enter discount percent (optional)"
            value={form.discount}
            onChange={(value) => handleChange("discount", value)}
            min={0}
            max={100}
            className="mb-4"
          />
          {categoriesLoading ? (
            <div className="mb-4">Loading categories...</div>
          ) : categoryOptions.length === 0 ? (
            <div className="mb-4 text-red-600">
              No categories found.{" "}
              <Link to="/categories/add" className="text-blue-600 underline">
                Add a category first
              </Link>
              .
            </div>
          ) : (
            <Select
              label="Category"
              placeholder="Select category"
              required
              data={categoryOptions}
              value={form.category_id}
              onChange={(value) => handleChange("category_id", value)}
              className="mb-4"
            />
          )}
          <Select
            label="Brand (Recommended)"
            placeholder={
              brandsLoading
                ? "Loading brands..."
                : brandOptions.length === 0
                ? "No brands available"
                : "Select brand (recommended for better visibility)"
            }
            data={brandOptions}
            value={form.brand_name}
            onChange={(value) => handleChange("brand_name", value)}
            className="mb-4"
            description="Adding a brand helps customers find your product easily"
            disabled={brandsLoading}
            clearable
            searchable
          />
          <Select
            label="Store"
            placeholder={
              storesLoading
                ? "Loading stores..."
                : storeOptions.length === 0
                ? "No stores available"
                : "Select store for this product"
            }
            data={storeOptions}
            value={form.store_id}
            onChange={(value) => handleChange("store_id", value)}
            className="mb-4"
            description="Assign this product to a specific store category"
            disabled={storesLoading}
            clearable
            searchable
          />
          <NumberInput
            label="Stock"
            placeholder="Enter stock quantity"
            value={form.stock}
            onChange={(value) => handleChange("stock", value)}
            min={0}
            className="mb-4"
          />
          <NumberInput
            label="Shipping Amount (₹)"
            placeholder="Enter shipping amount"
            value={form.shipping_amount || 0}
            onChange={(value) => handleChange("shipping_amount", value || 0)}
            min={0}
            className="mb-4"
            precision={2}
            step={0.01}
          />

          <Select
            label="Product Type"
            placeholder="Select product type"
            required
            data={[
              {
                value: "nationwide",
                label:
                  "🏪 Nationwide - Available everywhere with full fallback",
              },
              {
                value: "zonal",
                label: "🏙️ Zonal - Regional products with fallback to division",
              },
              {
                value: "perishable",
                label:
                  "🥬 Perishable - Fresh items, direct from division warehouse only",
              },
            ]}
            value={form.product_type}
            onChange={(value) => handleChange("product_type", value)}
            className="mb-4"
            description="Determines warehouse distribution and fallback rules"
          />

          {/* Warehouse Distribution Flow */}
          <Divider
            label="📦 Warehouse & Stock Management"
            labelPosition="center"
            className="mb-4"
          />

          {/* Warehouse Status & Refresh */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Text size="sm" weight={500}>
                🏢 Available Warehouses (
                {zonalWarehouses.length + divisionWarehouses.length} total)
              </Text>
              <div className="flex gap-2">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    console.log("🔍 Debug Info:");
                    console.log("warehousesLoading:", warehousesLoading);
                    console.log("zonalWarehouses:", zonalWarehouses);
                    console.log("divisionWarehouses:", divisionWarehouses);
                    console.log("API URL:", import.meta.env.VITE_API_BASE_URL);
                  }}
                  color="gray"
                >
                  🔍 Debug
                </Button>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={refreshWarehousesData}
                  loading={warehousesLoading}
                  leftIcon={<span>🔄</span>}
                >
                  Refresh
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <Text weight={500} className="mb-1 flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Zonal ({zonalWarehouses.length})
                </Text>
                <div className="text-gray-600 dark:text-gray-400">
                  {zonalWarehouses.length === 0
                    ? "No zonal warehouses available"
                    : `${zonalWarehouses.map((w) => w.name).join(", ")}`}
                </div>
              </div>
              <div>
                <Text weight={500} className="mb-1 flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Division ({divisionWarehouses.length})
                </Text>
                <div className="text-gray-600 dark:text-gray-400">
                  {divisionWarehouses.length === 0
                    ? "No division warehouses available"
                    : `${divisionWarehouses
                        .slice(0, 3)
                        .map((w) => w.name)
                        .join(", ")}${
                        divisionWarehouses.length > 3
                          ? ` +${divisionWarehouses.length - 3} more`
                          : ""
                      }`}
                </div>
              </div>
            </div>
          </div>

          {/* Flow Explanation */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <Text
              size="sm"
              weight={600}
              className="mb-2 text-blue-800 dark:text-blue-300"
            >
              🔄 Product Distribution Flow
            </Text>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <span className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                1. Admin Adds Product
              </span>
              <span>→</span>
              <span className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                2. Auto Zonal Distribution
              </span>
              <span>→</span>
              <span className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">
                3. Distribute to Divisions
              </span>
            </div>
          </div>

          <div className="mb-4">
            <Text size="sm" weight={500} className="mb-2">
              🏢 Product Warehouse Strategy
            </Text>
            <Text size="xs" color="dimmed" className="mb-4">
              Choose how this product should be distributed across warehouses
              with intelligent fallback
            </Text>

            <Radio.Group
              value={form.warehouse_mapping_type}
              onChange={(value) => {
                handleChange("warehouse_mapping_type", value);
                // Clear selections when changing strategy
                if (value === "auto_zonal_to_division") {
                  handleChange("primary_warehouses", []);
                  handleChange("fallback_warehouses", []);
                  handleChange("assigned_warehouse_ids", []);
                } else if (value === "zonal_only") {
                  handleChange("primary_warehouses", []);
                  handleChange("fallback_warehouses", []);
                  handleChange("assigned_warehouse_ids", []);
                } else if (value === "selective_zonal_division") {
                  handleChange("assigned_warehouse_ids", []);
                }
              }}
            >
              <div className="space-y-4">
                <div className="p-3 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Radio
                    value="auto_zonal_to_division"
                    label={
                      <div>
                        <Text size="sm" weight={500}>
                          🚀 Auto Zonal → Division Distribution (Recommended)
                        </Text>
                        <Text size="xs" color="dimmed" className="mt-1">
                          Product added to zonal warehouses → Automatically
                          distributed to division warehouses → Smart fallback
                          (Division → Zonal)
                        </Text>
                      </div>
                    }
                  />
                </div>

                <div className="p-3 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <Radio
                    value="selective_zonal"
                    label={
                      <div>
                        <Text size="sm" weight={500}>
                          🎯 Selective Zonal + Division Fallback
                        </Text>
                        <Text size="xs" color="dimmed" className="mt-1">
                          Choose specific zonal warehouses → Division warehouses
                          as fallback when out of stock
                        </Text>
                      </div>
                    }
                  />
                </div>

                <div className="p-3 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <Radio
                    value="zonal_only"
                    label={
                      <div>
                        <Text size="sm" weight={500}>
                          🏪 Zonal Warehouses Only (No Fallback)
                        </Text>
                        <Text size="xs" color="dimmed" className="mt-1">
                          Distribute to zonal warehouses only → NO division
                          fallback → Regional products only
                        </Text>
                      </div>
                    }
                  />
                </div>
              </div>
            </Radio.Group>
          </div>

          {/* Warehouse Overview & Refresh Section */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <Text size="sm" weight={600}>
                🏢 Available Warehouses ({zonalWarehouses.length} total)
              </Text>
              <Group spacing={4}>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={refreshWarehousesData}
                  loading={warehousesLoading}
                  leftIcon={<span>🔄</span>}
                >
                  Refresh All
                </Button>
                <Text size="xs" color="dimmed">
                  {warehousesLoading ? "Loading..." : "Last updated: Now"}
                </Text>
              </Group>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <Text weight={500} className="mb-2 flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Zonal Warehouses ({zonalWarehouses.length})
                </Text>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {zonalWarehouses.length === 0 ? (
                    <Text size="xs" color="dimmed">
                      No zonal warehouses available
                    </Text>
                  ) : (
                    zonalWarehouses.map((w) => (
                      <div key={w.id} className="flex items-center gap-2 py-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span className="flex-1">{w.name}</span>
                        {warehouseOptions.filter(
                          (opt) => opt.parent_warehouse_id === w.id
                        ).length > 0 && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                            {
                              warehouseOptions.filter(
                                (opt) => opt.parent_warehouse_id === w.id
                              ).length
                            }{" "}
                            divisions
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Text weight={500} className="mb-2 flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Division Warehouses ({divisionWarehouses.length})
                </Text>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {divisionWarehouses.length === 0 ? (
                    <Text size="xs" color="dimmed">
                      No division warehouses available
                    </Text>
                  ) : (
                    divisionWarehouses.map((w) => (
                      <div key={w.id} className="flex items-center gap-2 py-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        {w.parent_warehouse_id && (
                          <span className="text-xs text-gray-400">└─</span>
                        )}
                        <span className="flex-1">{w.name}</span>
                        {w.parent_warehouse_id && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-1 rounded">
                            Under:{" "}
                            {zonalWarehouses.find(
                              (z) => z.id === w.parent_warehouse_id
                            )?.name || "Unknown"}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {warehousesLoading && (
              <div className="mt-2 text-center">
                <Text size="xs" color="dimmed">
                  Loading warehouse data...
                </Text>
              </div>
            )}
          </div>

          {/* Auto Zonal to Division Distribution */}
          {form.warehouse_mapping_type === "auto_zonal_to_division" && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-3">
                <Text size="sm" weight={600} color="green">
                  🚀 Automatic Distribution Enabled
                </Text>
              </div>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Product will be automatically added to zonal warehouses with{" "}
                    <strong>{form.stock || 100}</strong> units each
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    System will auto-distribute to division warehouses under
                    each zonal warehouse
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Smart fallback: Division warehouse out of stock → Zonal
                    warehouse → Other zones if needed
                  </span>
                </div>
              </div>

              <Divider className="my-3" />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Text weight={500} className="mb-1">
                    📍 Target Zonal Warehouses:
                  </Text>
                  <div className="space-y-1">
                    {zonalWarehouses.map((w) => (
                      <div key={w.id} className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{w.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Text weight={500} className="mb-1">
                    🏢 Zonal Warehouses:
                  </Text>
                  <div className="space-y-1">
                    {zonalWarehouses.map((w) => (
                      <div key={w.id} className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{w.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selective Zonal with Division Fallback */}
          {form.warehouse_mapping_type === "selective_zonal_division" && (
            <>
              <MultiSelect
                label="� Select Zonal Warehouses"
                placeholder={
                  warehousesLoading
                    ? "Loading zonal warehouses..."
                    : zonalWarehouses.length === 0
                    ? "No zonal warehouses available"
                    : "Choose specific zonal warehouses for this product"
                }
                data={zonalWarehouses.map((w) => ({
                  value: w.id.toString(),
                  label: `${w.name} - Zone: ${w.zone_name || "N/A"}`,
                }))}
                value={form.primary_warehouses}
                onChange={(values) =>
                  handleChange("primary_warehouses", values)
                }
                className="mb-4"
                disabled={warehousesLoading}
                clearable
                searchable
                description="Select which zonal warehouses should stock this product"
              />

              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-2">
                  <Text size="sm" weight={500}>
                    🔄 Division Warehouse Fallback
                  </Text>
                  <Switch
                    checked={form.enable_fallback}
                    onChange={(e) =>
                      handleChange("enable_fallback", e.currentTarget.checked)
                    }
                    color="blue"
                  />
                </div>
                <Text size="xs" color="dimmed">
                  When enabled, if selected zonal warehouses run out of stock,
                  customers can order from division warehouses
                </Text>
              </div>

              {form.enable_fallback && (
                <MultiSelect
                  label="� Division Fallback Warehouses"
                  placeholder={
                    warehousesLoading
                      ? "Loading division warehouses..."
                      : divisionWarehouses.length === 0
                      ? "No division warehouses available"
                      : "Select division warehouses for fallback"
                  }
                  data={divisionWarehouses.map((w) => ({
                    value: w.id.toString(),
                    label: `${w.name} (Division)`,
                  }))}
                  value={form.fallback_warehouses}
                  onChange={(values) =>
                    handleChange("fallback_warehouses", values)
                  }
                  className="mb-4"
                  disabled={warehousesLoading}
                  clearable
                  searchable
                  description="These warehouses will serve as backup when zonal warehouses are out of stock"
                />
              )}
            </>
          )}
          {/* Zonal Only */}
          {form.warehouse_mapping_type === "zonal_only" && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <Text size="sm" weight={600} color="orange" className="mb-3">
                🏢 Zonal Warehouse Only Configuration
              </Text>
              <div className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Product will be stocked only in zonal warehouses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚫</span>
                  <span>
                    No division distribution - customers order directly from
                    zonal warehouses
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>Best for: Regional products, or zonal inventory</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded">
                <Text size="xs" weight={500}>
                  Available Zonal Warehouses ({zonalWarehouses.length}):
                </Text>
                <div className="flex flex-wrap gap-1 mt-1">
                  {zonalWarehouses.map((w) => (
                    <Badge
                      key={w.id}
                      variant="outline"
                      color="orange"
                      size="sm"
                    >
                      {w.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Zonal Only (No Fallback) */}
          {form.warehouse_mapping_type === "zonal_only" && (
            <>
              <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <Text size="sm" weight={600} color="purple" className="mb-2">
                  🏪 Zonal Warehouses Only (No Fallback)
                </Text>
                <Text size="xs" color="dimmed" className="mb-3">
                  Product will be distributed only to zonal warehouses. When out
                  of stock, customers cannot order from division warehouses.
                </Text>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
                  <Text size="xs" color="red" weight={500}>
                    ⚠️ Warning: No fallback to division warehouses. Product may
                    become unavailable in some regions.
                  </Text>
                </div>
              </div>

              <MultiSelect
                label="🏪 Select Zonal Warehouses"
                placeholder={
                  warehousesLoading
                    ? "Loading zonal warehouses..."
                    : zonalWarehouses.length === 0
                    ? "No zonal warehouses available"
                    : "Choose zonal warehouses (no central fallback)"
                }
                data={zonalWarehouses.map((w) => ({
                  value: w.id.toString(),
                  label: `${w.name}${
                    w.zone_name ? ` - Zone: ${w.zone_name}` : ""
                  }`,
                }))}
                value={form.primary_warehouses}
                onChange={(values) =>
                  handleChange("primary_warehouses", values)
                }
                className="mb-4"
                disabled={warehousesLoading}
                clearable
                searchable
                description="Regional products only - no central warehouse fallback"
              />
            </>
          )}
          {/* Stock Distribution Settings */}
          {(form.warehouse_mapping_type === "auto_zonal_to_division" ||
            form.warehouse_mapping_type === "selective_zonal") && (
            <div className="mb-4">
              <Text size="sm" weight={500} className="mb-3">
                📊 Stock Distribution Settings
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberInput
                  label="Initial Zonal Stock"
                  placeholder="Total stock for zonal warehouses"
                  value={form.stock}
                  onChange={(value) => handleChange("stock", value)}
                  min={1}
                  description="Total units to add to zonal warehouses first"
                />
                <NumberInput
                  label="Per-Zone Distribution"
                  placeholder="Units per zonal warehouse"
                  value={50}
                  min={1}
                  max={form.stock}
                  description="Units to distribute to each zonal warehouse"
                  disabled={
                    form.warehouse_mapping_type === "auto_central_to_zonal"
                  }
                />
              </div>
            </div>
          )}
          {/* Configuration Summary */}
          {form.warehouse_mapping_type && (
            <div className="mb-4">
              <Text size="sm" weight={500} className="mb-2">
                📋 Configuration Summary
              </Text>

              {form.warehouse_mapping_type === "auto_central_to_zonal" && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Text size="sm" color="green" weight={600}>
                      🚀 Auto Distribution Active
                    </Text>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <Text weight={500}>Initial Setup:</Text>
                      <Text color="dimmed">
                        • All Zonal: {form.stock || 100} units distributed
                      </Text>
                      <Text color="dimmed">• Per Zone: Auto-calculated</Text>
                    </div>
                    <div>
                      <Text weight={500}>Fallback Logic:</Text>
                      <Text color="dimmed">
                        • Division → Zonal → Cross-zone
                      </Text>
                      <Text color="dimmed">• Smart inventory management</Text>
                    </div>
                  </div>
                </div>
              )}

              {form.warehouse_mapping_type === "selective_zonal" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <Text size="sm" color="blue" weight={600}>
                    🎯 Selective Zonal Configuration
                  </Text>
                  <div className="mt-2 space-y-1 text-xs">
                    <Text color="dimmed">
                      • Selected Zones: {form.primary_warehouses.length}
                    </Text>
                    <Text color="dimmed">
                      • Central Fallback:{" "}
                      {form.enable_fallback ? "✅ Enabled" : "❌ Disabled"}
                    </Text>
                    {form.enable_fallback && (
                      <Text color="dimmed">
                        • Fallback Warehouses: {form.fallback_warehouses.length}
                      </Text>
                    )}
                  </div>
                </div>
              )}

              {form.warehouse_mapping_type === "zonal_only" && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <Text size="sm" color="purple" weight={600}>
                    🏪 Zonal Only Configuration
                  </Text>
                  <div className="mt-2 text-xs">
                    <Text color="dimmed">
                      • Distribution: Selected zonal warehouses (
                      {form.primary_warehouses.length})
                    </Text>
                    <Text color="dimmed">• Central Fallback: ❌ Disabled</Text>
                    <Text color="red" weight={500}>
                      • Risk: May become unavailable when zones are out of stock
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Selected Warehouses Preview */}
          {(form.warehouse_mapping_type === "selective_zonal" ||
            form.warehouse_mapping_type === "zonal_only") &&
            form.primary_warehouses.length > 0 && (
              <div className="mb-4">
                <Text size="sm" weight={500} className="mb-3">
                  📍 Selected Warehouses Preview
                </Text>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                  <div className="mb-3">
                    <Text
                      size="sm"
                      weight={500}
                      className="mb-2 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      Primary Warehouses ({form.primary_warehouses.length})
                    </Text>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {form.primary_warehouses.map((warehouseId) => {
                        const warehouse = zonalWarehouses.find(
                          (w) => w.id.toString() === warehouseId
                        );
                        return (
                          <div
                            key={warehouseId}
                            className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                          >
                            <span className="text-blue-600">🏪</span>
                            <div className="flex-1">
                              <Text size="xs" weight={500}>
                                {warehouse?.name || warehouseId}
                              </Text>
                              <Text size="xs" color="dimmed">
                                Zone: {warehouse?.zone_name || "N/A"}
                              </Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {form.warehouse_mapping_type === "selective_zonal" &&
                    form.enable_fallback &&
                    form.fallback_warehouses.length > 0 && (
                      <div>
                        <Text
                          size="sm"
                          weight={500}
                          className="mb-2 flex items-center gap-2"
                        >
                          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                          Fallback Warehouses ({form.fallback_warehouses.length}
                          )
                        </Text>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {form.fallback_warehouses.map((warehouseId) => {
                            const warehouse = divisionWarehouses.find(
                              (w) => w.id.toString() === warehouseId
                            );
                            return (
                              <div
                                key={warehouseId}
                                className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                              >
                                <span className="text-orange-600">🏢</span>
                                <div className="flex-1">
                                  <Text size="xs" weight={500}>
                                    {warehouse?.name || warehouseId}
                                  </Text>
                                  <Text size="xs" color="dimmed">
                                    Division Warehouse
                                  </Text>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          <Textarea
            label="Warehouse Notes"
            placeholder="Special notes about warehouse assignment (optional)"
            value={form.warehouse_notes}
            onChange={(e) => handleChange("warehouse_notes", e.target.value)}
            autosize
            minRows={2}
            className="mb-4"
            description="Any special instructions for warehouse assignment of this product"
          />
          <Textarea
            label="Description"
            placeholder="Enter product description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            autosize
            minRows={2}
            className="mb-4"
          />
          <Textarea
            label="Product Specifications"
            placeholder="Enter specifications (one per line)\nExample:\nElectric Wheelchairs/Scooters\nSolar Power Banks/Storage\nRV or Marine Power Systems"
            value={form.specifications}
            onChange={(e) => handleChange("specifications", e.target.value)}
            autosize
            minRows={3}
            className="mb-4"
          />
          <FileInput
            label="Product Image"
            placeholder="Upload product image"
            accept="image/*"
            onChange={(file) => handleChange("image", file)}
            className="mb-4"
          />
          <Switch
            label="Active"
            checked={form.active}
            onChange={(e) => handleChange("active", e.currentTarget.checked)}
            color="green"
            className="mb-4"
          />
          <Switch
            label="In Stock"
            checked={form.in_stock}
            onChange={(e) => handleChange("in_stock", e.currentTarget.checked)}
            color="blue"
            className="mb-4"
          />
          <Switch
            label="Featured"
            checked={form.featured}
            onChange={(e) => handleChange("featured", e.currentTarget.checked)}
            color="yellow"
            className="mb-4"
          />
          <Switch
            label="Popular"
            checked={form.popular}
            onChange={(e) => handleChange("popular", e.currentTarget.checked)}
            color="orange"
            className="mb-4"
          />
          <NumberInput
            label="Rating"
            placeholder="Enter rating (0-5)"
            value={form.rating}
            onChange={(value) => handleChange("rating", value)}
            min={0}
            max={5}
            step={0.1}
            precision={1}
            className="mb-4"
          />
          <NumberInput
            label="Review Count"
            placeholder="Enter review count"
            value={form.review_count}
            onChange={(value) => handleChange("review_count", value)}
            min={0}
            className="mb-4"
          />
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <Group position="right">
            <Button variant="default" onClick={() => navigate("/products")}>
              Cancel
            </Button>
            <Button type="submit" color="blue">
              Add Product
            </Button>
          </Group>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
