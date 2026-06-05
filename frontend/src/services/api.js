import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const getAuthStatus = () => api.get('/auth/status');
export const logout = () => api.post('/auth/logout');
export const getLoginUrl = () => `${API_URL}/auth/login`;

// Validation Rules
export const fetchValidationRules = () => api.get('/validation-rules');
export const getCachedValidationRules = () => api.get('/validation-rules/cached');
export const toggleValidationRule = (id, active) =>
  api.patch(`/validation-rule/${id}`, { active });
export const toggleAllValidationRules = (active) =>
  api.patch('/validation-rules/toggle-all', { active });
export const deployChanges = () => api.post('/deploy');

export default api;
