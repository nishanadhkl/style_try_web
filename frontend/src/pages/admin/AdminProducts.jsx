import { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    productId: null,
    productName: '',
  });

  // Load products and categories on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
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
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to default categories
      setCategories([
        { id: 1, name: 'Men' },
        { id: 2, name: 'Women' },
        { id: 3, name: 'Accessories' },
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

    if (!formData.name || !formData.price || !formData.stockQuantity || !formData.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const productPayload = {
        ...formData,
        price: parseFloat(formData.price.replace(/[^\d.]/g, '')), // Extract numeric value
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: parseInt(formData.categoryId),
      };

      if (editingId) {
        // Edit existing product
        await productAPI.update(editingId, productPayload);
        setEditingId(null);
      } else {
        // Add new product
        await productAPI.create(productPayload);
      }

      // Reload products
      await loadProducts();

      // Reset form
      setFormData({
        name: '',
        brand: '',
        price: '',
        description: '',
        stockQuantity: '',
        categoryId: '',
        imageUrl: '',
        active: true,
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
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
    setFormData({
      name: '',
      brand: '',
      price: '',
      description: '',
      stockQuantity: '',
      category: 'Men',
      imageUrl: '',
      active: true,
    });
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Products Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="admin-add-button"
          >
            ➕ Add New Product
          </button>
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
          <div className="admin-form-modal">
            <div className="admin-form-card">
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

              <form onSubmit={handleAddProduct} className="admin-product-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
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
                      value={formData.brand}
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
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g., Rs 2,599"
                      className="admin-form-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
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
                      value={formData.stockQuantity}
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
                      value={formData.imageUrl}
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
                        checked={formData.active}
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
                    value={formData.description}
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
            </div>
          </div>
        )}

        {deleteConfirm.open && (
          <div className="admin-confirm-modal">
            <div className="admin-confirm-card">
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
                          {categories.find(cat => cat.id === product.categoryId)?.name || product.category || 'Unknown'}
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
                          onClick={() => handleEdit(product)}
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
                    <td colSpan="6" className="no-data-message">
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
