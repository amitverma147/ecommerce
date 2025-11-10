# Warehouse Mapping Functionality for Products

This document explains the new warehouse mapping functionality that has been implemented in the product management system. This replaces the previous zone-based delivery mapping with a more robust warehouse-based distribution system.

## Overview

The warehouse mapping functionality allows administrators to assign products to specific warehouses based on different distribution strategies. This enables better inventory management, faster delivery, and more efficient warehouse operations.

## Key Features

### 1. Warehouse Mapping Types

The system supports four different warehouse mapping strategies:

#### **Nationwide**
- Product is available from **all warehouses** (both central and zonal)
- Default option for most products
- Provides maximum availability and fastest delivery options
- Uses intelligent fallback system (central → zonal → cross-zone)

#### **Central Only**
- Product is available only from **central warehouses**
- Used for high-value or specialized items
- Centralized inventory management
- May have longer delivery times to remote areas

#### **Zonal Only**
- Product is available only from **zonal warehouses**
- Used for region-specific products or bulk items
- Faster local delivery
- Regional inventory management

#### **Custom Selection**
- Product is available from **specific selected warehouses**
- Administrator manually chooses which warehouses stock the product
- Maximum control over distribution
- Used for limited stock items or special products

### 2. Intelligent Fallback System

The system implements an intelligent fallback mechanism:

1. **Primary Check**: Look for product in customer's nearest zonal warehouse
2. **Secondary Check**: If not available, check central warehouses
3. **Tertiary Check**: Check other zonal warehouses in nearby zones
4. **Final Fallback**: Cross-zone delivery if permitted

### 3. User Interface Components

#### Product Addition Form (`AddProduct.jsx`)
- **Warehouse Assignment Section**: Radio button selection for mapping type
- **Custom Warehouse Selection**: Multi-select dropdown for specific warehouses
- **Visual Indicators**: Color-coded information boxes showing assignment details
- **Warehouse Notes**: Optional field for special instructions

#### Product Management (`index.jsx`)
- **Warehouse Mapping Column**: Shows current assignment type
- **Bulk Assignment**: Ability to change warehouse mapping for multiple products
- **Warehouse Filter**: Filter products by warehouse assignment type
- **Assignment History**: Track changes to warehouse assignments

## Technical Implementation

### 1. Database Schema

The system expects the following database structure:

```sql
-- Products table (updated)
ALTER TABLE products ADD COLUMN warehouse_mapping_type VARCHAR(20) DEFAULT 'nationwide';
ALTER TABLE products ADD COLUMN assigned_warehouse_ids INTEGER[];
ALTER TABLE products ADD COLUMN warehouse_notes TEXT;

-- Warehouses table
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('central', 'zonal')),
    address TEXT,
    zone_ids INTEGER[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product-Warehouse mapping table (optional for complex relationships)
CREATE TABLE product_warehouse_mappings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Endpoints

The system requires the following API endpoints:

```javascript
// Warehouse Management
GET    /api/warehouses                    // Get all warehouses
GET    /api/warehouses/:id               // Get warehouse by ID
POST   /api/warehouses                   // Create new warehouse
PUT    /api/warehouses/:id               // Update warehouse
DELETE /api/warehouses/:id               // Delete warehouse
GET    /api/warehouses?type=central      // Get warehouses by type

