import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

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

        console.log('URL parameters:', { 
          hasToken: !!token,
          error,
          details
        });

        if (error) {
          console.error('Auth error:', { error, details });
          navigate('/login', { 
            replace: true,
            state: { error: `Authentication failed: ${error}` }
          });
          return;
        }

        if (!token) {
          console.error('No token received');
          navigate('/login', {
            replace: true,
            state: { error: 'No authentication token received' }
          });
          return;
        }

        try {
          // Decode token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          console.log('Token decoded:', {
            hasUserId: !!payload.id,
            hasEmail: !!payload.email,
            hasName: !!payload.name
          });

          if (!payload.id || !payload.email || !payload.name) {
            throw new Error('Invalid token payload');
          }

          // Clean up URL before login attempt
          window.history.replaceState({}, document.title, window.location.pathname);

          // Attempt login
          await login(token, {
            id: payload.id,
            email: payload.email,
            name: payload.name
          });

          console.log('Login successful');
          navigate('/dashboard', { replace: true });
        } catch (decodeError) {
          console.error('Token processing error:', decodeError);
          navigate('/login', {
            replace: true,
            state: { error: 'Invalid authentication token' }
          });
        }
      } catch (error) {
        console.error('Auth success handling error:', error);
        navigate('/login', {
          replace: true,
          state: { error: 'Authentication process failed' }
        });
      }
    };

    handleAuthSuccess();
  }, [login, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="textSecondary">
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthSuccess; 