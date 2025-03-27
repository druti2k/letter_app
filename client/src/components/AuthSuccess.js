import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        console.log('Processing auth success...');
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const error = params.get('error');
        const details = params.get('details');

        console.log('URL parameters:', { token: token ? 'present' : 'missing', error, details });

        if (error) {
          console.error('Auth error:', error, details);
          navigate('/login?error=' + encodeURIComponent(error));
          return;
        }

        if (!token) {
          console.error('No token received');
          navigate('/login?error=no_token');
          return;
        }

        try {
          // Decode token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          console.log('Token decoded successfully:', { email: payload.email, name: payload.name });

          // Store token and clean up URL before login attempt
          localStorage.setItem('token', token);
          window.history.replaceState({}, document.title, window.location.pathname);

          // Login user
          await login(token, {
            id: payload.id,
            email: payload.email,
            name: payload.name
          });
          console.log('Login successful, redirecting to dashboard...');

          // Use replace instead of push to prevent back button from returning to auth success
          navigate('/dashboard', { replace: true });
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          localStorage.removeItem('token');
          navigate('/login?error=invalid_token');
        }
      } catch (error) {
        console.error('Error processing auth callback:', error);
        localStorage.removeItem('token');
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthSuccess();
  }, [login, navigate]);

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
};

export default AuthSuccess; 