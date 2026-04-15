// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
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
  getDocuments: (level) => api.get(`/documents${level ? `?level=${level}` : ''}`),
  uploadDocument: (documentData) => api.post('/documents', documentData),
  getDocument: (id) => api.get(`/documents/${id}`),
  analyzeDocument: (id, prompt) => api.post(`/documents/${id}/analyze`, { prompt }),
  deleteDocument: (id) => api.delete(`/documents/${id}`),

  // Analytics
  getAnalytics: () => api.get('/analytics'),

  // Consent
  recordConsent: (userId, consentData) => api.post('/consent/record', { userId, consentData }),
  checkConsent: (userId, purpose) => api.get(`/consent/check?userId=${userId}&purpose=${purpose}`),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),

  // Parties & Counsel
  addParty: (caseId, partyData) => api.post(`/cases/${caseId}/parties`, partyData),
  addCounsel: (caseId, counselData) => api.post(`/cases/${caseId}/counsel`, counselData),
  updateMilestone: (caseId, milestoneId, data) => api.put(`/cases/${caseId}/milestones/${milestoneId}`, data),

  // AI
  getGoverningLaw: (data) => api.post('/ai/governing-law', data),

  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
};

export default apiService;
