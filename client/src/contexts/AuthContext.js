import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/api/auth/verify');
        if (response.data.isValid) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (token, userData) => {
    try {
      console.log('Starting login process...', { email: userData.email });
      
      // Set token in localStorage and axios headers
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify the token is valid
      console.log('Verifying token...');
      const response = await api.get('/api/auth/verify');
      
      if (!response.data.isValid) {
        console.error('Token verification failed');
        throw new Error('Token verification failed');
      }
      
      console.log('Token verified successfully');
      setIsAuthenticated(true);
      setUser(userData);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error.message);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 