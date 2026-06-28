import { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const CATEGORY_LABELS = {
  men: "Men's Fashion",
  women: "Women's Fashion",
  sale: 'Sale',
  new: 'New Arrivals',
};

export default function Shop() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState(null);

  const { addToCart } = useContext(CartContext);
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getAll();
      let data = response.data?.data || response.data || [];
      if (!Array.isArray(data)) data = [];

      // Filter by category if set
      if (category && category !== 'sale' && category !== 'new') {
        data = data.filter(p =>
          p.category?.name?.toLowerCase() === category ||
          p.categoryName?.toLowerCase() === category
        );
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }

      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: '/shop' } } });
      return;
    }
    // If product has variants, use first variant; otherwise show a message
    const variantId = product.variants?.[0]?.id || product.variantId;
    if (!variantId) {
      showToast('Please select a variant from the product page', 'error');
      return;
    }
    setAddingId(product.id);
    const result = await addToCart(variantId, 1);
    setAddingId(null);
    if (result.success) {
      showToast(`${product.name} added to cart!`);
    } else {
      showToast(result.message || 'Failed to add to cart', 'error');
    }
  };

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : CATEGORY_LABELS[category] || 'All Products';

  return (
    <div className="shop-page">
      {/* Toast notification */}
      {toast && (
        <div className={`shop-toast ${toast.type === 'error' ? 'shop-toast--error' : ''}`}>
          {toast.msg}
        </div>
      )}

      <div className="shop-header">
        <h1 className="shop-title">{pageTitle}</h1>
        {products.length > 0 && (
          <p className="shop-count">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {loading ? (
        <div className="shop-loading">
          <div className="shop-loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="product-skeleton"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="shop-error">
          <p>{error}</p>
          <button onClick={loadProducts} className="btn-primary">Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="shop-empty">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No products found</h2>
            <p>{searchQuery ? `No results for "${searchQuery}"` : 'No products in this category yet.'}</p>
            <button onClick={() => navigate('/')} className="btn-primary">Back to Home</button>
          </div>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => navigate(`/product/${product.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/product/${product.id}`); }}
            >
              <div className="product-card-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="product-placeholder-img">
                    <span>👗</span>
                  </div>
                )}
                {product.stock === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
              </div>

              <div className="product-card-body">
                <div className="product-card-category">
                  {product.category?.name || product.categoryName || 'Fashion'}
                </div>
                <h3 className="product-card-name">{product.name}</h3>
                {product.brand && <p className="product-card-brand">{product.brand}</p>}
                <p className="product-card-desc">{product.description?.substring(0, 80)}{product.description?.length > 80 ? '...' : ''}</p>

                <div className="product-card-footer">
                  <span className="product-card-price">
                    Rs {parseFloat(product.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    className="btn-add-to-cart"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === product.id || product.stock === 0}
                  >
                    {addingId === product.id ? '...' : product.stock === 0 ? 'Sold Out' : '+ Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
