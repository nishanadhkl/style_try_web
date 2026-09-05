import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

export default function Orders() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await API.get('/api/orders');
      const data = response.data?.data || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
                    Rs {parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
