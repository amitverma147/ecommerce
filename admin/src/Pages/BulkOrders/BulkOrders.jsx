import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const BulkOrders = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('main');
  const [bulkSettings, setBulkSettings] = useState({
    min_quantity: 50,
    max_quantity: null,
    bulk_price: 0,
    discount_percentage: 0,
    is_bulk_enabled: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Get products with variants and bulk settings
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (
            id,
            variant_name,
            variant_price,
            variant_old_price,
            variant_weight,
            variant_unit,
            variant_stock
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (productsError) {
        console.error('Products fetch error:', productsError);
        throw productsError;
      }

      // Get bulk settings for products and variants
      const { data: bulkData, error: bulkError } = await supabase
        .from('bulk_product_settings')
        .select('*');
      
      if (bulkError) {
        console.error('Bulk settings fetch error:', bulkError);
      }
      
      const productsWithBulkSettings = (productsData || []).map(product => ({
        ...product,
        bulk_product_settings: (bulkData || []).filter(setting => setting.product_id === product.id),
        hasVariants: product.product_variants?.length > 0
      }));
      
      console.log('Fetched products with bulk settings:', productsWithBulkSettings);
      setProducts(productsWithBulkSettings);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openBulkModal = async (product, variant = null) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    setActiveTab(variant ? variant.id : 'main');
    
    // Load existing bulk settings for product or variant
    const existingSettings = variant 
      ? product.bulk_product_settings?.find(s => s.variant_id === variant.id)
      : product.bulk_product_settings?.find(s => !s.variant_id);
    
    const basePrice = variant ? variant.variant_price : product.price;
    
    setBulkSettings({
      min_quantity: existingSettings?.min_quantity || 50,
      max_quantity: existingSettings?.max_quantity || null,
      bulk_price: existingSettings?.bulk_price || basePrice,
      discount_percentage: existingSettings?.discount_percentage || 0,
      is_bulk_enabled: existingSettings?.is_bulk_enabled ?? true
    });
  };

  const updateBulkSettings = (field, value) => {
    setBulkSettings(prev => ({ ...prev, [field]: value }));
  };

  const calculateSavings = () => {
    const basePrice = selectedVariant ? selectedVariant.variant_price : selectedProduct.price;
    return basePrice - bulkSettings.bulk_price;
  };

  const getBulkSettingsForItem = (product, variant = null) => {
    return variant 
      ? product.bulk_product_settings?.find(s => s.variant_id === variant.id)
      : product.bulk_product_settings?.find(s => !s.variant_id);
  };

  const saveBulkSettings = async () => {
    try {
      if (!bulkSettings.min_quantity || !bulkSettings.bulk_price) {
        alert('Please fill in minimum quantity and bulk price');
        return;
      }

      // Check if settings exist
      let existingQuery = supabase
        .from('bulk_product_settings')
        .select('id')
        .eq('product_id', selectedProduct.id);
      
      if (selectedVariant) {
        existingQuery = existingQuery.eq('variant_id', selectedVariant.id);
      } else {
        existingQuery = existingQuery.is('variant_id', null);
      }
      
      const { data: existing } = await existingQuery.single();

      const settingsData = {
        product_id: selectedProduct.id,
        variant_id: selectedVariant?.id || null,
        min_quantity: parseInt(bulkSettings.min_quantity),
        max_quantity: bulkSettings.max_quantity ? parseInt(bulkSettings.max_quantity) : null,
        bulk_price: parseFloat(bulkSettings.bulk_price),
        discount_percentage: parseFloat(bulkSettings.discount_percentage),
        is_bulk_enabled: bulkSettings.is_bulk_enabled,
        is_variant_bulk: !!selectedVariant,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('bulk_product_settings')
          .update(settingsData)
          .eq('id', existing.id)
          .select();
        result = { data, error };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('bulk_product_settings')
          .insert([settingsData])
          .select();
        result = { data, error };
      }

      if (result.error) {
        throw result.error;
      }

      const itemType = selectedVariant ? `variant (${selectedVariant.variant_weight} ${selectedVariant.variant_unit})` : 'product';
      alert(`Bulk settings saved successfully for ${itemType}!`);
      
      setSelectedProduct(null);
      setSelectedVariant(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving bulk settings:', error);
      alert('Error saving bulk settings: ' + error.message);
    }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2">Loading products...</span>
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Bulk Orders Management</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found in database</p>
          <p className="text-gray-400 text-sm mt-2">Add some products first to configure wholesale pricing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Orders Management</h1>
          <p className="text-gray-600 mt-1">Configure bulk pricing for products and variants</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Products: {products.length}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const mainBulkSettings = getBulkSettingsForItem(product);
          const variantBulkCount = product.product_variants?.filter(v => 
            getBulkSettingsForItem(product, v)
          ).length || 0;
          
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-4 border">
              <img 
                src={product.image || '/placeholder.png'} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">₹{product.price}</p>
              
              {/* Variants Info */}
              {product.hasVariants && (
                <div className="mb-3">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {product.product_variants?.length} Variants
                  </span>
                </div>
              )}
              
              {/* Bulk Status Display */}
              <div className="space-y-2 mb-4">
                {/* Main Product Bulk Status */}
                <div className={`border rounded p-2 ${
                  mainBulkSettings?.is_bulk_enabled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Main Product</span>
                    {mainBulkSettings?.is_bulk_enabled ? (
                      <span className="text-xs text-green-600 font-medium">✅ Bulk Enabled</span>
                    ) : (
                      <span className="text-xs text-gray-500">⚪ No Bulk</span>
                    )}
                  </div>
                  {mainBulkSettings?.is_bulk_enabled && (
                    <div className="text-xs text-gray-600 mt-1">
                      Min: {mainBulkSettings.min_quantity} • Price: ₹{mainBulkSettings.bulk_price}
                    </div>
                  )}
                </div>
                
                {/* Variants Bulk Status */}
                {product.hasVariants && (
                  <div className={`border rounded p-2 ${
                    variantBulkCount > 0 
                      ? 'bg-purple-50 border-purple-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Variants</span>
                      <span className="text-xs font-medium">
                        {variantBulkCount > 0 
                          ? `✅ ${variantBulkCount}/${product.product_variants?.length} Enabled`
                          : '⚪ No Bulk'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => openBulkModal(product)}
                  className={`w-full py-2 px-4 rounded text-sm font-medium ${
                    mainBulkSettings?.is_bulk_enabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {mainBulkSettings?.is_bulk_enabled ? 'Edit Main Bulk' : 'Setup Main Bulk'}
                </button>
                
                {product.hasVariants && (
                  <button
                    onClick={() => openBulkModal(product, product.product_variants[0])}
                    className={`w-full py-2 px-4 rounded text-sm font-medium ${
                      variantBulkCount > 0
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {variantBulkCount > 0 ? 'Manage Variant Bulk' : 'Setup Variant Bulk'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              Configure Bulk Settings for {selectedProduct.name}
              {selectedVariant && (
                <span className="text-purple-600 block text-sm font-normal">
                  Variant: {selectedVariant.variant_weight} {selectedVariant.variant_unit}
                </span>
              )}
            </h2>
            
            {/* Variant Tabs */}
            {selectedProduct.hasVariants && (
              <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
                <button
                  onClick={() => {
                    setSelectedVariant(null);
                    setActiveTab('main');
                    const mainSettings = getBulkSettingsForItem(selectedProduct);
                    setBulkSettings({
                      min_quantity: mainSettings?.min_quantity || 50,
                      bulk_price: mainSettings?.bulk_price || selectedProduct.price,
                      discount_percentage: mainSettings?.discount_percentage || 0,
                      is_bulk_enabled: mainSettings?.is_bulk_enabled ?? true
                    });
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'main'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                  }`}
                >
                  Main Product (₹{selectedProduct.price})
                </button>
                {selectedProduct.product_variants?.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setActiveTab(variant.id);
                      const variantSettings = getBulkSettingsForItem(selectedProduct, variant);
                      setBulkSettings({
                        min_quantity: variantSettings?.min_quantity || 50,
                        bulk_price: variantSettings?.bulk_price || variant.variant_price,
                        discount_percentage: variantSettings?.discount_percentage || 0,
                        is_bulk_enabled: variantSettings?.is_bulk_enabled ?? true
                      });
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === variant.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
                    }`}
                  >
                    {variant.variant_weight} {variant.variant_unit} (₹{variant.variant_price})
                  </button>
                ))}
              </div>
            )}
            
            {/* Bulk Settings Form */}
            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Enable Bulk Pricing</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSettings.is_bulk_enabled}
                    onChange={(e) => updateBulkSettings('is_bulk_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {bulkSettings.is_bulk_enabled && (
                <>
                  {/* Min Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Quantity</label>
                    <input
                      type="number"
                      value={bulkSettings.min_quantity}
                      onChange={(e) => updateBulkSettings('min_quantity', parseInt(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="50"
                      min="1"
                    />
                  </div>
                  
                  {/* Max Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Maximum Quantity (Optional)</label>
                    <input
                      type="number"
                      value={bulkSettings.max_quantity || ''}
                      onChange={(e) => updateBulkSettings('max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave empty for unlimited"
                      min={bulkSettings.min_quantity + 1}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited quantity</p>
                  </div>
                  
                  {/* Bulk Price */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Bulk Price per Unit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkSettings.bulk_price}
                      onChange={(e) => updateBulkSettings('bulk_price', parseFloat(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                  
                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkSettings.discount_percentage}
                      onChange={(e) => updateBulkSettings('discount_percentage', parseFloat(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  {/* Price Calculation Preview */}
                  {bulkSettings.min_quantity && bulkSettings.bulk_price && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">📊 Bulk Order Preview</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Regular Price:</span>
                          <p className="font-semibold text-lg">
                            ₹{selectedVariant ? selectedVariant.variant_price : selectedProduct.price}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Bulk Price:</span>
                          <p className="font-semibold text-lg text-blue-600">
                            ₹{bulkSettings.bulk_price}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-blue-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Quantity Range:</span>
                          <span className="font-medium">
                            {bulkSettings.min_quantity} - {bulkSettings.max_quantity || '∞'} units
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-xl text-blue-800">
                            ₹{(bulkSettings.bulk_price * bulkSettings.min_quantity).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-green-600">
                          <span className="font-medium">Customer Saves:</span>
                          <span className="font-semibold">
                            ₹{(calculateSavings() * bulkSettings.min_quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                }}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveBulkSettings}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 font-medium"
              >
                Save Bulk Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOrders;