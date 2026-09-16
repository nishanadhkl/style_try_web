import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedOrderData = sessionStorage.getItem('pendingOrderConfirmation');
  const orderData = location.state?.orderData || (storedOrderData ? JSON.parse(storedOrderData) : null);

  useEffect(() => {
    if (storedOrderData) {
      sessionStorage.removeItem('pendingOrderConfirmation');
    }
  }, [storedOrderData]);

  if (!orderData) {
    return (
      <div className="order-confirmation-error">
        <h2>No order found</h2>
        <p>Please place an order first</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <div className="order-confirmation-card">
        {/* Success Header */}
        <div className="order-confirmation-header">
          <div className="order-success-icon">✓</div>
          <h1 className="order-success-title">Order Confirmed!</h1>
          <p className="order-success-subtitle">Thank you for your order</p>
        </div>

        {/* Order Number */}
        <div className="order-number-section">
          <span className="order-number-label">Order Number</span>
          <span className="order-number">{orderData.orderNumber}</span>
        </div>

        {/* Order Details */}
        <div className="order-details-section">
          <div className="order-details-row">
            <span className="order-detail-label">Date</span>
            <span className="order-detail-value">{orderData.date}</span>
          </div>
          <div className="order-details-row">
            <span className="order-detail-label">Delivery Address</span>
            <span className="order-detail-value">{orderData.shippingAddress}</span>
          </div>
          <div className="order-details-row">
            <span className="order-detail-label">Payment Method</span>
            <span className="order-detail-value">{orderData.paymentMethod}</span>
          </div>
        </div>

        {/* Items Summary */}
        <div className="order-items-section">
          <h3 className="order-items-title">Order Items</h3>
          <div className="order-items-list">
            {orderData.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <div className="order-item-info">
                  <h4>{item.productName}</h4>
                  {item.size && <span className="item-variant">Size: {item.size}</span>}
                  {item.color && <span className="item-variant">Color: {item.color}</span>}
                  <span className="item-qty">Qty: {item.quantity}</span>
                </div>
                <div className="order-item-price">
                  Rs {parseFloat((item.price * item.quantity) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="order-total-section">
          <span className="order-total-label">Total Amount</span>
          <span className="order-total-amount">
            Rs {parseFloat(orderData.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Info Box */}
        <div className="order-info-box">
          <span className="info-icon">ℹ️</span>
          <p className="info-text">
            We'll send you an email confirmation. You can track your order status in your account.
          </p>
        </div>

        {/* Actions */}
        <div className="order-confirmation-actions">
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
          <button onClick={() => navigate('/shop')} className="btn-secondary">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
