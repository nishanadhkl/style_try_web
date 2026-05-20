import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const { admin, logout } = useContext(AdminContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard data');
      // Fallback to mock data
      setStats({
        totalProducts: 156,
        totalOrders: 42,
        totalUsers: 289,
        totalRevenue: 'Rs 28,450',
      });
    } finally {
      setLoading(false);
    }

    // Mock recent activity for now
    setRecentActivity([
      {
        id: 1,
        type: 'product',
        message: 'New product "Summer Jacket" added',
        time: '2 hours ago',
      },
      {
        id: 2,
        type: 'order',
        message: 'Order #2024 completed',
        time: '4 hours ago',
      },
      {
        id: 3,
        type: 'user',
        message: 'New user registered: john@example.com',
        time: '6 hours ago',
      },
      {
        id: 4,
        type: 'product',
        message: 'Product "Winter Boots" stock updated',
        time: '8 hours ago',
      },
    ]);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Admin Dashboard</h1>
          <div className="admin-header-actions">
            <span className="admin-user-info">Welcome, {admin?.username}!</span>
            <button onClick={handleLogout} className="admin-logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sidebar */}
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

      {/* Main Content */}
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
            {/* Stats Grid */}
            <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <p className="stat-label">Total Products</p>
              <h3 className="stat-value">{stats.totalProducts}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <p className="stat-label">Total Orders</p>
              <h3 className="stat-value">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <p className="stat-label">Total Users</p>
              <h3 className="stat-value">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <p className="stat-label">Total Revenue</p>
              <h3 className="stat-value">{stats.totalRevenue}</h3>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="admin-activity-section">
          <h2 className="admin-section-title">Recent Activity</h2>
          <div className="admin-activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-type">{activity.type === 'product' ? '📦' : activity.type === 'order' ? '🛒' : '👥'}</div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="admin-quick-actions">
          <h2 className="admin-section-title">Quick Actions</h2>
          <div className="admin-actions-grid">
            <button
              onClick={() => navigate('/admin/products')}
              className="admin-action-button"
            >
              ➕ Add New Product
            </button>
            <button className="admin-action-button">
              📊 View Reports
            </button>
            <button className="admin-action-button">
              📧 Send Newsletter
            </button>
            <button className="admin-action-button">
              ⚙️ Settings
            </button>
          </div>
        </section>
        </>
        )}
      </main>
    </div>
  );
}
