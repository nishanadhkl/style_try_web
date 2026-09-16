import { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const CATEGORY_LABELS = {
  men: "Men's Fashion",
  women: "Women's Fashion",
  sale: 'Sale Items',
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
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0, first: true, last: true });

  const { addToCart } = useContext(CartContext);
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    setPage(0);
  }, [category, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [category, searchQuery, page]);

const loadProducts = async () => {
  setLoading(true);
  setError(null);
  try {
    const params = {
      page,
      size: 12,
      q: searchQuery || undefined,
      category: category && category !== 'sale' && category !== 'new' ? category : undefined,
      sale: category === 'sale' ? true : undefined,
      newest: category === 'new' ? true : undefined,
    };
    const response = await productAPI.getAll(params);
    const payload = response.data?.data || response.data || {};
    const data = Array.isArray(payload) ? payload : payload.content || [];
    setProducts(data);
    setPageInfo({
      totalPages: payload.totalPages || 1,
      totalElements: payload.totalElements ?? data.length,
      first: payload.first ?? true,
      last: payload.last ?? true,
    });
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
        {pageInfo.totalElements > 0 && (
          <p className="shop-count">{pageInfo.totalElements} product{pageInfo.totalElements !== 1 ? 's' : ''}</p>
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
        <>
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
                  <div className="product-placeholder-img"><span>👗</span></div>
                )}
                {product.stock === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
                {product.discountPercent > 0 && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: '#dc2626', color: 'white',
                    padding: '4px 8px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: '700'
                  }}>SALE -{product.discountPercent}%</div>
                )}
                {product.isNewArrival && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: '#10b981', color: 'white',
                    padding: '4px 8px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: '700'
                  }}>NEW</div>
                )}
              </div>

              <div className="product-card-body">
                <div className="product-card-category">
                  {product.category || 'Fashion'}
                </div>
                <h3 className="product-card-name">{product.name}</h3>
                {product.brand && <p className="product-card-brand">{product.brand}</p>}
                <p className="product-card-desc">{product.description?.substring(0, 80)}{product.description?.length > 80 ? '...' : ''}</p>

                <div className="product-card-footer">
                  <div>
                  {product.discountPercent > 0 ? (
                  <>
                  <span style={{
                  textDecoration: 'line-through',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  marginRight: '0.4rem'
                  }}>
                  Rs {parseFloat(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="product-card-price" style={{ color: '#dc2626' }}>
                  Rs {Math.round(product.price * (1 - product.discountPercent / 100)).toLocaleString('en-IN')}
                  </span>
                  <span style={{
                  display: 'inline-block', marginLeft: '0.4rem',
                  background: '#dc2626', color: 'white',
                  fontSize: '0.7rem', fontWeight: '700',
                  padding: '2px 6px', borderRadius: '4px'
                  }}>
                  -{product.discountPercent}%
                  </span>
                  </>
                  ) : (
                  <span className="product-card-price">
                  Rs {parseFloat(product.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  )}
                  </div>
                  <button
                    className="btn-add-to-cart"
                    onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
                    disabled={product.stock === 0}
                    >
                    {product.stock === 0 ? 'Sold Out' : 'View Product'}
                  </button>
                </div>
              </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn-secondary pagination-arrow-button" aria-label="Previous page" disabled={pageInfo.first} onClick={() => setPage((value) => Math.max(0, value - 1))}>
              &lt;
            </button>
            <span style={{ fontWeight: '700', color: '#4f46e5' }}>
              Page {page + 1} of {pageInfo.totalPages}
            </span>
            <button className="btn-secondary pagination-arrow-button" aria-label="Next page" disabled={pageInfo.last} onClick={() => setPage((value) => value + 1)}>
              &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
