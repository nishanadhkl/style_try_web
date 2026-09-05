import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      const data = response.data?.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="admin-title">User Management</h1>
        </div>
      </header>

      <div className="admin-sidebar">
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-link">📊 Dashboard</a>
          <a href="/admin/products" className="admin-nav-link">📦 Products</a>
          <a href="/admin/orders" className="admin-nav-link">🛒 Orders</a>
          <a href="/admin/users" className="admin-nav-link admin-nav-link--active">👥 Users</a>
        </nav>
      </div>

      <main className="admin-main">
        <h2 className="admin-section-title">All Users ({users.length})</h2>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p style={{ fontSize: '2rem' }}>👥</p>
            <p>No users found</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>#{user.id}</td>
                    <td style={{ fontWeight: '600' }}>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        borderRadius: '999px', fontWeight: '600', fontSize: '0.75rem',
                        background: user.role === 'ADMIN' ? '#e0e7ff' : '#f0fdf4',
                        color: user.role === 'ADMIN' ? '#4f46e5' : '#166534',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
