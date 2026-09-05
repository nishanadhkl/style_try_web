import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllOrders();
      const data = response.data?.data || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      showToast('Order status updated');
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const base = {
      display: 'inline-block', padding: '4px 12px',
      borderRadius: '999px', fontWeight: '600', fontSize: '0.8rem',
    };
    switch (status?.toUpperCase()) {
      case 'PENDING': return { ...base, background: '#fef3c7', color: '#92400e' };
      case 'SHIPPED': return { ...base, background: '#dbeafe', color: '#1e40af' };
      case 'DELIVERED': return { ...base, background: '#dcfce7', color: '#166534' };
      case 'CANCELLED': return { ...base, background: '#fee2e2', color: '#991b1b' };
      default: return { ...base, background: '#f1f5f9', color: '#475569' };
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status?.toUpperCase() === statusFilter.toUpperCase());

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="admin-layout">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '1rem 1.5rem',
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color: 'white', borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '600'
        }}>
          {toast.msg}
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Order Management</h1>
        </div>
      </header>

      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link">📊 Dashboard</a>
          <a href="/admin/products" className="admin-nav-link">📦 Products</a>
          <a href="/admin/orders" className="admin-nav-link admin-nav-link--active">🛒 Orders</a>
          <a href="/admin/users" className="admin-nav-link">👥 Users</a>
        </nav>
      </div>

      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="admin-section-title" style={{ margin: 0 }}>
            All Orders ({orders.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-input"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="PENDING">Pending ({orders.filter(o => o.status?.toUpperCase() === 'PENDING').length})</option>
            <option value="SHIPPED">Shipped ({orders.filter(o => o.status?.toUpperCase() === 'SHIPPED').length})</option>
            <option value="DELIVERED">Delivered ({orders.filter(o => o.status?.toUpperCase() === 'DELIVERED').length})</option>
            <option value="CANCELLED">Cancelled ({orders.filter(o => o.status?.toUpperCase() === 'CANCELLED').length})</option>
          </select>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p style={{ fontSize: '1.5rem' }}>📦</p>
            <p>No orders found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            {/* Orders Table */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} style={{ background: selectedOrder?.id === order.id ? '#f0f4ff' : '' }}>
                      <td style={{ color: '#4f46e5', fontWeight: '600', fontSize: '0.85rem' }}>
                        ORD-{order.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{order.customerName || 'Customer'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customerEmail || ''}</div>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td style={{ fontWeight: '700', color: '#4f46e5' }}>
                        Rs {parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={getStatusBadgeStyle(order.status)}>
                          {order.status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="admin-edit-button"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Detail Panel */}
            {selectedOrder && (
              <div style={{
                background: 'white', borderRadius: '1rem', padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Order Details</h3>
                  <button onClick={() => setSelectedOrder(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b'
                  }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Order #</span>
                    <span style={{ fontWeight: '600', color: '#4f46e5' }}>ORD-{selectedOrder.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Date</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Customer</span>
                    <span style={{ fontWeight: '600' }}>{selectedOrder.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Email</span>
                    <span style={{ fontSize: '0.85rem' }}>{selectedOrder.customerEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Address</span>
                    <span style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '180px' }}>
                      {selectedOrder.shippingAddress}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <span style={{ fontWeight: '700' }}>Total</span>
                    <span style={{ fontWeight: '800', color: '#4f46e5' }}>
                      Rs {parseFloat(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Update Status:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedOrder.id, status)}
                        disabled={updating || selectedOrder.status?.toUpperCase() === status}
                        style={{
                          padding: '0.5rem',
                          border: '2px solid',
                          borderRadius: '0.5rem',
                          cursor: selectedOrder.status?.toUpperCase() === status ? 'default' : 'pointer',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          ...(selectedOrder.status?.toUpperCase() === status
                            ? { background: '#4f46e5', color: 'white', borderColor: '#4f46e5' }
                            : { background: 'white', color: '#4f46e5', borderColor: '#e2e8f0' })
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
