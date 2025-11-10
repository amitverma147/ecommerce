// Test script to check products API endpoints
// Run this in browser console or as a node script

const testProductsAPI = async () => {
  const endpoints = [
    "http://localhost:8000/api/productsroute/allproducts",
    "https://big-best-backend.vercel.app/api/productsroute/allproducts",
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing endpoint: ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`📡 Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.log(`❌ Response not OK`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Response received:`, {
        success: data.success,
        dataCount: Array.isArray(data.data) ? data.data.length : "Not an array",
        sampleProduct:
          Array.isArray(data.data) && data.data.length > 0
            ? {
                id: data.data[0].id,
                name: data.data[0].name,
                price: data.data[0].price,
              }
            : "No products",
      });

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        console.log(
          `🎉 SUCCESS: Found ${data.data.length} products from ${endpoint}`
        );
        return true;
      }
    } catch (error) {
      console.log(`💥 Error:`, error.message);
    }
  }

  console.log(`\n❌ All endpoints failed`);
  return false;
};

// Test warehouses API too
const testWarehousesAPI = async () => {
  const endpoints = [
    "http://localhost:8000/api/warehouses",
    "https://big-best-backend.vercel.app/api/warehouses",
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🏢 Testing warehouse endpoint: ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`📡 Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Warehouses response:`, {
          success: data.success,
          dataCount: Array.isArray(data.data)
            ? data.data.length
            : "Not an array",
          sampleWarehouse:
            Array.isArray(data.data) && data.data.length > 0
              ? {
                  id: data.data[0].id,
                  name: data.data[0].name,
                  type: data.data[0].type,
                }
              : "No warehouses",
        });

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          console.log(
            `🎉 SUCCESS: Found ${data.data.length} warehouses from ${endpoint}`
          );
          return true;
        }
      }
    } catch (error) {
      console.log(`💥 Error:`, error.message);
    }
  }

  return false;
};

console.log("🚀 Starting API tests...");
testProductsAPI();
testWarehousesAPI();
