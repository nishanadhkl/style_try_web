import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI , variantAPI} from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { isLoggedIn } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

const loadProduct = async () => {
  try {
    setLoading(true);
    const [productResponse, variantsResponse] = await Promise.all([
      productAPI.getById(id),
      variantAPI.getByProductId(id),
    ]);
    const data = productResponse.data?.data || productResponse.data;
    const variants = variantsResponse.data?.data || variantsResponse.data || [];
    const productWithVariants = { ...data, variants: Array.isArray(variants) ? variants : [] };
    setProduct(productWithVariants);
    if (productWithVariants.variants.length > 0) {
      setSelectedVariant(productWithVariants.variants[0]);
    }
  } catch (err) {
    console.error('Error loading product:', err);
    showToast('Failed to load product', 'error');
  } finally {
    setLoading(false);
  }
};

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
    showToast('Please login to add items to cart', 'error');
    setTimeout(() => {
    navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
    }, 1500);
    return;
    }
    if (!selectedVariant) {
      showToast('Please select a variant', 'error');
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(selectedVariant.id, quantity);
    setAddingToCart(false);

    if (result.success) {
      showToast('Added to cart!');
      setTimeout(() => navigate('/cart'), 1500);
    } else {
      showToast(result.message || 'Failed to add to cart', 'error');
    }
  };

  const handleTryOn = () => {
    if (!selectedVariant) {
      showToast('Please select a variant', 'error');
      return;
    }

    navigate('/try-on', { state: { product, variant: selectedVariant } });
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/shop')} className="btn-primary">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="product-detail">
      {toast && (
        <div className={`product-detail-toast ${toast.type === 'error' ? 'product-detail-toast--error' : ''}`}>
          {toast.msg}
        </div>
      )}

      <div className="product-detail-container">
        {/* Left: Image */}
        <div className="product-detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-detail-placeholder">👗</div>
          )}
        </div>

        {/* Right: Details */}
        <div className="product-detail-info">
          <div className="product-detail-header">
            <div className="product-detail-category">{product.category || 'Fashion'}</div>
            <h1 className="product-detail-title">{product.name}</h1>
            {product.brand && <p className="product-detail-brand">Brand: {product.brand}</p>}
          </div>

          <p className="product-detail-description">{product.description}</p>

          {/* Variants Section */}
          <div className="product-detail-variants">
            <h3 className="variants-title">Select Variant</h3>
            <div className="variants-grid">
              {product.variants && product.variants.length > 0 ? (
                product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`variant-card ${selectedVariant?.id === variant.id ? 'variant-card--active' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="variant-details">
                      {variant.size && <span className="variant-badge">Size: {variant.size}</span>}
                      {variant.color && <span className="variant-badge">Color: {variant.color}</span>}
                    </div>
                    <div className="variant-price">
                      Rs {parseFloat(variant.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="variant-stock">
                     {variant.stockQuantity > 0 ? (
                        <span className="stock-available">In Stock ({variant.stockQuantity})</span>
                      ) : (
                        <span className="stock-unavailable">Out of Stock</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-variants">No variants available</p>
              )}
            </div>
          </div>

          {/* Quantity Section */}
          {selectedVariant && (
            <div className="product-detail-quantity">
              <label className="quantity-label">Quantity:</label>
              <div className="quantity-selector">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="qty-btn"
                >−</button>
                <span className="qty-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10 || !selectedVariant || selectedVariant.stockQuantity === 0}
                  className="qty-btn"
                >+</button>
              </div>
            </div>
          )}

          {/* Price Display */}
          {selectedVariant && (
            <div className="product-detail-price">
              <span className="price-label">Total Price:</span>
              <span className="price-amount">
                Rs {parseFloat((selectedVariant.price * quantity) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="product-detail-actions">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || addingToCart || selectedVariant.stockQuantity === 0}
              className="btn-add-to-cart-large"
            >
              {addingToCart ? 'Adding...' : selectedVariant?.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleTryOn}
              disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
              className="btn-try-on"
              type="button"
            >
              Try On Virtual
            </button>
          </div>

          {/* Back Button */}
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
