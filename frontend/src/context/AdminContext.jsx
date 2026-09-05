import { createContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    const storedToken = localStorage.getItem('adminToken');
    if (storedAdmin && storedToken) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        if (parsedAdmin?.role === 'ADMIN') {
          setAdmin(parsedAdmin);
        } else {
          localStorage.removeItem('admin');
          localStorage.removeItem('adminToken');
        }
      } catch (error) {
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await adminAPI.login({ email, password });
      const apiResponse = response?.data || {};
      const token = apiResponse.token;
      const userPayload = apiResponse;

      if (response.status === 200 && token && userPayload.role === 'ADMIN') {
        const adminUser = {
          id: userPayload.id || 1,
          email: userPayload.email || email,
          username: userPayload.fullName || userPayload.username || 'Admin',
          role: userPayload.role,
          loginTime: new Date().toISOString(),
        };

        setAdmin(adminUser);
        localStorage.setItem('admin', JSON.stringify(adminUser));
        if (token) {
          localStorage.setItem('adminToken', token);
        }

        return { success: true };
      }

      return { success: false, message: apiResponse.message || 'Only admin accounts can access this panel' };
    } catch (error) {
      console.error('Login error:', error);

      if (error.response?.status === 401) {
        return { success: false, message: 'Invalid email or password' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Access forbidden' };
      } else if (error.response?.status >= 500) {
        return { success: false, message: 'Server error. Please try again later.' };
      }

      return { success: false, message: 'Login failed. Please check your connection.' };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
  };

  const isAdminLoggedIn = !!admin && admin?.role === 'ADMIN' && !!localStorage.getItem('adminToken');
  const hasAdminRole = admin?.role === 'ADMIN';

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminLoggedIn,
        hasAdminRole,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
