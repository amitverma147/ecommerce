import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllZones,
  getZonalWarehouseAvailablePincodes,
  getZonalWarehouseAvailablePincodesDirect,
} from "../../utils/supabaseApi";

const WarehouseList = () => {
  const navigate = useNavigate();
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "zonal",
    pincode: "",
    address: "",
    zone_ids: [],
    parent_warehouse_id: null,
    pincode_assignments: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const [availablePincodes, setAvailablePincodes] = useState([]);
  const [loadingPincodes, setLoadingPincodes] = useState(false);

  const handleDeleteWarehouse = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this warehouse?"
    );
    if (!confirmDelete) return;

    try {
      const result = await deleteWarehouse(id);
      if (result.success) {
        await fetchWarehouses();
      } else {
        alert("Failed to delete warehouse: " + result.error);
      }
    } catch (err) {
      alert("Failed to delete warehouse");
      console.error(err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const result = await getAllWarehouses();
      if (result.success) {
        setWarehouses(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Failed to fetch warehouses:", err);
      setError("Failed to fetch warehouses");
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const result = await getAllZones({ active_only: "true" });
      if (result.success) {
        setZones(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchZones();
  }, []);

  // Fetch available pincodes when parent warehouse changes for division warehouses
  useEffect(() => {
    const fetchAvailablePincodes = async () => {
      if (form.type === "division" && form.parent_warehouse_id) {
        setLoadingPincodes(true);
        try {
          // Try backend API first
          let result = await getZonalWarehouseAvailablePincodes(
            form.parent_warehouse_id
          );

          // If backend fails, try direct Supabase query as fallback
          if (!result.success) {
            console.warn(
              "Backend API failed, trying direct Supabase query:",
              result.error
            );
            result = await getZonalWarehouseAvailablePincodesDirect(
              form.parent_warehouse_id
            );
          }

          if (result.success) {
            setAvailablePincodes(result.data || []);
          } else {
            console.error("Failed to fetch available pincodes:", result.error);
            setAvailablePincodes([]);
          }
        } catch (error) {
          console.error("Error fetching available pincodes:", error);
          setAvailablePincodes([]);
        } finally {
          setLoadingPincodes(false);
        }
      } else {
        setAvailablePincodes([]);
      }
    };

    fetchAvailablePincodes();
  }, [form.type, form.parent_warehouse_id]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Warehouses</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
      >
        ➕ Add Warehouse
      </button>

      {loading ? (
        <p className="text-gray-500">Loading warehouses...</p>
      ) : warehouses.length === 0 ? (
        <p className="text-gray-500">No warehouses found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-sm md:text-base">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">ID</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Parent/Children</th>
                <th className="py-2 px-4">Zones</th>
                <th className="py-2 px-4">Pincode</th>
                <th className="py-2 px-4">Address</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="py-2 px-4">{w.id}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center">
                      {w.parent_warehouse_id && (
                        <span className="text-gray-400 mr-2">└─</span>
                      )}
                      {w.name}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        w.type === "zonal"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {w.type === "zonal" ? "Zonal" : "Division"}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {w.type === "central" ? (
                      <div>
                        <span className="text-xs text-gray-600">
                          {
                            warehouses.filter(
                              (child) => child.parent_warehouse_id === w.id
                            ).length
                          }{" "}
                          child warehouses
                        </span>
                        {warehouses.filter(
                          (child) => child.parent_warehouse_id === w.id
                        ).length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {warehouses
                              .filter(
                                (child) => child.parent_warehouse_id === w.id
                              )
                              .map((child) => child.name)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    ) : w.parent_warehouse_id ? (
                      <div className="text-xs text-blue-600">
                        Under:{" "}
                        {warehouses.find(
                          (parent) => parent.id === w.parent_warehouse_id
                        )?.name || "Unknown"}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Independent</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {w.zones && w.zones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {w.zones.slice(0, 2).map((zone) => (
                          <span
                            key={zone.id}
                            className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                          >
                            {zone.name}
                          </span>
                        ))}
                        {w.zones.length > 2 && (
                          <span className="text-gray-500 text-xs">
                            +{w.zones.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No zones</span>
                    )}
                  </td>
                  <td className="py-2 px-4">{w.pincode}</td>
                  <td className="py-2 px-4">{w.address}</td>
                  <td className="py-2 px-4 space-x-2">
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                      onClick={() => {
                        setEditingWarehouse(w);
                        setForm({
                          name: w.name || "",
                          type: w.type || "zonal",
                          pincode: w.pincode || "",
                          address: w.address || "",
                          zone_ids: w.zones ? w.zones.map((z) => z.id) : [],
                          parent_warehouse_id: w.parent_warehouse_id || null,
                          pincode_assignments: w.pincodes
                            ? w.pincodes.map((p) => ({
                                pincode: p,
                                city: "", // We'll need to get this from the API
                                state: "",
                              }))
                            : [],
                        });
                        setShowModal(true);
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => handleDeleteWarehouse(w.id)}
                    >
                      🗑️
                    </button>

                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded"
                      onClick={() =>
                        navigate(`/warehouseproducts/${w.id}/products`)
                      }
                    >
                      📦 Products
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  placeholder="Warehouse Name"
                  className="w-full border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Type *
                </label>
                <select
                  className="w-full border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm({
                      ...form,
                      type: newType,
                      zone_ids: newType === "zonal" ? form.zone_ids : [],
                      parent_warehouse_id:
                        newType === "division"
                          ? form.parent_warehouse_id
                          : null,
                      pincode_assignments:
                        newType === "division" ? form.pincode_assignments : [],
                    });
                  }}
                >
                  <option value="zonal">Zonal Warehouse</option>
                  <option value="division">Division Warehouse</option>
                </select>
              </div>

              {form.type === "zonal" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Served Zones *
                  </label>
                  <div className="border rounded p-3 max-h-40 overflow-y-auto">
                    {zones.length === 0 ? (
                      <p className="text-gray-500 text-sm">Loading zones...</p>
                    ) : (
                      zones.map((zone) => (
                        <label
                          key={zone.id}
                          className="flex items-center space-x-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={form.zone_ids.includes(zone.id)}
                            onChange={(e) => {
                              const zoneId = zone.id;
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  zone_ids: [...form.zone_ids, zoneId],
                                });
                              } else {
                                setForm({
                                  ...form,
                                  zone_ids: form.zone_ids.filter(
                                    (id) => id !== zoneId
                                  ),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {zone.name} ({zone.state})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {form.type === "zonal" && form.zone_ids.length === 0 && (
                    <p className="text-red-500 text-xs mt-1">
                      Please select at least one zone for zonal warehouses
                    </p>
                  )}
                </div>
              )}

              {form.type === "division" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Zonal Warehouse *
                  </label>
                  <select
                    className="w-full border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.parent_warehouse_id || ""}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        parent_warehouse_id: e.target.value || null,
                        pincode_assignments: [], // Clear pincodes when parent changes
                      });
                    }}
                  >
                    <option value="">
                      Select a zonal warehouse (required)
                    </option>
                    {warehouses
                      .filter((w) => w.type === "zonal")
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    Division warehouses must be linked to a zonal warehouse
                  </p>
                </div>
              )}

              {form.type === "division" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Served Pincodes *
                  </label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {form.parent_warehouse_id ? (
                      <>
                        {loadingPincodes ? (
                          <div className="text-center py-8">
                            <div className="flex items-center justify-center space-x-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                              <span className="text-gray-600 font-medium">
                                Loading available pincodes...
                              </span>
                            </div>
                          </div>
                        ) : availablePincodes.length > 0 ? (
                          <>
                            {/* Header with stats */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">
                                    Available Pincodes:
                                  </span>{" "}
                                  <span className="text-green-600 font-semibold">
                                    {
                                      availablePincodes.filter(
                                        (p) => p.is_available
                                      ).length
                                    }
                                  </span>
                                  {" • "}
                                  <span className="text-orange-600 font-semibold">
                                    {
                                      availablePincodes.filter(
                                        (p) => !p.is_available
                                      ).length
                                    }
                                  </span>{" "}
                                  assigned
                                </div>
                              </div>
                            </div>

                            {/* Pincode dropdown */}
                            <select
                              multiple
                              value={form.pincode_assignments.map(
                                (p) => p.pincode
                              )}
                              onChange={(e) => {
                                const selectedOptions = Array.from(
                                  e.target.selectedOptions
                                );
                                const selectedPincodes = selectedOptions.map(
                                  (option) => {
                                    const pincodeData = availablePincodes.find(
                                      (p) => p.pincode === option.value
                                    );
                                    return {
                                      pincode: pincodeData.pincode,
                                      city: pincodeData.city,
                                      state: pincodeData.state,
                                    };
                                  }
                                );
                                setForm({
                                  ...form,
                                  pincode_assignments: selectedPincodes,
                                });
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                              size="6"
                            >
                              {availablePincodes.map((pincode) => (
                                <option
                                  key={pincode.pincode}
                                  value={pincode.pincode}
                                  disabled={!pincode.is_available}
                                  className={
                                    pincode.is_available ? "" : "text-gray-400"
                                  }
                                >
                                  {pincode.pincode} - {pincode.city},{" "}
                                  {pincode.state}
                                  {!pincode.is_available &&
                                    " (Already Assigned)"}
                                </option>
                              ))}
                            </select>

                            <div className="text-xs text-gray-500 mt-2">
                              Hold Ctrl/Cmd to select multiple pincodes. Only
                              available pincodes can be selected.
                            </div>

                            {/* Selected pincodes display */}
                            {form.pincode_assignments.length > 0 && (
                              <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Selected Pincodes (
                                    {form.pincode_assignments.length})
                                  </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {form.pincode_assignments.map(
                                    (assignment, index) => (
                                      <div
                                        key={index}
                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                      >
                                        <span className="font-semibold">
                                          {assignment.pincode}
                                        </span>
                                        <span className="mx-1 text-blue-600">
                                          •
                                        </span>
                                        <span className="text-blue-700">
                                          {assignment.city}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setForm({
                                              ...form,
                                              pincode_assignments:
                                                form.pincode_assignments.filter(
                                                  (_, i) => i !== index
                                                ),
                                            });
                                          }}
                                          className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                          title="Remove pincode"
                                        >
                                          <svg
                                            className="w-3 h-3"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-3">
                              <svg
                                className="mx-auto h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              No pincodes available
                            </h3>
                            <p className="text-sm text-gray-500">
                              The parent zonal warehouse doesn&apos;t have any
                              zones assigned, or those zones don&apos;t have
                              pincodes configured.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-3">
                          <svg
                            className="mx-auto h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          Select Parent Warehouse First
                        </h3>
                        <p className="text-sm text-gray-500">
                          Choose a zonal warehouse above to see available
                          pincodes for this division warehouse.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  placeholder="Address"
                  className="w-full border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm({
                    name: "",
                    type: "zonal",
                    pincode: "",
                    address: "",
                    zone_ids: [],
                    parent_warehouse_id: null,
                    pincode_assignments: [],
                  });
                  setEditingWarehouse(null);
                  setError("");
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  setError("");

                  // Validation
                  if (!form.name.trim()) {
                    setError("Warehouse name is required");
                    setSubmitting(false);
                    return;
                  }

                  if (form.type === "zonal" && form.zone_ids.length === 0) {
                    setError(
                      "Zonal warehouses must be mapped to at least one zone"
                    );
                    setSubmitting(false);
                    return;
                  }

                  if (form.type === "division" && !form.parent_warehouse_id) {
                    setError(
                      "Division warehouses must be linked to a zonal warehouse"
                    );
                    setSubmitting(false);
                    return;
                  }

                  if (
                    form.type === "division" &&
                    form.pincode_assignments.length === 0
                  ) {
                    setError(
                      "Division warehouses must be assigned at least one pincode"
                    );
                    setSubmitting(false);
                    return;
                  }

                  try {
                    const payload = {
                      name: form.name,
                      type: form.type,
                      pincode: form.type === "zonal" ? form.pincode : null,
                      address: form.address,
                      zone_ids: form.type === "zonal" ? form.zone_ids : [],
                      parent_warehouse_id:
                        form.type === "zonal" || form.type === "division"
                          ? form.parent_warehouse_id
                          : null,
                      pincode_assignments:
                        form.type === "division"
                          ? form.pincode_assignments
                          : [],
                    };

                    if (editingWarehouse) {
                      // 🔄 EDIT
                      const result = await updateWarehouse(
                        editingWarehouse.id,
                        payload
                      );
                      if (!result.success) {
                        setError("Failed to update warehouse: " + result.error);
                        setSubmitting(false);
                        return;
                      }
                    } else {
                      // ➕ ADD
                      const result = await createWarehouse(payload);
                      if (!result.success) {
                        setError("Failed to create warehouse: " + result.error);
                        setSubmitting(false);
                        return;
                      }
                    }
                    await fetchWarehouses();
                    setShowModal(false);
                    setForm({
                      name: "",
                      type: "zonal",
                      pincode: "",
                      address: "",
                      zone_ids: [],
                      parent_warehouse_id: null,
                      pincode_assignments: [],
                    });
                    setEditingWarehouse(null);
                  } catch (err) {
                    setError("Failed to save warehouse");
                    console.error(err);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving..." : editingWarehouse ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseList;
