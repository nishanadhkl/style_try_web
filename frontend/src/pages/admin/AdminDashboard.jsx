import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { productAPI } from '../../services/api';

export default function AdminDashboard() {
  const { admin, logout } = useContext(AdminContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    inventoryValue: 'Rs 0',
  });
  const [recentActivity, setRecentActivity] = useState([]);
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
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const productsResponse = await productAPI.getAll();
      const products = getResponseList(productsResponse.data);
      const categories = [];
      const inventoryValue = products.reduce((total, product) => {
        const price = Number(product.price || 0);
        const stock = Number(product.stockQuantity || 0);
        return total + price * stock;
      }, 0);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.active).length,
        totalCategories: categories.length,
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
                  <p className="stat-label">Categories</p>
                  <h3 className="stat-value">{stats.totalCategories}</h3>
                  <p className="stat-change">Product categories</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon stat-icon--inventory">💰</div>
                <div className="stat-content">
                  <p className="stat-label">Inventory Value</p>
                  <h3 className="stat-value">{stats.inventoryValue}</h3>
                  <p className="stat-change">Total stock value</p>
                </div>
              </div>
            </div>

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
