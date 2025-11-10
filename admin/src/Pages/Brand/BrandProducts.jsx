import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import {
  getBrand,
  getProductsForBrand,
  getAllProducts,
  mapProductToBrand,
  removeProductFromBrand,
} from "../../utils/supabaseApi";

const BrandProducts = () => {
  const { id } = useParams(); // brand_id
  const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [productsInBrand, setProductsInBrand] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch Brand info
  const fetchBrand = useCallback(async () => {
    try {
      const result = await getBrand(id);
      if (result.success) {
        setBrand(result.brand);
      } else {
        console.error("Failed to fetch Brand details:", result.error);
        notifications.show({
          color: "red",
          message: "Failed to load brand details.",
        });
      }
    } catch (err) {
      console.error("Failed to fetch Brand details:", err);
      notifications.show({
        color: "red",
        message: "Failed to load brand details.",
      });
    }
  }, [id]);

  // Fetch products mapped to this Brand
  const fetchBrandProducts = useCallback(async () => {
    try {
      const result = await getProductsForBrand(id);
      if (result.success) {
        setProductsInBrand(result.data);
      } else {
        console.error("Failed to fetch products for Brand:", result.error);
        notifications.show({
          color: "red",
          message: "Failed to load brand products.",
        });
      }
    } catch (err) {
      console.error("Failed to fetch products for Brand:", err);
      notifications.show({
        color: "red",
        message: "Failed to load brand products.",
      });
    }
  }, [id]);

  // Fetch all available products
  const fetchAllProducts = useCallback(async () => {
    try {
      const result = await getAllProducts();
      if (result.success) {
        setAllProducts(result.products);
      } else {
        console.error("Failed to fetch all products:", result.error);
        notifications.show({
          color: "red",
          message: "Failed to load products.",
        });
      }
    } catch (err) {
      console.error("Failed to fetch all products:", err);
      notifications.show({ color: "red", message: "Failed to load products." });
    }
  }, []);

  const handleAddProduct = async () => {
    if (!selectedProductId) return;

    try {
      const result = await mapProductToBrand(selectedProductId, id);
      if (result.success) {
        setSelectedProductId("");
        await fetchBrandProducts();
        notifications.show({
          color: "green",
          message: "Product added to brand successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      notifications.show({
        color: "red",
        message: "Product already mapped or an error occurred.",
      });
      console.error(err);
    }
  };

  const handleRemoveProduct = async (product_id) => {
    try {
      const result = await removeProductFromBrand(product_id, id);
      if (result.success) {
        await fetchBrandProducts();
        notifications.show({
          color: "green",
          message: "Product removed from brand successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      notifications.show({
        color: "red",
        message: "Failed to remove product from brand.",
      });
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchBrand(),
        fetchBrandProducts(),
        fetchAllProducts(),
      ]);
      setLoading(false);
    };
    load();
  }, [id, fetchBrand, fetchBrandProducts, fetchAllProducts]);

  if (loading || !brand) return <p className="p-4">Loading...</p>;

  const mappedProductIds = productsInBrand.map((p) => p.product_id);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/brands")}
          className="text-blue-600 hover:underline mb-2"
        >
          ← Back to Brands
        </button>
        <h2 className="text-xl font-bold">Manage Products for the Brand:</h2>
        <p className="text-lg">Brand Name: {brand.name}</p>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">➕ Add Product</h3>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select product</option>
            {allProducts.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={mappedProductIds.includes(product.id)}
              >
                {product.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddProduct}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">📦 Products in Brand</h3>
        {productsInBrand.length === 0 ? (
          <p className="text-gray-500">No products mapped to this Brand.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Product Name</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsInBrand.map((product) => (
                <tr key={product.product_id} className="border-t">
                  <td className="py-2 px-4">{product.products.name}</td>
                  <td className="py-2 px-4">₹{product.products.price}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleRemoveProduct(product.product_id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      🗑 Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BrandProducts;
