import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';

export function ProtectedAdminRoute({ children }) {
  const { isAdminLoggedIn, hasAdminRole, loading } = useContext(AdminContext);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAdminLoggedIn || !hasAdminRole) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
