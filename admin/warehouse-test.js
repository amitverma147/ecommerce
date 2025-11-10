// Simple warehouse API test
const API_BASE_URL = "http://localhost:8000/api";

async function testWarehouseAPI() {
  console.log("🧪 Testing warehouse API...");

  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      console.error("❌ Response not OK:", response.statusText);
      return;
    }

    const data = await response.json();
    console.log("📦 Warehouse API Response:", data);

    if (data.data && Array.isArray(data.data)) {
      console.log("✅ Warehouses found:", data.data.length);
      console.log(
        "🏗️ Warehouse types:",
        data.data.map((w) => `${w.name} (${w.type})`)
      );
    } else {
      console.log("⚠️ No warehouses found or invalid structure");
    }
  } catch (error) {
    console.error("💥 API Test failed:", error);
  }
}

// Test with deployed backend too
async function testDeployedAPI() {
  console.log("🌐 Testing deployed warehouse API...");
  const DEPLOYED_API = "https://big-best-backend.vercel.app/api";

  try {
    const response = await fetch(`${DEPLOYED_API}/warehouses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Deployed Response status:", response.status);

    if (!response.ok) {
      console.error("❌ Deployed Response not OK:", response.statusText);
      return;
    }

    const data = await response.json();
    console.log("📦 Deployed Warehouse API Response:", data);

    if (data.data && Array.isArray(data.data)) {
      console.log("✅ Deployed Warehouses found:", data.data.length);
      console.log(
        "🏗️ Deployed Warehouse types:",
        data.data.map((w) => `${w.name} (${w.type})`)
      );
    } else {
      console.log(
        "⚠️ No warehouses found in deployed API or invalid structure"
      );
    }
  } catch (error) {
    console.error("💥 Deployed API Test failed:", error);
  }
}

// Run tests
console.log("🚀 Starting warehouse API tests...");
testWarehouseAPI();
testDeployedAPI();
