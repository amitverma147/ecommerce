import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEdit, FaSave, FaTimes, FaBox, FaPercentage } from 'react-icons/fa';
import { supabase } from '../../utils/supabase.js';

const BulkProductSettings = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    min_quantity: 50,
    bulk_price: 0,
    discount_percentage: 0,
    is_bulk_enabled: true,
    variant_id: null
  });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTabs, setActiveTabs] = useState({}); // Track active tab for each product
  const itemsPerPage = 6;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const bulkSettings = product.bulk_product_settings?.[0];
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && bulkSettings?.is_bulk_enabled !== false) ||
      (statusFilter === 'disabled' && bulkSettings?.is_bulk_enabled === false);
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Get products with variants
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, image, price,
          product_variants (
            id,
            variant_name,
            variant_price,
            variant_weight,
            variant_unit,
            variant_stock
          )
        `)
        .order('name');
      
      if (productsError) throw productsError;
      
      // Get bulk settings for all products and variants
      const { data: bulkSettings, error: bulkError } = await supabase
        .from('bulk_product_settings')
        .select('*');
      
      if (bulkError) throw bulkError;
      
      // Combine the data
      const data = productsData.map(product => ({
        ...product,
        bulk_product_settings: bulkSettings.filter(setting => setting.product_id === product.id),
        hasVariants: product.product_variants?.length > 0
      }));

      console.log('🔍 Raw data from database:', data);
      console.log('📊 Products with bulk settings:', 
        data?.filter(p => p.bulk_product_settings?.length > 0)
          .map(p => ({
            name: p.name,
            bulk_settings: p.bulk_product_settings[0]
          }))
      );
      
      setProducts(data || []);
      console.log('✅ Products loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product, variant = null) => {
    setEditingProduct(product.id);
    setSelectedVariant(variant);
    
    // Find bulk settings for product or variant
    const bulkSettings = variant 
      ? product.bulk_product_settings?.find(s => s.variant_id === variant.id)
      : product.bulk_product_settings?.find(s => !s.variant_id);
    
    const basePrice = variant ? variant.variant_price : product.price;
    
    setFormData({
      min_quantity: bulkSettings?.min_quantity || 50,
      bulk_price: bulkSettings?.bulk_price || basePrice,
      discount_percentage: bulkSettings?.discount_percentage || 0,
      is_bulk_enabled: bulkSettings?.is_bulk_enabled ?? true,
      variant_id: variant?.id || null
    });
  };

  const handleSave = async (productId) => {
    try {
      console.log('Saving data:', formData, 'for product:', productId);
      
      // Update UI immediately
      setProducts(prevProducts => 
        prevProducts.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              bulk_product_settings: [{
                ...formData,
                id: product.bulk_product_settings?.[0]?.id || Date.now(),
                product_id: productId
              }]
            };
          }
          return product;
        })
      );
      
      // Check if bulk settings exist for product or variant
      let existingQuery = supabase
        .from('bulk_product_settings')
        .select('id')
        .eq('product_id', productId);
      
      if (formData.variant_id) {
        existingQuery = existingQuery.eq('variant_id', formData.variant_id);
      } else {
        existingQuery = existingQuery.is('variant_id', null);
      }
      
      const { data: existing, error: checkError } = await existingQuery.maybeSingle();
      
      console.log('🔍 Existing record check:', { existing, checkError });

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('bulk_product_settings')
          .update({
            min_quantity: formData.min_quantity,
            bulk_price: formData.bulk_price,
            discount_percentage: formData.discount_percentage,
            is_bulk_enabled: formData.is_bulk_enabled,
            is_variant_bulk: !!formData.variant_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select();
        
        result = { data, error };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('bulk_product_settings')
          .insert([{
            product_id: productId,
            variant_id: formData.variant_id || null,
            min_quantity: formData.min_quantity,
            bulk_price: formData.bulk_price,
            discount_percentage: formData.discount_percentage,
            is_bulk_enabled: formData.is_bulk_enabled,
            is_variant_bulk: !!formData.variant_id
          }])
          .select();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('❌ Database save failed:', result.error);
        toast.error('Failed to save: ' + result.error.message);
        // Revert UI changes on error
        fetchProducts();
      } else {
        console.log('✅ Database save successful:', result.data);
        console.log('📊 Saved values:', {
          product_id: productId,
          min_quantity: formData.min_quantity,
          bulk_price: formData.bulk_price,
          discount_percentage: formData.discount_percentage,
          is_bulk_enabled: formData.is_bulk_enabled
        });
        toast.success('Bulk settings saved successfully!');
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
      // Revert UI changes on error
      fetchProducts();
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setSelectedVariant(null);
    setFormData({
      min_quantity: 50,
      bulk_price: 0,
      discount_percentage: 0,
      is_bulk_enabled: true,
      variant_id: null
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bulk Product Settings</h1>
          <p className="text-gray-600 mt-1">Configure bulk pricing and quantities for your products</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Products</option>
            <option value="enabled">Bulk Enabled</option>
            <option value="disabled">Bulk Disabled</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <FaBox className="text-blue-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-700">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <FaEdit className="text-green-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Bulk Enabled</p>
              <p className="text-2xl font-bold text-green-700">
                {products.filter(p => p.bulk_product_settings?.[0]?.is_bulk_enabled !== false).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <FaPercentage className="text-orange-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-orange-600 font-medium">With Discounts</p>
              <p className="text-2xl font-bold text-orange-700">
                {products.filter(p => (p.bulk_product_settings?.[0]?.discount_percentage || 0) > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => {
          const isEditing = editingProduct === product.id;
          const activeTab = activeTabs[product.id] || 'main';
          
          const setActiveTab = (tab) => {
            setActiveTabs(prev => ({ ...prev, [product.id]: tab }));
          };
          
          // Get current bulk settings based on selected tab
          const getCurrentBulkSettings = () => {
            if (activeTab === 'main') {
              return product.bulk_product_settings?.find(s => !s.variant_id);
            } else {
              return product.bulk_product_settings?.find(s => s.variant_id === activeTab);
            }
          };
          
          const bulkSettings = getCurrentBulkSettings();
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
              {/* Product Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                      src={product.image || '/placeholder.png'}
                      alt={product.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">Product ID: {product.id}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl font-bold text-blue-600">₹{product.price}</span>
                      <span className="ml-2 text-sm text-gray-500">Regular Price</span>
                    </div>
                    {product.hasVariants && (
                      <div className="mt-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {product.product_variants?.length} Variants Available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Variant Tabs */}
              {product.hasVariants && (
                <div className="px-6 pt-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab('main')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'main'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Main Product
                    </button>
                    {product.product_variants?.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setActiveTab(variant.id)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === variant.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {variant.variant_weight} {variant.variant_unit}
                      </button>
                    ))}
                  </div>
                  
                  {/* Current Selection Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    {activeTab === 'main' ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">Main Product Settings</div>
                        <div className="text-xs text-gray-600">Base price: ₹{product.price}</div>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const variant = product.product_variants?.find(v => v.id === activeTab);
                          return variant ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Variant: {variant.variant_weight} {variant.variant_unit}
                              </div>
                              <div className="text-xs text-gray-600">
                                Price: ₹{variant.variant_price} • Stock: {variant.variant_stock}
                              </div>
                            </div>
                          ) : null;
                        })()
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bulk Settings */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Bulk Order Status</span>
                    {isEditing ? (
                      <select
                        value={formData.is_bulk_enabled}
                        onChange={(e) => setFormData({...formData, is_bulk_enabled: e.target.value === 'true'})}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        bulkSettings?.is_bulk_enabled !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bulkSettings?.is_bulk_enabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {/* Min Quantity */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Min Quantity</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value)})}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {bulkSettings?.min_quantity || 50} units
                      </span>
                    )}
                  </div>

                  {/* Bulk Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Bulk Price</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.bulk_price}
                        onChange={(e) => setFormData({...formData, bulk_price: parseFloat(e.target.value) || 0})}
                        className="w-28 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-green-600">
                        ₹{bulkSettings?.bulk_price || product.price}
                      </span>
                    )}
                  </div>

                  {/* Discount Percentage */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Discount</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-orange-600">
                        {bulkSettings?.discount_percentage || 0}% OFF
                      </span>
                    )}
                  </div>

                  {/* Savings Calculation */}
                  {!isEditing && bulkSettings && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-4">
                      <div className="text-xs text-blue-600 font-medium mb-1">Savings per unit:</div>
                      <div className="text-lg font-bold text-blue-700">
                        ₹{(product.price - (bulkSettings.bulk_price || product.price)).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSave(product.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <FaSave className="w-4 h-4" />
                      <span>Save Settings</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <FaTimes className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const variant = activeTab === 'main' ? null : product.product_variants?.find(v => v.id === activeTab);
                      handleEdit(product, variant);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <FaEdit className="w-4 h-4" />
                    <span>
                      Setup Bulk Order {activeTab !== 'main' ? '(Variant)' : '(Main Product)'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg border ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Results info */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
      </div>
    </div>
  );
};

export default BulkProductSettings;