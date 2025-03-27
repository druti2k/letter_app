import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LetterEditor from './components/LetterEditor';
import DriveManager from './components/DriveManager';
import Profile from './components/Profile';
import AuthSuccess from './components/AuthSuccess';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout onThemeToggle={handleThemeToggle} darkMode={darkMode}>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/letters"
            element={
              <PrivateRoute>
                <Layout onThemeToggle={handleThemeToggle} darkMode={darkMode}>
                  <LetterEditor />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/letters/:id"
            element={
              <PrivateRoute>
                <Layout onThemeToggle={handleThemeToggle} darkMode={darkMode}>
                  <LetterEditor />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/drive"
            element={
              <PrivateRoute>
                <Layout onThemeToggle={handleThemeToggle} darkMode={darkMode}>
                  <DriveManager />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout onThemeToggle={handleThemeToggle} darkMode={darkMode}>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      <ToastContainer />
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
