import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';

export function ProtectedAdminRoute({ children }) {
  const { isAdminLoggedIn, loading } = useContext(AdminContext);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
