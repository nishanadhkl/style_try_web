import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getTotalAmount, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'esewa',
  });
  const [errors, setErrors] = useState({});

  const items = cart?.items || [];

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || '',
      email: user.email || '',
    }));
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Add items before checking out</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Continue Shopping</button>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (user?.email && formData.email.toLowerCase() !== user.email.toLowerCase()) {
      newErrors.email = 'Please use your registered email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validateForm();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);
  try {
    const shippingAddress = `${formData.address}, ${formData.city} ${formData.postalCode}`;
    const orderPayload = {
      shippingAddress,
      orderItems: items.map(item => ({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
      }))
    };

    const response = await orderAPI.create(orderPayload);
    const data = response.data?.data || response.data;

    if (response.status >= 200 && response.status < 300) {
      const orderData = {
        orderNumber: `ORD-${data.id || Date.now()}`,
        items,
        totalAmount: getTotalAmount(),
        shippingAddress,
        paymentMethod: 'eSewa',
        date: new Date().toLocaleDateString(),
      };

      const paymentResponse = await paymentAPI.initiateEsewa({
        orderId: data.id,
        amount: getTotalAmount(),
        successUrl: `${window.location.origin}/order-confirmation?payment=success`,
        failureUrl: `${window.location.origin}/checkout?payment=failed`,
      });

      sessionStorage.setItem('pendingOrderConfirmation', JSON.stringify(orderData));
      await clearCart();
      submitEsewaForm(paymentResponse.data?.data || paymentResponse.data);
    }
  } catch (err) {
    console.error('Order error:', err);
    setErrors({ submit: err.response?.data?.message || 'Failed to place order. Please try again.' });
  } finally {
    setLoading(false);
  }
};

  const submitEsewaForm = (paymentData) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.paymentUrl;

    const fields = {
      amount: paymentData.amount,
      tax_amount: paymentData.taxAmount,
      total_amount: paymentData.totalAmount,
      transaction_uuid: paymentData.transactionUuid,
      product_code: paymentData.productCode,
      product_service_charge: paymentData.productServiceCharge,
      product_delivery_charge: paymentData.productDeliveryCharge,
      success_url: paymentData.successUrl,
      failure_url: paymentData.failureUrl,
      signed_field_names: paymentData.signedFieldNames,
      signature: paymentData.signature,
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value ?? '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {/* Left: Order Summary */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div key={item.id} className="checkout-item">
                <div className="checkout-item-info">
                  <h4>{item.productName}</h4>
                  {item.size && <span className="item-variant">Size: {item.size}</span>}
                  {item.color && <span className="item-variant">Color: {item.color}</span>}
                  <span className="item-qty">Qty: {item.quantity}</span>
                </div>
                <div className="checkout-item-price">
                  Rs {parseFloat((item.price * item.quantity) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal ({items.length} items)</span>
              <span>Rs {getTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="checkout-total-row">
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div className="checkout-total-row">
              <span>Discount</span>
              <span>Rs 0</span>
            </div>
            <div className="checkout-total-divider"></div>
            <div className="checkout-total-row checkout-total-final">
              <span>Total Amount</span>
              <span className="total-amount">Rs {getTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Right: Checkout Form */}
        <div className="checkout-form">
          <h2>Shipping Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="checkout-form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
              />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>

            <div className="checkout-form-row">
              <div className="checkout-form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  readOnly
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
                <span className="form-error" style={{ color: '#64748b' }}>
                  Orders are linked to your registered account email.
                </span>
              </div>

              <div className="checkout-form-group">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+977 98xxxxxxxx"
                  className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="checkout-form-group">
              <label htmlFor="address" className="form-label">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className={`form-input ${errors.address ? 'form-input--error' : ''}`}
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div className="checkout-form-row">
              <div className="checkout-form-group">
                <label htmlFor="city" className="form-label">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Kathmandu"
                  className={`form-input ${errors.city ? 'form-input--error' : ''}`}
                />
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div className="checkout-form-group">
                <label htmlFor="postalCode" className="form-label">Postal Code</label>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="44600"
                  className={`form-input ${errors.postalCode ? 'form-input--error' : ''}`}
                />
                {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
              </div>
            </div>

            <div className="checkout-payment">
              <h3 className="payment-title">Payment Method</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="esewa"
                    checked={formData.paymentMethod === 'esewa'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">eSewa Digital Payment</span>
                </label>
              </div>
              <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                You will be redirected to eSewa test payment after placing the order.
              </p>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="btn-secondary"
              >
                ← Back to Cart
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-checkout"
              >
                {loading ? 'Redirecting to eSewa...' : 'Pay with eSewa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
