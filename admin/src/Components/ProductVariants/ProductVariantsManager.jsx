import React, { useState, useEffect } from 'react';
import { Card, Title, Button, Table, Modal, TextInput, NumberInput, Switch, Group, ActionIcon, LoadingOverlay, Select, FileInput, Image } from '@mantine/core';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import { apiCall } from '../../utils/api';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (l)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'packet', label: 'Packet' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'pouch', label: 'Pouch' }
];

// CRITICAL: This component manages ONLY product variants
// It should NEVER modify main product prices (price, old_price, discount)
// PRICE ISOLATION: Variants have completely separate pricing: variant_price, variant_old_price, variant_discount
// Main product pricing must remain untouched during all variant operations
const ProductVariantsManager = ({ productId, productName }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState({
    variant_name: '',
    variant_price: 0,
    variant_old_price: 0,
    variant_discount: 0,
    variant_stock: 0,
    variant_weight: '',
    variant_unit: 'kg',
    shipping_amount: 0,
    is_default: false,
    variant_image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/product-variants/product/${productId}/variants`);
      if (response.success) {
        setVariants(response.variants || []);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/image`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.success ? data.imageUrl : null;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image if selected
      let imageUrl = form.variant_image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          alert('Image upload failed');
          setLoading(false);
          return;
        }
      }

      // PRICE ISOLATION: Prepare variant data without affecting main product
      const variantData = {
        ...form,
        variant_image_url: imageUrl,
        // Ensure proper data types for variant pricing
        variant_price: parseFloat(form.variant_price) || 0,
        variant_old_price: form.variant_old_price ? parseFloat(form.variant_old_price) : null,
        variant_discount: parseInt(form.variant_discount) || 0,
        variant_stock: parseInt(form.variant_stock) || 0,
        shipping_amount: parseFloat(form.shipping_amount) || 0,
        is_default: Boolean(form.is_default),
        active: true
      };

      if (editingVariant) {
        // CRITICAL: Only update product_variants table, never products table
        const response = await apiCall(`/product-variants/variant/${editingVariant.id}`, {
          method: 'PUT',
          body: JSON.stringify(variantData)
        });
        if (!response.success) throw new Error(response.error || 'Failed to update variant');
        console.log('Variant updated successfully. Main product pricing preserved.');
      } else {
        // CRITICAL: Only insert into product_variants table, never modify products table
        const response = await apiCall(`/product-variants/product/${productId}/variants`, {
          method: 'POST',
          body: JSON.stringify(variantData)
        });
        if (!response.success) throw new Error(response.error || 'Failed to add variant');
        console.log('Variant added successfully. Main product pricing preserved.');
      }

      await fetchVariants();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Error saving variant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (variantId) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    setLoading(true);
    try {
      const response = await apiCall(`/product-variants/variant/${variantId}`, {
        method: 'DELETE'
      });
      if (!response.success) throw new Error(response.error || 'Failed to delete variant');
      await fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    const weightParts = variant.variant_weight ? variant.variant_weight.split(' ') : ['', 'kg'];
    setWeightValue(weightParts[0] || '');
    setSelectedUnit(weightParts[1] || 'kg');
    setForm({
      variant_name: variant.variant_name,
      variant_price: variant.variant_price,
      variant_old_price: variant.variant_old_price || 0,
      variant_discount: variant.variant_discount || 0,
      variant_stock: variant.variant_stock || 0,
      variant_weight: variant.variant_weight || '',
      variant_unit: variant.variant_unit || 'kg',
      shipping_amount: variant.shipping_amount || 0,
      is_default: variant.is_default || false,
      variant_image_url: variant.variant_image_url || '',
    });
    setImagePreview(variant.variant_image_url);
    setImageFile(null);
    setModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      variant_name: '',
      variant_price: 0,
      variant_old_price: 0,
      variant_discount: 0,
      variant_stock: 0,
      variant_weight: '',
      variant_unit: 'kg',
      shipping_amount: 0,
      is_default: false,
      variant_image_url: '',
    });
    setWeightValue('');
    setSelectedUnit('kg');
    setEditingVariant(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(form.variant_image_url);
    }
  };

  const updateVariantWeight = (value, unit) => {
    const weightString = value && unit ? `${value} ${unit}` : '';
    setForm(prev => ({ ...prev, variant_weight: weightString, variant_unit: unit }));
  };

  const handleWeightChange = (value) => {
    setWeightValue(value);
    updateVariantWeight(value, selectedUnit);
  };

  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    updateVariantWeight(weightValue, unit);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <Card shadow="sm" p="lg" radius="md">
      <LoadingOverlay visible={loading} />
      
      <Group position="apart" mb="md">
        <Title order={3}>Product Variants - {productName}</Title>
        <Button leftIcon={<FaPlus size={16} />} onClick={openAddModal}>
          Add Variant
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Weight</th>
            <th>Price</th>
            <th>Old Price</th>
            <th>Stock</th>
            <th>Shipping</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id}>
              <td>
                {variant.variant_image_url ? (
                  <Image
                    src={variant.variant_image_url}
                    alt={variant.variant_name}
                    width={40}
                    height={40}
                    fit="cover"
                    radius="sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <FaImage className="text-gray-400" size={16} />
                  </div>
                )}
              </td>
              <td>{variant.variant_name}</td>
              <td>{variant.variant_weight} {variant.variant_unit}</td>
              <td>₹{variant.variant_price}</td>
              <td>{variant.variant_old_price ? `₹${variant.variant_old_price}` : '-'}</td>
              <td>{variant.variant_stock}</td>
              <td>₹{variant.shipping_amount || 0}</td>
              <td>{variant.is_default ? 'Yes' : 'No'}</td>
              <td>
                <Group spacing="xs">
                  <ActionIcon color="blue" onClick={() => handleEdit(variant)}>
                    <FaEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" onClick={() => handleDelete(variant.id)}>
                    <FaTrash size={16} />
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {variants.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No variants found. Add some variants to get started.
        </div>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVariant ? 'Edit Variant' : 'Add New Variant'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Variant Name"
            placeholder="e.g., 10 kg Pack"
            required
            value={form.variant_name}
            onChange={(e) => setForm({ ...form, variant_name: e.target.value })}
            mb="md"
          />

          <div className="mb-4">
            <FileInput
              label="Variant Image"
              placeholder="Choose variant image"
              accept="image/*"
              value={imageFile}
              onChange={handleImageChange}
              mb="sm"
            />
            {imagePreview && (
              <div className="mt-2">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={100}
                  height={100}
                  fit="cover"
                  radius="md"
                />
              </div>
            )}
          </div>
          
          <TextInput
            label="Weight/Size"
            placeholder="e.g., 10 kg"
            value={form.variant_weight}
            onChange={(e) => setForm({ ...form, variant_weight: e.target.value })}
            mb="md"
          />

          <NumberInput
            label="Price"
            placeholder="Enter price"
            required
            value={form.variant_price}
            onChange={(value) => setForm({ ...form, variant_price: value })}
            min={0}
            mb="md"
          />

          <NumberInput
            label="Old Price (Optional)"
            placeholder="Enter old price"
            value={form.variant_old_price}
            onChange={(value) => setForm({ ...form, variant_old_price: value })}
            min={0}
            mb="md"
          />

          <NumberInput
            label="Stock Quantity"
            placeholder="Enter stock"
            value={form.variant_stock}
            onChange={(value) => setForm({ ...form, variant_stock: value })}
            min={0}
            mb="md"
          />

          <NumberInput
            label="Shipping Amount (₹)"
            placeholder="Enter shipping charges"
            value={form.shipping_amount}
            onChange={(value) => setForm({ ...form, shipping_amount: value })}
            min={0}
            mb="md"
          />

          <Switch
            label="Set as Default Variant"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.currentTarget.checked })}
            mb="md"
          />

          <Group position="right">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="blue">
              {editingVariant ? 'Update' : 'Add'} Variant
            </Button>
          </Group>
        </form>
      </Modal>
    </Card>
  );
};

export default ProductVariantsManager;