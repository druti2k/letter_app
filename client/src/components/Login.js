import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    if (error) {
      setError('Google authentication failed. Please try again.');
    }
  }, [location]);

  const handleGoogleLogin = () => {
    console.log('Starting Google OAuth flow');
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001'
      : 'https://letter-app-api-production.up.railway.app';
    console.log('Redirecting to:', `${baseUrl}/api/auth/google`);
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form data
      if (isSignUp) {
        if (!formData.name || !formData.name.trim()) {
          setError('Name is required');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
      }

      // Prepare request data
      const data = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ...(isSignUp && { name: formData.name.trim() })
      };

      console.log('Submitting form:', {
        isSignUp,
        endpoint: isSignUp ? '/api/auth/register' : '/api/auth/login',
        data: { ...data, password: '***' }
      });

      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await api.post(endpoint, data);

      console.log('Authentication successful:', {
        token: !!response.data.token,
        user: response.data.user
      });

      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Authentication failed. Please try again.'
      );
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {isSignUp
                ? 'Sign up to start writing letters'
                : 'Sign in to continue writing letters'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              )}
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
              />
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              )}
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{ mt: 3, mb: 2 }}
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            <Divider sx={{ width: '100%', my: 2 }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{ mb: 2 }}
            >
              Continue with Google
            </Button>

            <Button
              color="primary"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  name: '',
                });
              }}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Login; 