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
      console.log('Checking authentication status...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Token found, verifying...');
      
      const response = await api.get('/api/auth/verify');
      console.log('Verify response:', response.data);
      
      if (response.data.isValid && response.data.user) {
        console.log('Token verified successfully');
        setIsAuthenticated(true);
        setUser(response.data.user);
      } else {
        console.log('Token verification failed');
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error.response?.data || error.message);
      // Only logout if it's a 401 error
      if (error.response?.status === 401) {
        logout();
      }
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
      
      if (!token || !userData) {
        throw new Error('Missing token or user data');
      }

      // Store token first
      localStorage.setItem('token', token);
      
      // Set user data immediately to prevent flicker
      setUser(userData);
      setIsAuthenticated(true);
      
      // Verify token in background
      const response = await api.get('/api/auth/verify');
      
      if (!response.data.isValid) {
        throw new Error('Token verification failed');
      }
      
      console.log('Login successful');
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  }, []);

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 