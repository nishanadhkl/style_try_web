import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { productAPI, categoryAPI, variantAPI } from '../../services/api';

export default function AdminProducts() {
  const { admin, logout } = useContext(AdminContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    stockQuantity: '',
    categoryId: '',
    imageUrl: '',
    active: true,
  });
  const [variantFormData, setVariantFormData] = useState({
    size: '',
    color: '',
    price: '',
    stockQuantity: '',
    sku: '',
    imageUrl: '',
    active: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    productId: null,
    productName: '',
  });

  const getResponseList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.content)) return responseData.content;
    return [];
  };

  // Load products and categories on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(getResponseList(response.data));
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
      // Fallback to empty array
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(getResponseList(response.data));
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to default categories
      setCategories([
        { id: 1, name: 'Men' },
        { id: 2, name: 'Women' },
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const normalizePrice = (price) => {
    if (!price) return '';
    const trimmed = price.trim();
    if (trimmed.startsWith('Rs')) {
      return trimmed.replace(/^Rs\.?\s*/i, 'Rs ');
    }
    return `Rs ${trimmed}`;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.brand ||
      !formData.description ||
      !formData.price ||
      !formData.stockQuantity ||
      !formData.categoryId
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const productPayload = {
        ...formData,
        price: parseFloat(formData.price.replace(/[^\d.]/g, '')),
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: parseInt(formData.categoryId),
      };

      let savedProductId;

      if (editingId) {
        await productAPI.update(editingId, productPayload);
        savedProductId = editingId;
      } else {
        const response = await productAPI.create(productPayload);
        const createdProduct = response.data?.data || response.data;
        savedProductId = createdProduct.id;
      }

      await loadProducts();

      // Keep form open and show variants section for new product
      setEditingId(savedProductId);
      setSelectedProductId(savedProductId);
      loadVariants(savedProductId);

      // Reset form but keep it open
      resetForm();

      alert(editingId ? 'Product updated successfully' : 'Product created! Now add variants below.');
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      stockQuantity: product.stockQuantity?.toString() || '',
      categoryId: product.categoryId?.toString() || '',
      imageUrl: product.imageUrl || '',
      active: product.active ?? true,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const requestDelete = (product) => {
    setDeleteConfirm({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const confirmDelete = async () => {
    try {
      await productAPI.delete(deleteConfirm.productId);
      await loadProducts(); // Reload products after deletion
      setDeleteConfirm({ open: false, productId: null, productName: '' });
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ open: false, productId: null, productName: '' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedProductId(null);
    setVariants([]);
    resetForm();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ─── Variant Functions ─────────────────────────────────────────────────
  const loadVariants = async (productId) => {
    try {
      setVariantLoading(true);
      const response = await variantAPI.getByProductId(productId);
      setVariants(getResponseList(response.data));
    } catch (err) {
      console.error('Error loading variants:', err);
      setVariants([]);
    } finally {
      setVariantLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    handleEdit(product);
    setSelectedProductId(product.id);
    loadVariants(product.id);
  };

  const resetVariantForm = () => {
    setVariantFormData({
      size: '',
      color: '',
      price: '',
      stockQuantity: '',
      sku: '',
      imageUrl: '',
      active: true,
    });
  };

  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();

    if (!selectedProductId || !variantFormData.size || !variantFormData.color ||
        !variantFormData.price || !variantFormData.stockQuantity) {
      alert('Please fill in all required variant fields');
      return;
    }

    try {
      const payload = {
        productId: selectedProductId,
        size: variantFormData.size,
        color: variantFormData.color,
        price: parseFloat(variantFormData.price),
        stockQuantity: parseInt(variantFormData.stockQuantity),
        sku: variantFormData.sku,
        imageUrl: variantFormData.imageUrl,
        active: variantFormData.active,
      };

      if (editingVariantId) {
        await variantAPI.update(editingVariantId, payload);
        alert('Variant updated successfully');
      } else {
        await variantAPI.create(payload);
        alert('Variant created successfully');
      }

      loadVariants(selectedProductId);
      setShowVariantForm(false);
      setEditingVariantId(null);
      resetVariantForm();
    } catch (err) {
      console.error('Error saving variant:', err);
      alert('Failed to save variant. Please try again.');
    }
  };

  const handleEditVariant = (variant) => {
    setVariantFormData({
      size: variant.size,
      color: variant.color,
      price: variant.price.toString(),
      stockQuantity: variant.stockQuantity.toString(),
      sku: variant.sku || '',
      imageUrl: variant.imageUrl || '',
      active: variant.active,
    });
    setEditingVariantId(variant.id);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      await variantAPI.delete(id);
      alert('Variant deleted successfully');
      loadVariants(selectedProductId);
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert('Failed to delete variant');
    }
  };

  const handleVariantFormCancel = () => {
    setShowVariantForm(false);
    setEditingVariantId(null);
    resetVariantForm();
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Products Management</h1>
          <div className="admin-header-actions">
            <span className="admin-user-info">Welcome, {admin?.username}!</span>
            <button
              onClick={() => setShowForm(true)}
              className="admin-add-button"
            >
              ➕ Add New Product
            </button>
            <button onClick={handleLogout} className="admin-logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sidebar */}
      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link">
            📊 Dashboard
          </a>
          <a href="/admin/products" className="admin-nav-link admin-nav-link--active">
            📦 Products
          </a>
          <a href="/admin/orders" className="admin-nav-link">
            🛒 Orders
          </a>
          <a href="/admin/users" className="admin-nav-link">
            👥 Users
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <main className="admin-main">
        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="admin-form-modal" onClick={handleCancel}>
            <div className="admin-form-card" onClick={(e) => e.stopPropagation()}>
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

              <form onSubmit={handleAddProduct} className="admin-product-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="admin-form-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand || ''}
                      onChange={handleInputChange}
                      placeholder="Enter brand name"
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price *</label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Rs 2,599"
                      className="admin-form-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleInputChange}
                      className="admin-form-input"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity || ''}
                      onChange={handleInputChange}
                      placeholder="Enter stock quantity"
                      className="admin-form-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl || ''}
                      onChange={handleInputChange}
                      placeholder="Enter image URL"
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group admin-form-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active ?? true}
                        onChange={handleInputChange}
                      />
                      {' '}Active
                    </label>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    className="admin-form-textarea"
                    rows="4"
                  ></textarea>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-form-submit-button">
                    {editingId ? 'Update Product' : 'Add Product'}
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

              {/* Variants Section - Only show when editing a product */}
              {editingId && selectedProductId && (
                <div className="product-variants-section">
                  <h3 className="variants-section-title">Product Variants</h3>

                  <button
                    onClick={() => {
                      resetVariantForm();
                      setEditingVariantId(null);
                      setShowVariantForm(true);
                    }}
                    className="admin-add-button"
                    style={{ marginBottom: '1rem' }}
                  >
                    ➕ Add Variant
                  </button>

                  {/* Variant Form */}
                  {showVariantForm && (
                    <div className="variant-form-container">
                      <form onSubmit={handleAddVariant} className="admin-variant-form">
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>Size *</label>
                            <input
                              type="text"
                              name="size"
                              value={variantFormData.size}
                              onChange={handleVariantInputChange}
                              placeholder="e.g., S, M, L, XL"
                              className="admin-form-input"
                            />
                          </div>

                          <div className="admin-form-group">
                            <label>Color *</label>
                            <input
                              type="text"
                              name="color"
                              value={variantFormData.color}
                              onChange={handleVariantInputChange}
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
                              value={variantFormData.price}
                              onChange={handleVariantInputChange}
                              placeholder="e.g., 2599"
                              className="admin-form-input"
                            />
                          </div>

                          <div className="admin-form-group">
                            <label>Stock Quantity *</label>
                            <input
                              type="number"
                              name="stockQuantity"
                              value={variantFormData.stockQuantity}
                              onChange={handleVariantInputChange}
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
                              value={variantFormData.sku}
                              onChange={handleVariantInputChange}
                              placeholder="e.g., PROD-001-S-RED"
                              className="admin-form-input"
                            />
                          </div>

                          <div className="admin-form-group">
                            <label>Image URL</label>
                            <input
                              type="text"
                              name="imageUrl"
                              value={variantFormData.imageUrl}
                              onChange={handleVariantInputChange}
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
                              checked={variantFormData.active}
                              onChange={handleVariantInputChange}
                            />
                            {' '}Active
                          </label>
                        </div>

                        <div className="admin-form-actions">
                          <button type="submit" className="admin-form-submit-button">
                            {editingVariantId ? 'Update Variant' : 'Add Variant'}
                          </button>
                          <button
                            type="button"
                            onClick={handleVariantFormCancel}
                            className="admin-form-cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Variants List */}
                  {variantLoading && <p>Loading variants...</p>}

                  {!variantLoading && variants.length === 0 && (
                    <p className="admin-no-data">No variants yet. Add one to get started!</p>
                  )}

                  {!variantLoading && variants.length > 0 && (
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
                                  onClick={() => handleEditVariant(variant)}
                                  className="admin-edit-button"
                                  title="Edit variant"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteVariant(variant.id)}
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
                </div>
              )}
            </div>
          </div>
        )}

        {deleteConfirm.open && (
          <div className="admin-confirm-modal" onClick={cancelDelete}>
            <div className="admin-confirm-card" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm delete</h2>
              <p>
                Are you sure you want to permanently delete
                <strong> {deleteConfirm.productName}</strong>?
              </p>
              <div className="admin-confirm-actions">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="admin-form-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="admin-form-submit-button"
                >
                  Delete product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <section className="admin-products-section">
          <h2 className="admin-section-title">
            All Products ({products.length})
          </h2>

          {loading && (
            <div className="admin-loading">
              <p>Loading products...</p>
            </div>
          )}

          {error && (
            <div className="admin-error">
              <p>{error}</p>
              <button onClick={loadProducts} className="admin-retry-button">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Active</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td>{product.brand}</td>
                      <td>{product.price}</td>
                      <td>
                        <span className="admin-badge">
                          {product.categoryName || categories.find(cat => cat.id === product.categoryId)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${
                            product.stockQuantity < 20 ? 'stock-low' : 'stock-high'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td>{product.active ? 'Yes' : 'No'}</td>
                      <td className="description-cell">{product.description}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="admin-edit-button"
                          title="Edit product"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => requestDelete(product)}
                          className="admin-delete-button"
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data-message">
                      No products found. Click "Add New Product" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </section>
      </main>
    </div>
  );
}
