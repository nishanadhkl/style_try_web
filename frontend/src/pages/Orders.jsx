import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { orderAPI } from '../services/api';

export default function Orders() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, first: true, last: true });

  const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const getOrderItemCount = (order) => {
    const items = order.items || [];
    return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    loadOrders();
  }, [isLoggedIn, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getUserOrders({ page, size: 10 });
      const payload = response.data?.data || response.data || {};
      const data = Array.isArray(payload) ? payload : payload.content || [];
      setOrders(data);
      setPageInfo({
        totalPages: payload.totalPages || 1,
        first: payload.first ?? true,
        last: payload.last ?? true,
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm('Cancel this order? This is only allowed before the order is shipped.');
    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);
      const response = await orderAPI.cancel(orderId);
      const updatedOrder = response.data?.data || response.data;
      setOrders((currentOrders) => currentOrders.map((order) => (
        order.id === orderId ? { ...order, ...updatedOrder, status: 'CANCELLED' } : order
      )));
      showToast('Order cancelled successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel order';
      showToast(message, 'error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return { background: '#fef3c7', color: '#92400e' };
      case 'SHIPPED': return { background: '#dbeafe', color: '#1e40af' };
      case 'DELIVERED': return { background: '#dcfce7', color: '#166534' };
      case 'CANCELLED': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: '#f1f5f9', color: '#475569' };
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color: 'white',
          fontWeight: '700',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)'
        }}>
          {toast.message}
        </div>
      )}

      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>My Orders</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <p style={{ fontSize: '3rem' }}>📦</p>
          <h2>No orders yet</h2>
          <p>Start shopping to place your first order!</p>
          <button onClick={() => navigate('/shop')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} style={{
              background: 'white', borderRadius: '1rem', padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#4f46e5', margin: 0 }}>ORD-{order.id}</p>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Total</p>
                  <p style={{ fontWeight: '800', color: '#4f46e5', fontSize: '1.1rem', margin: 0 }}>
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Items</p>
                  <p style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem', margin: 0 }}>
                    {getOrderItemCount(order)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Delivery Address</p>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{order.shippingAddress}</p>
                </div>
                <span style={{
                  padding: '0.4rem 1rem', borderRadius: '999px',
                  fontWeight: '700', fontSize: '0.85rem',
                  ...getStatusColor(order.status)
                }}>
                  {order.status || 'PENDING'}
                </span>
              </div>

              {order.status?.toUpperCase() === 'PENDING' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #fecaca',
                      background: '#fff1f2',
                      color: '#b91c1c',
                      fontWeight: '800',
                      cursor: cancellingOrderId === order.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}

              <div style={{
                marginTop: '1.25rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <span>Product</span>
                  <span>Size</span>
                  <span>Color</span>
                  <span>Qty</span>
                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>

                {(order.items || []).length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id || `${item.productId}-${item.variantId}`} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '800', color: '#111827' }}>{item.productName || 'Product'}</p>
                        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                          Unit price: {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span style={{ color: '#334155', fontWeight: '600' }}>{item.size || '-'}</span>
                      <span style={{ color: '#334155', fontWeight: '600' }}>{item.color || '-'}</span>
                      <span style={{ color: '#334155', fontWeight: '700' }}>{item.quantity || 0}</span>
                      <span style={{ textAlign: 'right', color: '#4f46e5', fontWeight: '800' }}>
                        {formatCurrency(item.subtotal || (item.price * item.quantity))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: '#64748b', borderTop: '1px solid #e5e7eb' }}>
                    Item details are not available for this order.
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  background: '#fbfbff',
                  fontWeight: '800'
                }}>
                  <span>Order Total</span>
                  <span style={{ color: '#4f46e5', fontSize: '1.05rem' }}>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary pagination-arrow-button" aria-label="Previous page" disabled={pageInfo.first} onClick={() => setPage((value) => Math.max(0, value - 1))}>
              &lt;
            </button>
            <span style={{ fontWeight: '700', color: '#4f46e5' }}>Page {page + 1} of {pageInfo.totalPages}</span>
            <button className="btn-secondary pagination-arrow-button" aria-label="Next page" disabled={pageInfo.last} onClick={() => setPage((value) => value + 1)}>
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
