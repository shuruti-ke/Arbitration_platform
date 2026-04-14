// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for various endpoints
export const apiService = {
  // Cases API
  getCases: () => api.get('/cases'),
  getCase: (id) => api.get(`/cases/${id}`),
  createCase: (caseData) => api.post('/cases', caseData),
  updateCase: (id, caseData) => api.put(`/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/cases/${id}`),

  // Documents API
  getDocuments: () => api.get('/documents'),
  uploadDocument: (documentData) => api.post('/documents', documentData),
  getDocument: (id) => api.get(`/documents/${id}`),

  // Analytics API
  getAnalytics: () => api.get('/analytics'),

  // Authentication API
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),

  // Settings API
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
};

export default apiService;