// Product-Warehouse Mapping
POST   /api/products/:id/warehouses      // Assign warehouses to product
GET    /api/products/:id/warehouses      // Get product warehouse assignments
DELETE /api/products/:id/warehouses/:wid // Remove warehouse assignment
```

### 3. Frontend Components

#### WarehouseApi.js
Located at: `src/utils/warehouseApi.js`

Provides utility functions for:
- `fetchWarehouses()` - Get all warehouses
- `fetchWarehousesByType(type)` - Get warehouses by type (central/zonal)
- `mapProductToWarehouses(productId, warehouseIds)` - Assign product to warehouses
- `getProductWarehouseMappings(productId)` - Get product's warehouse assignments

#### Form Components
- **Radio Group**: Select mapping type (nationwide/central/zonal/custom)
- **MultiSelect**: Choose specific warehouses for custom mapping
- **Info Boxes**: Display assignment details and warehouse counts
- **Textarea**: Add warehouse-specific notes

### 4. Data Flow

1. **Product Creation**:
   ```javascript
   // Form data structure
   const productData = {
     name: "Product Name",
     warehouse_mapping_type: "custom",
     assigned_warehouse_ids: [1, 3, 5],
     warehouse_notes: "Special handling required"
   };
   ```

2. **Warehouse Assignment**:
   ```javascript
   // API call to assign warehouses
   const result = await mapProductToWarehouses(productId, warehouseIds);
   ```

3. **Delivery Logic** (Backend):
   ```javascript
   // Check product availability in customer's zone
   const availableWarehouses = await getAvailableWarehouses(
     productId, 
     customerZoneId
   );
   ```

## Migration Guide

### From Zone-Based to Warehouse-Based Mapping

If migrating from the previous zone-based system:

1. **Data Migration**:
   ```sql
   -- Convert delivery_type to warehouse_mapping_type
   UPDATE products 
   SET warehouse_mapping_type = 
     CASE 
       WHEN delivery_type = 'nationwide' THEN 'nationwide'
       WHEN delivery_type = 'zonal' THEN 'custom'
       ELSE 'nationwide'
     END;
   
   -- Map zone assignments to warehouse assignments
   -- (Custom logic based on your zone-warehouse relationships)
   ```

2. **API Updates**: Update backend APIs to handle warehouse-based logic instead of zone-based logic

3. **Frontend Updates**: Replace zone selection components with warehouse selection components

## Configuration

### Environment Variables

```env
# API Base URL for warehouse operations
VITE_API_BASE_URL=http://localhost:8000/api
```

### Default Settings

```javascript
// Default warehouse mapping type for new products
const DEFAULT_WAREHOUSE_MAPPING = "nationwide";

// Fallback behavior when no warehouses are assigned
const FALLBACK_TO_CENTRAL = true;
```

## Usage Examples

### 1. Creating a Product with Central Warehouse Only

```javascript
const newProduct = {
  name: "Premium Electronics",
  price: 50000,
  warehouse_mapping_type: "central",
  warehouse_notes: "High-value item - central warehouse only for security"
};
```

### 2. Assigning Specific Warehouses

```javascript
const newProduct = {
  name: "Regional Specialty Item",
  warehouse_mapping_type: "custom",
  assigned_warehouse_ids: [2, 4, 7], // Specific warehouse IDs
  warehouse_notes: "Available in northern regions only"
};
```

### 3. Bulk Warehouse Assignment

```javascript
// Assign multiple products to same warehouses
const productIds = [1, 2, 3, 4, 5];
const warehouseIds = [1, 3];

for (const productId of productIds) {
  await mapProductToWarehouses(productId, warehouseIds);
}
```

## Best Practices

1. **Default to Nationwide**: Use nationwide mapping for most products to ensure maximum availability

2. **Central for High-Value Items**: Use central warehouses for expensive or specialized items that require special handling

3. **Zonal for Bulk Items**: Use zonal warehouses for heavy or bulky items that are better distributed regionally

4. **Custom for Limited Items**: Use custom mapping for products with specific distribution requirements

5. **Regular Reviews**: Periodically review and optimize warehouse assignments based on demand patterns

6. **Warehouse Notes**: Always add notes for custom assignments to help future administrators understand the reasoning

## Troubleshooting

### Common Issues

1. **No Warehouses Available**: Ensure at least one warehouse is active and assigned to the product
2. **API Errors**: Check that warehouse API endpoints are properly implemented
3. **Loading Issues**: Verify warehouse data is being fetched correctly on component mount
4. **Assignment Errors**: Check that warehouse IDs are valid integers when saving

### Debug Information

The forms include debug information showing:
- Mapping type selection
- Warehouse loading status
- Number of available warehouses
- Selected warehouse count

This information helps administrators verify the system is working correctly.

## Future Enhancements

Potential improvements to consider:

1. **Stock Level Integration**: Show available stock at each warehouse
2. **Delivery Time Estimates**: Calculate delivery times from each warehouse to customer zones
3. **Automated Assignment**: AI-based warehouse assignment based on demand patterns
4. **Performance Analytics**: Track which warehouse assignments perform best
5. **Seasonal Adjustments**: Automatic warehouse assignment changes based on seasonal demand
6. **Multi-Currency Support**: Different pricing for different warehouse regions

## Support

For technical support or questions about the warehouse mapping functionality, please refer to:

1. **API Documentation**: Check backend API documentation for endpoint details
2. **Component Documentation**: Review component props and usage in the codebase
3. **Database Schema**: Ensure database tables match the expected structure
4. **Error Logs**: Check browser console and backend logs for error details