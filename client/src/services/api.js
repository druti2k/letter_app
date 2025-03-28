import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  return 'https://letter-app-api-production.up.railway.app';
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
  // Don't add token for auth endpoints except verify
  const isAuthEndpoint = config.url.startsWith('/api/auth/') && !config.url.includes('/verify');
  const token = localStorage.getItem('token');
  
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('Making request:', {
    url: config.url,
    method: config.method,
    hasToken: !!config.headers.Authorization,
    data: config.data
  });
  return config;
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Only handle 401 errors for non-auth endpoints
    if (error.response?.status === 401 && !error.config.url.startsWith('/api/auth/')) {
      console.log('Unauthorized access, clearing token');
      localStorage.removeItem('token');
      // Use window.location.replace to prevent adding to history
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const verifyToken = () => api.get('/api/auth/verify');

// Letter API calls
export const getLetters = () => api.get('/api/letters');
export const getLetter = (id) => api.get(`/api/letters/${id}`);
export const createLetter = (data) => api.post('/api/letters', data);
export const updateLetter = (id, data) => api.put(`/api/letters/${id}`, data);
export const deleteLetter = (id) => api.delete(`/api/letters/${id}`);

// Google Drive API calls
export const uploadToDrive = (data) => api.post('/api/drive/upload', data);
export const getFilesFromDrive = () => api.get('/api/drive/files');
export const getFileFromDrive = (fileId) => api.get(`/api/drive/files/${fileId}`);

export { api }; 