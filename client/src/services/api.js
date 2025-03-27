import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Add more detailed error handling
    const errorMessage = error.response?.data?.message || error.message;
    console.error('API Error:', errorMessage);
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