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
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config.url.startsWith('/api/auth/')) {
        localStorage.removeItem('token');
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