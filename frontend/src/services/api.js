// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Health
  getHealth: () => api.get('/health'),

  // Cases
  getCases: () => api.get('/cases'),
  getCase: (id) => api.get(`/cases/${id}`),
  createCase: (caseData) => api.post('/cases', caseData),
  updateCase: (id, caseData) => api.put(`/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/cases/${id}`),

  // Documents
  getDocuments: () => api.get('/documents'),
  uploadDocument: (documentData) => api.post('/documents', documentData),
  getDocument: (id) => api.get(`/documents/${id}`),

  // Analytics
  getAnalytics: () => api.get('/analytics'),

  // Consent
  recordConsent: (userId, consentData) => api.post('/consent/record', { userId, consentData }),
  checkConsent: (userId, purpose) => api.get(`/consent/check?userId=${userId}&purpose=${purpose}`),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),

  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
};

export default apiService;
