import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, updateItem, removeItem, clearCart, getTotalAmount } = useContext(CartContext);
  const { isLoggedIn } = useContext(AuthContext);
  const [updatingId, setUpdatingId] = useState(null);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    await updateItem(itemId, newQuantity);
    setUpdatingId(null);
  };

  const handleRemove = async (itemId) => {
    await removeItem(itemId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart();
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="cart-loading-spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="cart-empty-page">
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <h2>Sign in to view your cart</h2>
          <p>You need to be logged in to access your shopping cart.</p>
          <div className="empty-actions">
            <button onClick={() => navigate('/login', { state: { from: { pathname: '/cart' } } })} className="btn-primary">
              Sign In
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary">
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">Shopping Cart</h1>
        <Link to="/shop" className="cart-continue-link">← Continue Shopping</Link>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty-page">
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Start shopping to add items to your cart</p>
            <button onClick={() => navigate('/shop')} className="btn-primary">
              Browse Products
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-section">
            <div className="cart-items-header">
              <span>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</span>
              <button onClick={handleClearCart} className="btn-clear-cart">
                🗑 Clear all
              </button>
            </div>

            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="placeholder-image" style={{ display: item.imageUrl ? 'none' : 'flex' }}>📦</div>
                  </div>

                  <div className="cart-item-details">
                    <h3 className="item-name">{item.productName}</h3>
                    <div className="item-variant-info">
                      {item.size && <span className="variant-badge">Size: {item.size}</span>}
                      {item.color && <span className="variant-badge">Color: {item.color}</span>}
                    </div>
                    <p className="item-price">Rs {parseFloat(item.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>

                  <div className="cart-item-quantity">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={updatingId === item.id || item.quantity <= 1}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updatingId === item.id || item.quantity >= 10}
                      className="qty-btn"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>

                  <div className="cart-item-subtotal">
                    <p className="subtotal-label">Subtotal</p>
                    <p className="subtotal-amount">
                      Rs {parseFloat(item.subtotal || (item.price * item.quantity) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="btn-remove"
                    title="Remove item"
                    disabled={updatingId === item.id}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal ({items.length} items)</span>
                <span>Rs {getTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="shipping-free">FREE</span>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <span>Rs 0</span>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span className="total-amount">Rs {getTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>

            <button className="btn-checkout" onClick={() => navigate('/checkout')}>
              Proceed to Checkout →
            </button>

            <p className="summary-secure-note">🔒 Secure checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}
