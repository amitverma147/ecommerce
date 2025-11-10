import React, { useState } from 'react';
import {
  Modal,
  NumberInput,
  Button,
  Group,
  Text,
  Badge,
  Alert,
  Switch,
  Divider
} from '@mantine/core';
import { updateProductStock, getProductStock } from '../utils/stockApi';

const StockManager = ({ 
  opened, 
  onClose, 
  product, 
  onStockUpdated 
}) => {
  const [stockQuantity, setStockQuantity] = useState(product?.stock || product?.stock_quantity || 0);
  const [updateInStock, setUpdateInStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (product) {
      setStockQuantity(product.stock || product.stock_quantity || 0);
      setError('');
      setSuccess('');
    }
  }, [product]);

  const handleUpdateStock = async () => {
    if (!product?.id) {
      setError('Product ID is required');
      return;
    }

    if (stockQuantity < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProductStock(product.id, stockQuantity, updateInStock);
      
      if (result.success) {
        setSuccess(`Stock updated successfully! New quantity: ${result.product.stock_quantity}`);
        
        // Notify parent component
        if (onStockUpdated) {
          onStockUpdated(result.product);
        }
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to update stock');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Stock update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStockStatus = () => {
    const currentStock = product?.stock || product?.stock_quantity || 0;
    if (currentStock === 0) {
      return { color: 'red', label: 'Out of Stock' };
    } else if (currentStock <= 10) {
      return { color: 'yellow', label: 'Low Stock' };
    } else {
      return { color: 'green', label: 'In Stock' };
    }
  };

  const stockStatus = getCurrentStockStatus();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Product Stock"
      size="md"
      centered
    >
      {product && (
        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text weight={600} className="mb-2">{product.name}</Text>
            <div className="flex items-center gap-4">
              <div>
                <Text size="sm" color="dimmed">Current Stock:</Text>
                <div className="flex items-center gap-2">
                  <Text weight={500}>{product.stock || product.stock_quantity || 0}</Text>
                  <Badge color={stockStatus.color} size="sm">
                    {stockStatus.label}
                  </Badge>
                </div>
              </div>
              <div>
                <Text size="sm" color="dimmed">In Stock Status:</Text>
                <Badge color={product.in_stock ? 'green' : 'red'} size="sm">
                  {product.in_stock ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </div>

          <Divider />

          {/* Stock Update Form */}
          <div className="space-y-4">
            <NumberInput
              label="New Stock Quantity"
              placeholder="Enter new stock quantity"
              value={stockQuantity}
              onChange={setStockQuantity}
              min={0}
              required
              description="Set the new stock quantity for this product"
            />

            <Switch
              label="Auto-update availability status"
              description="Automatically set product as unavailable when stock is 0"
              checked={updateInStock}
              onChange={(event) => setUpdateInStock(event.currentTarget.checked)}
              color="blue"
            />

            {/* Preview */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <Text size="sm" weight={500} className="mb-2">Preview Changes:</Text>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Text color="dimmed">Stock: {product.stock || product.stock_quantity || 0} → {stockQuantity}</Text>
                </div>
                <div>
                  <Text color="dimmed">
                    Status: {product.in_stock ? 'Available' : 'Unavailable'} → {
                      updateInStock ? (stockQuantity > 0 ? 'Available' : 'Unavailable') : 'No change'
                    }
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="green" title="Success">
              {success}
            </Alert>
          )}

          {/* Action Buttons */}
          <Group position="right" spacing="md" className="mt-6">
            <Button 
              variant="default" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              color="blue" 
              onClick={handleUpdateStock}
              loading={loading}
              disabled={stockQuantity === (product.stock || product.stock_quantity || 0)}
            >
              Update Stock
            </Button>
          </Group>
        </div>
      )}
    </Modal>
  );
};

export default StockManager;