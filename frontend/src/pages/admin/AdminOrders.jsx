import { useState, useEffect } from 'react';

// Mock orders data - in future will come from backend API
const MOCK_ORDERS = [
  {
    id: 1,
    orderNumber: 'ORD-1717859200000',
    customerName: 'John Doe',
    email: 'john@example.com',
    date: '2026-06-08',
    totalAmount: 5999,
    status: 'pending',
    items: [
      { productName: 'Blue T-Shirt', size: 'M', color: 'Blue', quantity: 1, price: 1999 }
    ],
    shippingAddress: 'Thamel, Kathmandu 44600'
  },
  {
    id: 2,
    orderNumber: 'ORD-1717945600000',
    customerName: 'Jane Smith',
    email: 'jane@example.com',
    date: '2026-06-07',
    totalAmount: 8999,
    status: 'shipped',
    items: [
      { productName: 'Black Jeans', size: '32', color: 'Black', quantity: 1, price: 3999 },
      { productName: 'White Shirt', size: 'M', color: 'White', quantity: 1, price: 1999 }
    ],
    shippingAddress: 'Bhaktapur, Nepal 44800'
  },
  {
    id: 3,
    orderNumber: 'ORD-1717772400000',
    customerName: 'Robert Johnson',
    email: 'robert@example.com',
    date: '2026-06-06',
    totalAmount: 3999,
    status: 'delivered',
    items: [
      { productName: 'Red Hoodie', size: 'L', color: 'Red', quantity: 1, price: 3999 }
    ],
    shippingAddress: 'Patan, Lalitpur 44700'
  }
];

export default function AdminOrders() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const handleStatusChange = (orderId, newStatus) => {
    setLoading(true);
    setTimeout(() => {
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      setSelectedOrder(selectedOrder ? { ...selectedOrder, status: newStatus } : null);
      setLoading(false);
    }, 500);
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'order-status-badge';
    switch (status) {
      case 'pending': return `${baseClass} ${baseClass}--pending`;
      case 'shipped': return `${baseClass} ${baseClass}--shipped`;
      case 'delivered': return `${baseClass} ${baseClass}--delivered`;
      case 'cancelled': return `${baseClass} ${baseClass}--cancelled`;
      default: return baseClass;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  return (
    <div className="admin-orders">
      <div className="admin-orders-header">
        <h2>Order Management</h2>
        <div className="admin-orders-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</option>
            <option value="shipped">Shipped ({orders.filter(o => o.status === 'shipped').length})</option>
            <option value="delivered">Delivered ({orders.filter(o => o.status === 'delivered').length})</option>
          </select>
        </div>
      </div>

      <div className="admin-orders-container">
        {/* Orders List */}
        <div className="admin-orders-list">
          {filteredOrders.length === 0 ? (
            <div className="admin-orders-empty">
              <p>No orders found</p>
            </div>
          ) : (
            <div className="orders-table">
              <table>
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
                    <tr key={order.id} className={selectedOrder?.id === order.id ? 'row-selected' : ''}>
                      <td className="order-number-cell">{order.orderNumber}</td>
                      <td>
                        <div className="customer-info">
                          <p className="customer-name">{order.customerName}</p>
                          <p className="customer-email">{order.email}</p>
                        </div>
                      </td>
                      <td>{order.date}</td>
                      <td className="amount-cell">Rs {order.totalAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn-view-order"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details */}
        {selectedOrder && (
          <div className="admin-order-details">
            <div className="details-header">
              <h3>Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-close"
              >✕</button>
            </div>

            <div className="details-content">
              {/* Order Header */}
              <div className="details-section">
                <div className="details-row">
                  <span className="detail-label">Order Number</span>
                  <span className="detail-value">{selectedOrder.orderNumber}</span>
                </div>
                <div className="details-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{selectedOrder.date}</span>
                </div>
                <div className="details-row">
                  <span className="detail-label">Customer</span>
                  <span className="detail-value">{selectedOrder.customerName}</span>
                </div>
                <div className="details-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedOrder.email}</span>
                </div>
              </div>

              {/* Items */}
              <div className="details-section">
                <h4>Order Items</h4>
                <div className="order-items-detail">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="order-item-detail">
                      <div className="item-info">
                        <p className="item-name">{item.productName}</p>
                        <p className="item-variant">
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                      </div>
                      <div className="item-qty">Qty: {item.quantity}</div>
                      <div className="item-price">
                        Rs {(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="details-section">
                <h4>Shipping Address</h4>
                <p className="shipping-address">{selectedOrder.shippingAddress}</p>
              </div>

              {/* Total */}
              <div className="details-section">
                <div className="details-row details-total">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-value">
                    Rs {selectedOrder.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="details-section">
                <h4>Order Status</h4>
                <div className="status-buttons">
                  {['pending', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedOrder.id, status)}
                      disabled={loading}
                      className={`status-btn ${selectedOrder.status === status ? 'status-btn--active' : ''}`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
