import { useState, useEffect } from 'react';
import { variantAPI, productAPI } from '../../services/api';

export default function AdminVariants() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    size: '',
    color: '',
    price: '',
    stockQuantity: '',
    sku: '',
    imageUrl: '',
    active: true,
  });

  const getResponseList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.content)) return responseData.content;
    return [];
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(getResponseList(response.data));
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  // Load variants when product is selected
  const handleProductSelect = async (productId) => {
    setSelectedProduct(productId);
    setShowForm(false);
    setEditingId(null);
    resetForm();

    try {
      setLoading(true);
      const response = await variantAPI.getByProductId(productId);
      setVariants(getResponseList(response.data));
    } catch (err) {
      console.error('Error loading variants:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      size: '',
      color: '',
      price: '',
      stockQuantity: '',
      sku: '',
      imageUrl: '',
      active: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !formData.size || !formData.color || !formData.price || !formData.stockQuantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        productId: selectedProduct,
        size: formData.size,
        color: formData.color,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        sku: formData.sku,
        imageUrl: formData.imageUrl,
        active: formData.active,
      };

      if (editingId) {
        await variantAPI.update(editingId, payload);
        alert('Variant updated successfully');
      } else {
        await variantAPI.create(payload);
        alert('Variant created successfully');
      }

      handleProductSelect(selectedProduct);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving variant:', err);
      alert('Failed to save variant. Please try again.');
    }
  };

  const handleEdit = (variant) => {
    setFormData({
      size: variant.size,
      color: variant.color,
      price: variant.price.toString(),
      stockQuantity: variant.stockQuantity.toString(),
      sku: variant.sku || '',
      imageUrl: variant.imageUrl || '',
      active: variant.active,
    });
    setEditingId(variant.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      await variantAPI.delete(id);
      alert('Variant deleted successfully');
      handleProductSelect(selectedProduct);
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert('Failed to delete variant');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Product Variants</h1>
        </div>
      </header>

      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link">
            📊 Dashboard
          </a>
          <a href="/admin/products" className="admin-nav-link">
            📦 Products
          </a>
          <a href="/admin/variants" className="admin-nav-link admin-nav-link--active">
            🎨 Variants
          </a>
        </nav>
      </div>

      <main className="admin-main">
        {/* Product Selection */}
        <section className="admin-section">
          <h2 className="admin-section-title">Select Product</h2>
          <div className="variant-product-selector">
            <select
              value={selectedProduct || ''}
              onChange={(e) => handleProductSelect(e.target.value ? parseInt(e.target.value) : null)}
              className="admin-form-input"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {selectedProduct && (
          <>
            {/* Add Variant Button */}
            <section className="admin-section">
              <button
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="admin-add-button"
              >
                ➕ Add Variant
              </button>
            </section>

            {/* Form */}
            {showForm && (
              <div className="admin-form-modal" onClick={handleCancel}>
                <div className="admin-form-card" onClick={(e) => e.stopPropagation()}>
                  <h2>{editingId ? 'Edit Variant' : 'Add New Variant'}</h2>
                  <form onSubmit={handleSubmit} className="admin-variant-form">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Size *</label>
                      <input
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        placeholder="e.g., S, M, L, XL"
                        className="admin-form-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Color *</label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        placeholder="e.g., Red, Blue, Black"
                        className="admin-form-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="e.g., 2599"
                        className="admin-form-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Stock Quantity *</label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleInputChange}
                        placeholder="e.g., 50"
                        className="admin-form-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="e.g., PROD-001-S-RED"
                        className="admin-form-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Image URL</label>
                      <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="admin-form-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group admin-form-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                      />
                      {' '}Active
                    </label>
                  </div>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-form-submit-button">
                      {editingId ? 'Update Variant' : 'Add Variant'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="admin-form-cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
            )}

            {/* Variants Table */}
            <section className="admin-section">
              <h2 className="admin-section-title">Variants</h2>

              {loading && <p>Loading variants...</p>}

              {!loading && variants.length === 0 && (
                <p className="admin-no-data">No variants found. Add one to get started!</p>
              )}

              {!loading && variants.length > 0 && (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>SKU</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => (
                        <tr key={variant.id}>
                          <td>{variant.size}</td>
                          <td>{variant.color}</td>
                          <td>Rs {variant.price}</td>
                          <td>{variant.stockQuantity}</td>
                          <td>{variant.sku || '-'}</td>
                          <td>{variant.active ? '✅' : '❌'}</td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleEdit(variant)}
                              className="admin-edit-button"
                              title="Edit variant"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(variant.id)}
                              className="admin-delete-button"
                              title="Delete variant"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
