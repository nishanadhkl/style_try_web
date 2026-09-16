import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0, first: true, last: true });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers({ page, size: 10 });
      const payload = response.data?.data || response.data || {};
      const data = Array.isArray(payload) ? payload : payload.content || [];
      setUsers(data);
      setPageInfo({
        totalPages: payload.totalPages || 1,
        totalElements: payload.totalElements ?? data.length,
        first: payload.first ?? true,
        last: payload.last ?? true,
      });
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'ADMIN') {
      showToast('Admin users cannot be deleted', 'error');
      return;
    }

    const confirmed = window.confirm(`Delete user "${user.fullName}"?\n\nThis will also delete this user's cart and order history.`);
    if (!confirmed) return;

    try {
      await adminAPI.deleteUser(user.id);
      showToast('User deleted successfully');
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadgeStyle = (status) => {
    const isActive = status === 'ACTIVE';
    return {
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '999px',
      fontWeight: '700',
      fontSize: '0.75rem',
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#166534' : '#991b1b',
    };
  };

  const filteredUsers = users.filter((user) => {
    const value = searchTerm.toLowerCase();
    return [user.fullName, user.email, user.role, user.status]
      .some((field) => String(field || '').toLowerCase().includes(value));
  });

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h2 className="admin-section-title" style={{ margin: 0 }}>All Users ({pageInfo.totalElements})</h2>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="admin-form-input"
            style={{ maxWidth: '320px' }}
          />
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
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
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                    <td>
                      <span style={getStatusBadgeStyle(user.status)}>
                        {user.status || (user.active === false ? 'INACTIVE' : 'ACTIVE')}
                      </span>
                    </td>
                    <td>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={user.role === 'ADMIN'}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '0.45rem',
                          border: 'none',
                          background: user.role === 'ADMIN' ? '#e2e8f0' : '#dc2626',
                          color: user.role === 'ADMIN' ? '#64748b' : 'white',
                          fontWeight: '700',
                          cursor: user.role === 'ADMIN' ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <button className="admin-form-cancel-button pagination-arrow-button" aria-label="Previous page" disabled={pageInfo.first} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                &lt;
              </button>
              <span style={{ fontWeight: '700', color: '#4f46e5' }}>Page {page + 1} of {pageInfo.totalPages}</span>
              <button className="admin-form-cancel-button pagination-arrow-button" aria-label="Next page" disabled={pageInfo.last} onClick={() => setPage((value) => value + 1)}>
                &gt;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
