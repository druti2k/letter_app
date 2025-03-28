import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  return process.env.REACT_APP_API_URL || 'https://letter-app-api-production.up.railway.app';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('Making request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    baseURL: config.baseURL
  });
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const token = localStorage.getItem('token');
      const isAuthEndpoint = error.config.url.includes('/api/auth/');
      
      // Handle different types of auth errors
      switch (errorCode) {
        case 'GOOGLE_AUTH_REQUIRED':
          // Redirect to Google auth
          window.location.href = `${getBaseUrl()}/api/auth/google`;
          break;
        case 'GOOGLE_REAUTH_REQUIRED':
          // Force reauthorization with Google
          window.location.href = `${getBaseUrl()}/api/auth/google?prompt=consent`;
          break;
        case 'TOKEN_EXPIRED':
        case 'INVALID_TOKEN':
        case 'AUTH_FAILED':
          if (token && !isAuthEndpoint) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
        default:
          if (token && !isAuthEndpoint) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const register = async (data) => {
  const response = await api.post('/api/auth/register', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
};

export const login = async (data) => {
  const response = await api.post('/api/auth/login', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
};

export const verifyToken = async () => {
  try {
    const response = await api.get('/api/auth/verify');
    return response;
  } catch (error) {
    localStorage.removeItem('token');
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Google Auth
export const connectGoogle = () => {
  window.location.href = `${getBaseUrl()}/api/auth/google`;
};

export const reconnectGoogle = () => {
  window.location.href = `${getBaseUrl()}/api/auth/google?prompt=consent`;
};

// Letter API calls
export const getLetters = () => api.get('/api/letters');
export const getLetter = (id) => api.get(`/api/letters/${id}`);
export const createLetter = (data) => api.post('/api/letters', data);
export const updateLetter = (id, data) => api.put(`/api/letters/${id}`, data);
export const deleteLetter = (id) => api.delete(`/api/letters/${id}`);
export const getLettersCount = () => api.get('/api/letters/count');
export const getRecentLetters = () => api.get('/api/letters/recent');

// Google Drive API calls
export const uploadToDrive = (data) => api.post('/api/drive/upload', data);
export const getFilesFromDrive = () => api.get('/api/drive/files');
export const getFileFromDrive = (fileId) => api.get(`/api/drive/files/${fileId}`);
export const getDriveStorage = () => api.get('/api/drive/storage');

export { api }; 