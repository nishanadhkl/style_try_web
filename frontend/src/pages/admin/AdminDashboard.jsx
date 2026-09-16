import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { adminAPI, productAPI, variantAPI } from '../../services/api';

export default function AdminDashboard() {
  const { admin, logout } = useContext(AdminContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    revenue: 'Rs 0',
    inventoryValue: 'Rs 0',
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [chartRange, setChartRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getResponseList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.content)) return responseData.content;
    return [];
  };

  const formatCurrency = (value) =>
    `Rs ${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    loadDashboardData();
  }, [chartRange]);

  const buildRevenueChart = (orders, range) => {
    const validOrders = orders.filter((order) => order.status?.toUpperCase() !== 'CANCELLED');
    const bucketCount = range === 'weekly' ? 7 : 6;
    const today = new Date();

    return Array.from({ length: bucketCount }).map((_, index) => {
      const offset = bucketCount - index - 1;
      const date = new Date(today);

      if (range === 'weekly') {
        date.setDate(today.getDate() - offset);
      } else {
        date.setMonth(today.getMonth() - offset);
      }

      const label = range === 'weekly'
        ? date.toLocaleDateString('en-IN', { weekday: 'short' })
        : date.toLocaleDateString('en-IN', { month: 'short' });

      const total = validOrders.reduce((sum, order) => {
        const orderDate = new Date(order.createdAt);
        const samePeriod = range === 'weekly'
          ? orderDate.toDateString() === date.toDateString()
          : orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth();

        return samePeriod ? sum + Number(order.totalAmount || 0) : sum;
      }, 0);

      return { label, total };
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [productsResponse, ordersResponse] = await Promise.all([
        productAPI.getAll(),
        adminAPI.getAllOrders(),
      ]);
      const products = getResponseList(productsResponse.data);
      const orders = getResponseList(ordersResponse.data);
      const productsWithVariants = await Promise.all(products.map(async (product) => {
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          return product;
        }

        try {
          const variantsResponse = await variantAPI.getByProductId(product.id);
          return {
            ...product,
            variants: getResponseList(variantsResponse.data),
          };
        } catch {
          return product;
        }
      }));

      const inventoryValue = productsWithVariants.reduce((total, product) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        if (variants.length > 0) {
          return total + variants.reduce((variantTotal, variant) => {
            const price = Number(variant.price || product.price || 0);
            const stock = Number(variant.stockQuantity || 0);
            return variantTotal + price * stock;
          }, 0);
        }

        const price = Number(product.price || 0);
        const stock = Number(product.stockQuantity || 0);
        return total + price * stock;
      }, 0);

      const revenue = orders
        .filter((order) => order.status?.toUpperCase() !== 'CANCELLED')
        .reduce((total, order) => total + Number(order.totalAmount || 0), 0);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.active).length,
        totalOrders: orders.length,
        revenue: formatCurrency(revenue),
        inventoryValue: formatCurrency(inventoryValue),
      });

      setRecentActivity(
        products.slice(0, 5).map((product) => ({
          id: product.id,
          type: 'product',
          message: `${product.name} is listed in ${product.categoryName || 'Uncategorized'}`,
          time: product.active ? 'Active' : 'Inactive',
        }))
      );
      setRevenueChart(buildRevenueChart(orders, chartRange));
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to connect to backend. Make sure the API server is running at http://localhost:8090');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-subtitle">Welcome back, {admin?.username}! 👋</p>
          </div>
          <div className="admin-header-actions">
            <button onClick={handleLogout} className="admin-logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link admin-nav-link--active">
            📊 Dashboard
          </a>
          <a href="/admin/products" className="admin-nav-link">
            📦 Products
          </a>
          <a href="/admin/orders" className="admin-nav-link">
            🛒 Orders
          </a>
          <a href="/admin/users" className="admin-nav-link">
            👥 Users
          </a>
        </nav>
      </div>

      <main className="admin-main">
        {loading && (
          <div className="admin-loading">
            <p>Loading dashboard data...</p>
          </div>
        )}

        {error && (
          <div className="admin-error">
            <p>{error}</p>
            <button onClick={loadDashboardData} className="admin-retry-button">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon--products">📦</div>
                <div className="stat-content">
                  <p className="stat-label">Total Products</p>
                  <h3 className="stat-value">{stats.totalProducts}</h3>
                  <p className="stat-change">All items in inventory</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon stat-icon--active">✅</div>
                <div className="stat-content">
                  <p className="stat-label">Active Products</p>
                  <h3 className="stat-value">{stats.activeProducts}</h3>
                  <p className="stat-change">Available for purchase</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon stat-icon--categories">🏷️</div>
                <div className="stat-content">
                  <p className="stat-label">Total Orders</p>
                  <h3 className="stat-value">{stats.totalOrders}</h3>
                  <p className="stat-change">Orders placed by customers</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon stat-icon--inventory">💰</div>
                <div className="stat-content">
                  <p className="stat-label">Revenue</p>
                  <h3 className="stat-value">{stats.revenue}</h3>
                  <p className="stat-change">Excluding cancelled orders</p>
                </div>
              </div>
            </div>

            <section style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}>
                <h2 className="admin-section-title" style={{ margin: 0 }}>Revenue Chart</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['weekly', 'monthly'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setChartRange(range)}
                      style={{
                        padding: '0.45rem 0.8rem',
                        borderRadius: '0.5rem',
                        border: chartRange === range ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                        background: chartRange === range ? '#4f46e5' : 'white',
                        color: chartRange === range ? 'white' : '#4f46e5',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${revenueChart.length || 1}, 1fr)`,
                gap: '0.85rem',
                alignItems: 'end',
                minHeight: '220px',
                borderLeft: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                padding: '1rem 0.75rem 0',
              }}>
                {revenueChart.map((point) => {
                  const max = Math.max(...revenueChart.map((item) => item.total), 1);
                  const height = Math.max((point.total / max) * 170, point.total > 0 ? 18 : 4);
                  return (
                    <div key={point.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ color: '#475569', fontSize: '0.78rem', fontWeight: '700' }}>
                        {formatCurrency(point.total)}
                      </div>
                      <div style={{
                        width: '100%',
                        maxWidth: '54px',
                        height: `${height}px`,
                        borderRadius: '0.5rem 0.5rem 0 0',
                        background: 'linear-gradient(180deg, #6d5dfc 0%, #4f46e5 100%)',
                      }} />
                      <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '700' }}>
                        {point.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="admin-content-grid">
              <section className="admin-activity-section">
                <h2 className="admin-section-title">📋 Recent Products</h2>
                <div className="admin-activity-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-type">📄</div>
                        <div className="activity-content">
                          <p className="activity-message">{activity.message}</p>
                          <span className="activity-status">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-item">
                      <div className="activity-content">
                        <p className="activity-message">No products added yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="admin-quick-actions">
                <h2 className="admin-section-title">⚡ Quick Actions</h2>
                <div className="admin-actions-grid">
                  <button
                    onClick={() => navigate('/admin/products')}
                    className="admin-action-button admin-action-button--primary"
                  >
                    ➕ Add Product
                  </button>
                  <button
                    onClick={loadDashboardData}
                    className="admin-action-button admin-action-button--secondary"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
