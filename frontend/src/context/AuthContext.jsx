import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('userToken');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const payload = response?.data?.data || response?.data || {};
      const token = payload.token || payload.accessToken;
      const userPayload = payload.user || payload;

      if (response.status === 200 && token) {
        const userData = {
          id: userPayload.id,
          email: userPayload.email || email,
          fullName: userPayload.fullName || userPayload.name || email.split('@')[0],
          role: userPayload.role || 'USER',
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userToken', token);
        return { success: true };
      }
      return { success: false, message: payload.message || 'Invalid credentials' };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false, message: 'Invalid email or password' };
      }
      return { success: false, message: 'Login failed. Please check your connection.' };
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const response = await authAPI.register({ fullName, email, password });
      if (response.status === 200 || response.status === 201) {
        return { success: true };
      }
      return { success: false, message: response?.data?.message || 'Registration failed' };
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      if (error.response?.status === 409) {
        return { success: false, message: serverMessage || 'User already exists with this email' };
      }
      if (serverMessage?.toLowerCase().includes('email')) {
        return { success: false, message: 'User already exists with this email' };
      }
      return { success: false, message: serverMessage || 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
  };

  const isLoggedIn = !!user && !!localStorage.getItem('userToken');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
