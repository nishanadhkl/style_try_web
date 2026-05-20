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
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await adminAPI.login({ username, password });
      const apiResponse = response?.data || {};
      const payload = apiResponse.data || {};
      const token = payload.token || payload.accessToken;
      const userPayload = payload.admin || payload.user || payload;

      if (response.status === 200 && (token || userPayload.username || userPayload.id)) {
        const adminUser = {
          id: userPayload.id || 1,
          username: userPayload.username || username,
          role: userPayload.role || 'admin',
          loginTime: new Date().toISOString(),
        };

        setAdmin(adminUser);
        localStorage.setItem('admin', JSON.stringify(adminUser));
        if (token) {
          localStorage.setItem('adminToken', token);
        }

        return { success: true };
      }

      return { success: false, message: apiResponse.message || 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);

      if (error.response?.status === 401) {
        return { success: false, message: 'Invalid username or password' };
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

  const isAdminLoggedIn = !!admin;
  const hasAdminRole = admin?.role === 'admin';

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
