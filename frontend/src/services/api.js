// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  registerFarmer: (formData) => api.post('/farmer/register', formData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Land Management
export const landService = {
  addLand: (landData) => api.post('/lands/add', landData),
  getMyLands: () => api.get('/lands/my'),
  getLandDetails: (landId) => api.get(`/lands/${landId}`),
};

// Claims services
export const claimService = {
  submitClaim: (claimData) => api.post('/claims/submit', claimData),
  getMyClaims: () => api.get('/claims/my-claims'),
  getAllClaims: () => api.get('/claims/all'),
  verifyClaim: (claimId, data) => api.put(`/claims/${claimId}/verify`, data),
  approveClaim: (claimId, data) => api.put(`/claims/${claimId}/approve`, data),
  getStats: () => api.get('/claims/stats/summary'),
};

// Kerala Agriculture Data
export const keralaService = {
  getMonsoonData: () => api.get('/kerala/weather'),
  getSpiceMarket: () => api.get('/kerala/market/spices'),
  getCropMonitor: () => api.get('/kerala/market/crops'),
  getDistrictRisks: () => api.get('/kerala/districts/risks'),
};

// Image Upload & Analysis
export const imageService = {
  upload: (formData) => api.post('/images/upload-file', formData),
  analyze: (imageUrl) => api.post('/images/analyze', { image_url: imageUrl }),
};

// Master Data
export const masterService = {
  getCrops: () => api.get('/crops/all'),
  getRates: () => api.get('/admin/rates'),
  updateRate: (rateId, data) => api.put(`/admin/rates/${rateId}`, data),
  getPublicRates: () => api.get('/admin/rates/public'),
};

export default api;

