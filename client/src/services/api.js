import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001'
    : 'https://letter-app-api-production.up.railway.app';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
  timeout: 10000, // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        baseURL: config.baseURL
      });
    }
    
    return config;
  }, 
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Only handle 401 for non-auth endpoints
      if (!error.config.url.startsWith('/api/auth/')) {
        localStorage.removeItem('token');
        // Use replace to prevent back navigation to unauthorized page
        window.location.replace('/login');
      }
    }

    // Network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const verifyToken = () => api.get('/api/auth/verify');
export const logout = () => {
  localStorage.removeItem('token');
  return api.post('/api/auth/logout');
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
export const updateDriveFile = (fileId, data) => api.put(`/api/drive/files/${fileId}`, data);
export const deleteDriveFile = (fileId) => api.delete(`/api/drive/files/${fileId}`);
export const getDriveStorage = () => api.get('/api/drive/storage');

export { api }; 