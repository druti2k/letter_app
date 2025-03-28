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

  const logout = useCallback(() => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, user is not authenticated');
        logout();
        return;
      }

      const response = await api.get('/api/auth/verify');
      
      if (response.data.isValid && response.data.user) {
        console.log('Token is valid, user authenticated:', response.data.user.email);
        setIsAuthenticated(true);
        setUser(response.data.user);
      } else {
        console.log('Token verification failed');
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error.message);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (token, userData) => {
    try {
      if (!token || !userData) {
        throw new Error('Missing token or user data');
      }

      // First set the token
      localStorage.setItem('token', token);

      // Immediately set user data
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      // Verify in background
      try {
        await api.get('/api/auth/verify');
        console.log('Background token verification successful');
      } catch (verifyError) {
        console.error('Background token verification failed:', verifyError.message);
        // Don't logout here, let the periodic check handle it
      }

      return true;
    } catch (error) {
      console.error('Login failed:', error.message);
      logout();
      throw error;
    }
  };

  // Set up periodic auth check
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkAuth]);

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 