import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { productAPI, variantAPI } from '../../services/api';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Men' },
  { id: 2, name: 'Women' },
];

export default function AdminProducts() {
  const { admin, logout } = useContext(AdminContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0, first: true, last: true });
  const [deleteVariantConfirm, setDeleteVariantConfirm] = useState({ open: false, variantId: null });
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', imageUrl: '',
    stock: '', active: true, discountPercent: 0, isNewArrival: false,
  });
  const [variantFormData, setVariantFormData] = useState({
    size: '', color: '', price: '', stockQuantity: '', sku: '', imageUrl: '', active: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false, productId: null, productName: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getResponseList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.content)) return responseData.content;
    return [];
  };

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => { loadProducts(); }, [page, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll({ page, size: 10, q: searchTerm || undefined });
      const payload = response.data?.data || response.data || {};
      const data = Array.isArray(payload) ? payload : payload.content || [];
      setProducts(data);
      setPageInfo({
        totalPages: payload.totalPages || 1,
        totalElements: payload.totalElements ?? data.length,
        first: payload.first ?? true,
        last: payload.last ?? true,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', category: '', imageUrl: '',
      stock: '', active: true, discountPercent: 0, isNewArrival: false,
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      showToast('Please fill in all required fields (Name, Price, Stock, Category)', 'error');
      return;
    }
    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(String(formData.price).replace(/[^\d.]/g, '')),
        category: formData.category,
        imageUrl: formData.imageUrl,
        stock: parseInt(formData.stock),
        active: formData.active,
        discountPercent: parseInt(formData.discountPercent) || 0,
        isNewArrival: formData.isNewArrival,
      };
      let savedProductId;
      if (editingId) {
        await productAPI.update(editingId, productPayload);
        savedProductId = editingId;
        showToast('Product updated successfully!');
      } else {
        const response = await productAPI.create(productPayload);
        const createdProduct = response.data?.data || response.data;
        savedProductId = createdProduct.id;
        showToast('Product created! Now add variants below.');
      }
      await loadProducts();
      setEditingId(savedProductId);
      setSelectedProductId(savedProductId);
      loadVariants(savedProductId);
      resetForm();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Please try again.';
      showToast(`Failed to save product: ${message}`, 'error');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      stock: product.stock?.toString() || '',
      active: product.active ?? true,
      discountPercent: product.discountPercent || 0,
      isNewArrival: product.isNewArrival || false,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const requestDelete = (product) => {
    setDeleteConfirm({ open: true, productId: product.id, productName: product.name });
  };

  const confirmDelete = async () => {
    try {
      await productAPI.delete(deleteConfirm.productId);
      await loadProducts();
      setDeleteConfirm({ open: false, productId: null, productName: '' });
      showToast('Product deleted successfully');
    } catch (err) {
      showToast('Failed to delete product', 'error');
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

  const handleLogout = () => { logout(); navigate('/'); };

  const loadVariants = async (productId) => {
    try {
      setVariantLoading(true);
      const response = await variantAPI.getByProductId(productId);
      setVariants(getResponseList(response.data));
    } catch (err) {
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
    setVariantFormData({ size: '', color: '', price: '', stockQuantity: '', sku: '', imageUrl: '', active: true });
  };

  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !variantFormData.size || !variantFormData.color || !variantFormData.price || !variantFormData.stockQuantity) {
      showToast('Please fill in all required variant fields', 'error');
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
        showToast('Variant updated successfully');
      } else {
        await variantAPI.create(payload);
        showToast('Variant added successfully');
      }
      loadVariants(selectedProductId);
      setShowVariantForm(false);
      setEditingVariantId(null);
      resetVariantForm();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Please try again.';
      showToast(`Failed to save variant: ${message}`, 'error');
    }
  };

  const handleEditVariant = (variant) => {
    setVariantFormData({
      size: variant.size, color: variant.color,
      price: variant.price.toString(), stockQuantity: variant.stockQuantity.toString(),
      sku: variant.sku || '', imageUrl: variant.imageUrl || '', active: variant.active,
    });
    setEditingVariantId(variant.id);
    setShowVariantForm(true);
  };

  const requestDeleteVariant = (id) => {
    setDeleteVariantConfirm({ open: true, variantId: id });
  };

  const confirmDeleteVariant = async () => {
    try {
      await variantAPI.delete(deleteVariantConfirm.variantId);
      setDeleteVariantConfirm({ open: false, variantId: null });
      loadVariants(selectedProductId);
      showToast('Variant deleted');
    } catch (err) {
      showToast('Failed to delete variant', 'error');
    }
  };

  return (
    <div className="admin-layout">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '1rem 1.5rem',
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color: 'white', borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '600', fontSize: '0.95rem'
        }}>
          {toast.msg}
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Products Management</h1>
          <div className="admin-header-actions">
            <span className="admin-user-info">Welcome, {admin?.username || 'Admin'}!</span>
            <button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }} className="admin-add-button">
              ➕ Add New Product
            </button>
            <button onClick={handleLogout} className="admin-logout-button">Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link">📊 Dashboard</a>
          <a href="/admin/products" className="admin-nav-link admin-nav-link--active">📦 Products</a>
          <a href="/admin/orders" className="admin-nav-link">🛒 Orders</a>
          <a href="/admin/users" className="admin-nav-link">👥 Users</a>
        </nav>
      </div>

      <main className="admin-main">
        {/* Product Form Modal */}
        {showForm && (
          <div className="admin-form-modal" onClick={handleCancel}>
            <div className="admin-form-card" onClick={(e) => e.stopPropagation()}>
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleAddProduct} className="admin-product-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter product name" className="admin-form-input" />
                  </div>
                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="admin-form-input">
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price *</label>
                    <input type="text" name="price" value={formData.price} onChange={handleInputChange} placeholder="e.g., 2599" className="admin-form-input" />
                  </div>
                  <div className="admin-form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="Enter stock quantity" className="admin-form-input" />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Image URL</label>
                    <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." className="admin-form-input" />
                  </div>
                  <div className="admin-form-group">
                    <label>Discount % <span style={{color:'#64748b', fontWeight:'400'}}>(0 = no discount)</span></label>
                    <input type="number" name="discountPercent" min="0" max="90" value={formData.discountPercent} onChange={handleInputChange} placeholder="e.g., 20" className="admin-form-input" />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group admin-form-checkbox-group">
                    <label>
                      <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} />
                      {' '}Active
                    </label>
                  </div>
                  <div className="admin-form-group admin-form-checkbox-group">
                    <label>
                      <input type="checkbox" name="isNewArrival" checked={formData.isNewArrival} onChange={handleInputChange} />
                      {' '}New Arrival
                    </label>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter product description" className="admin-form-textarea" rows="3" />
                </div>
                <div className="admin-form-actions">
                  <button type="submit" className="admin-form-submit-button">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                  <button type="button" onClick={handleCancel} className="admin-form-cancel-button">Cancel</button>
                </div>
              </form>

              {/* Variants Section */}
              {editingId && selectedProductId && (
                <div className="product-variants-section">
                  <h3 className="variants-section-title">Product Variants</h3>
                  <button onClick={() => { resetVariantForm(); setEditingVariantId(null); setShowVariantForm(true); }} className="admin-add-button" style={{ marginBottom: '1rem' }}>
                    ➕ Add Variant
                  </button>
                  {showVariantForm && (
                    <div className="variant-form-container">
                      <form onSubmit={handleAddVariant} className="admin-variant-form">
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>Size *</label>
                            <input type="text" name="size" value={variantFormData.size} onChange={handleVariantInputChange} placeholder="e.g., S, M, L, XL" className="admin-form-input" />
                          </div>
                          <div className="admin-form-group">
                            <label>Color *</label>
                            <input type="text" name="color" value={variantFormData.color} onChange={handleVariantInputChange} placeholder="e.g., Red, Blue" className="admin-form-input" />
                          </div>
                        </div>
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>Price *</label>
                            <input type="number" name="price" step="0.01" value={variantFormData.price} onChange={handleVariantInputChange} placeholder="e.g., 2599" className="admin-form-input" />
                          </div>
                          <div className="admin-form-group">
                            <label>Stock *</label>
                            <input type="number" name="stockQuantity" value={variantFormData.stockQuantity} onChange={handleVariantInputChange} placeholder="e.g., 50" className="admin-form-input" />
                          </div>
                        </div>
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>SKU</label>
                            <input type="text" name="sku" value={variantFormData.sku} onChange={handleVariantInputChange} placeholder="e.g., PROD-001-S-RED" className="admin-form-input" />
                          </div>
                          <div className="admin-form-group">
                            <label>Image URL</label>
                            <input type="text" name="imageUrl" value={variantFormData.imageUrl} onChange={handleVariantInputChange} placeholder="https://..." className="admin-form-input" />
                          </div>
                        </div>
                        <div className="admin-form-actions">
                          <button type="submit" className="admin-form-submit-button">{editingVariantId ? 'Update Variant' : 'Add Variant'}</button>
                          <button type="button" onClick={() => { setShowVariantForm(false); setEditingVariantId(null); resetVariantForm(); }} className="admin-form-cancel-button">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                  {variantLoading && <p>Loading variants...</p>}
                  {!variantLoading && variants.length === 0 && <p className="admin-no-data">No variants yet. Add one above!</p>}
                  {!variantLoading && variants.length > 0 && (
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Size</th><th>Color</th><th>Price</th><th>Stock</th><th>SKU</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {variants.map((v) => (
                            <tr key={v.id}>
                              <td>{v.size}</td><td>{v.color}</td>
                              <td>Rs {v.price}</td><td>{v.stockQuantity}</td>
                              <td>{v.sku || '-'}</td>
                              <td className="actions-cell">
                                <button onClick={() => handleEditVariant(v)} className="admin-edit-button">✏️</button>
                                <button onClick={() => requestDeleteVariant(v.id)} className="admin-delete-button">🗑️</button>
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

        {/* Delete Product Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="admin-confirm-modal" onClick={cancelDelete}>
            <div className="admin-confirm-card" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to permanently delete <strong>{deleteConfirm.productName}</strong>?</p>
              <div className="admin-confirm-actions">
                <button type="button" onClick={cancelDelete} className="admin-form-cancel-button">Cancel</button>
                <button type="button" onClick={confirmDelete} className="admin-form-submit-button">Delete Product</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Variant Confirmation Modal */}
        {deleteVariantConfirm.open && (
          <div className="admin-confirm-modal" onClick={() => setDeleteVariantConfirm({ open: false, variantId: null })}>
            <div className="admin-confirm-card" onClick={(e) => e.stopPropagation()}>
              <h2>Delete Variant</h2>
              <p>Are you sure you want to delete this variant?</p>
              <div className="admin-confirm-actions">
                <button type="button" onClick={() => setDeleteVariantConfirm({ open: false, variantId: null })} className="admin-form-cancel-button">Cancel</button>
                <button type="button" onClick={confirmDeleteVariant} className="admin-form-submit-button">Delete Variant</button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <section className="admin-products-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h2 className="admin-section-title" style={{ margin: 0 }}>All Products ({pageInfo.totalElements})</h2>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="admin-form-input"
              style={{ maxWidth: '320px' }}
            />
          </div>
          {loading && <p>Loading products...</p>}
          {error && <div><p>{error}</p><button onClick={loadProducts} className="admin-form-submit-button">Retry</button></div>}
          {!loading && !error && (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Name</th><th>Price</th><th>Category</th>
                    <th>Discount</th><th>New Arrival</th><th>Stock</th><th>Active</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td>Rs {product.price}</td>
                      <td><span className="admin-badge">{product.category}</span></td>
                      <td>
                        {product.discountPercent > 0 ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '0.8rem' }}>
                            -{product.discountPercent}%
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>None</span>
                        )}
                      </td>
                      <td>{product.isNewArrival ? <span style={{ color: '#10b981', fontWeight: '700' }}>✅ NEW</span> : '—'}</td>
                      <td><span className={`stock-badge ${product.stock < 20 ? 'stock-low' : 'stock-high'}`}>{product.stock}</span></td>
                      <td>{product.active ? '✅' : '❌'}</td>
                      <td className="actions-cell">
                        <button onClick={() => handleEditProduct(product)} className="admin-edit-button">✏️</button>
                        <button onClick={() => requestDelete(product)} className="admin-delete-button">🗑️</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="no-data-message">No products found.</td></tr>
                  )}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <button className="admin-form-cancel-button pagination-arrow-button" aria-label="Previous page" disabled={pageInfo.first} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                  &lt;
                </button>
                <span style={{ fontWeight: '700', color: '#4f46e5' }}>Page {page + 1} of {pageInfo.totalPages}</span>
                <button className="admin-form-cancel-button pagination-arrow-button" aria-label="Next page" disabled={pageInfo.last} onClick={() => setPage((value) => value + 1)}>
                  &gt;
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
