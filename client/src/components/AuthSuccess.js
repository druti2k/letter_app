import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        console.log('Processing auth success...', location.search);
        
        // Get token from URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');
        const details = params.get('details');

        console.log('URL parameters:', { 
          token: token ? token.substring(0, 20) + '...' : null,
          error,
          details
        });

        if (error) {
          console.error('Auth error:', { error, details });
          navigate('/login', { 
            replace: true,
            state: { error: `Authentication failed: ${error}${details ? `: ${details}` : ''}` }
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
          const decodedToken = decodeURIComponent(token);
          console.log('Decoded token length:', decodedToken.length);
          
          const base64Url = decodedToken.split('.')[1];
          if (!base64Url) {
            throw new Error('Invalid token format');
          }
          
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          console.log('Token decoded successfully:', {
            hasUserId: !!payload.id,
            hasEmail: !!payload.email,
            hasName: !!payload.name
          });

          // Clean up URL
          window.history.replaceState({}, document.title, '/auth/success');

          // Login
          await login(decodedToken, {
            id: payload.id,
            email: payload.email,
            name: payload.name
          });

          console.log('Login successful, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } catch (decodeError) {
          console.error('Token processing error:', decodeError);
          navigate('/login', {
            replace: true,
            state: { error: 'Invalid authentication token: ' + decodeError.message }
          });
        }
      } catch (error) {
        console.error('Auth success handling error:', error);
        navigate('/login', {
          replace: true,
          state: { error: 'Authentication process failed: ' + error.message }
        });
      }
    };

    handleAuthSuccess();
  }, [login, navigate, location]);

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