# 🏪 Stock Management API Requirements

## 📋 Required Backend Endpoints

### 1. Stock Reservation API
```javascript
POST /api/stock/reserve
{
  "product_id": "uuid",
  "quantity": 2,
  "user_id": "uuid", 
  "action": "add_to_cart"
}

Response:
{
  "success": true,
  "message": "Stock reserved successfully",
  "reserved_quantity": 2,
  "available_stock": 48
}
```

### 2. Stock Release API
```javascript
POST /api/stock/release
{
  "product_id": "uuid",
  "quantity": 2,
  "user_id": "uuid",
  "action": "remove_from_cart"
}

Response:
{
  "success": true,
  "message": "Stock released successfully", 
  "released_quantity": 2,
  "available_stock": 50
}
```

### 3. Enhanced Cart Add API
```javascript
POST /api/cart/add
{
  "user_id": "uuid",
  "product_id": "uuid",
  "quantity": 2,
  "price": 299.99,
  "shipping_amount": 50.00,
  "decrease_stock": true  // New flag
}

Response:
{
  "success": true,
  "message": "Added to cart and stock decreased",
  "cart_item": {...},
  "updated_stock": 48
}
```

### 4. Enhanced Cart Remove API
```javascript
DELETE /api/cart/remove
{
  "user_id": "uuid",
  "product_id": "uuid", 
  "quantity": 2,
  "increase_stock": true  // New flag
}

Response:
{
  "success": true,
  "message": "Removed from cart and stock increased",
  "updated_stock": 50
}
```

## 🔧 Database Schema Updates

### 1. Products Table (Already exists)
```sql
products.stock integer DEFAULT 0,           -- Available stock
products.reserved_stock integer DEFAULT 0,  -- Reserved for carts
```

### 2. Stock Reservations Table (New)
```sql
CREATE TABLE stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  user_id uuid REFERENCES users(id),
  quantity integer NOT NULL,
  reserved_at timestamp DEFAULT now(),
  expires_at timestamp DEFAULT (now() + interval '30 minutes'),
  status varchar DEFAULT 'active' -- active, released, expired
);
```

### 3. Stock Movements Table (New - for tracking)
```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  user_id uuid REFERENCES users(id),
  movement_type varchar NOT NULL, -- 'reserve', 'release', 'purchase'
  quantity integer NOT NULL,
  reason varchar, -- 'add_to_cart', 'remove_from_cart', 'order_placed'
  created_at timestamp DEFAULT now()
);
```

## 🎯 Backend Logic Implementation

### 1. Stock Reservation Logic
```javascript
// When user adds to cart
const reserveStock = async (productId, quantity, userId) => {
  // 1. Check available stock
  const product = await getProduct(productId);
  const availableStock = product.stock - product.reserved_stock;
  
  if (availableStock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  // 2. Create reservation
  await createStockReservation(productId, quantity, userId);
  
  // 3. Update reserved stock
  await updateProduct(productId, {
    reserved_stock: product.reserved_stock + quantity
  });
  
  // 4. Log movement
  await logStockMovement(productId, userId, 'reserve', quantity, 'add_to_cart');
  
  return { success: true, available_stock: availableStock - quantity };
};
```

### 2. Stock Release Logic
```javascript
// When user removes from cart
const releaseStock = async (productId, quantity, userId) => {
  // 1. Find and remove reservation
  await removeStockReservation(productId, userId, quantity);
  
  // 2. Update reserved stock
  const product = await getProduct(productId);
  await updateProduct(productId, {
    reserved_stock: Math.max(0, product.reserved_stock - quantity)
  });
  
  // 3. Log movement
  await logStockMovement(productId, userId, 'release', quantity, 'remove_from_cart');
  
  return { success: true };
};
```

### 3. Order Completion Logic
```javascript
// When order is placed successfully
const completeStockPurchase = async (cartItems, userId) => {
  for (const item of cartItems) {
    // 1. Remove reservation
    await removeStockReservation(item.product_id, userId, item.quantity);
    
    // 2. Decrease actual stock
    const product = await getProduct(item.product_id);
    await updateProduct(item.product_id, {
      stock: product.stock - item.quantity,
      reserved_stock: Math.max(0, product.reserved_stock - item.quantity)
    });
    
    // 3. Log movement
    await logStockMovement(item.product_id, userId, 'purchase', item.quantity, 'order_placed');
  }
};
```

## 🔄 Stock Cleanup (Cron Job)

### Expired Reservations Cleanup
```javascript
// Run every 5 minutes
const cleanupExpiredReservations = async () => {
  const expiredReservations = await getExpiredReservations();
  
  for (const reservation of expiredReservations) {
    // Release expired stock
    await releaseStock(reservation.product_id, reservation.quantity, reservation.user_id);
    
    // Mark as expired
    await updateReservation(reservation.id, { status: 'expired' });
  }
};
```

## 🚨 Error Handling

### Stock Validation
```javascript
const validateStockOperation = async (productId, quantity, operation) => {
  const product = await getProduct(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (operation === 'reserve') {
    const availableStock = product.stock - product.reserved_stock;
    if (availableStock < quantity) {
      throw new Error(`Only ${availableStock} items available`);
    }
  }
  
  return true;
};
```

## 📊 Benefits

### For Users
- ✅ Real-time stock availability
- ✅ No overselling issues
- ✅ Reserved items for 30 minutes
- ✅ Accurate stock information

### For Business  
- ✅ Prevent overselling
- ✅ Better inventory management
- ✅ Stock movement tracking
- ✅ Automatic cleanup of expired reservations

## 🔧 Implementation Priority

### Phase 1 (Critical)
1. ✅ Stock reservation API
2. ✅ Stock release API  
3. ✅ Enhanced cart APIs
4. ✅ Database schema updates

### Phase 2 (Important)
1. ✅ Stock movements tracking
2. ✅ Expired reservations cleanup
3. ✅ Stock validation middleware
4. ✅ Error handling improvements

This implementation ensures real-time stock management while preventing overselling and maintaining data consistency.