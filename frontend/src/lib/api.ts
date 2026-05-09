import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) => api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
  updateMe: (data: Record<string, unknown>) => api.put('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Apps
export const appsApi = {
  list: () => api.get('/apps'),
  get: (id: string) => api.get(`/apps/${id}`),
  create: (config: unknown) => api.post('/apps', { config }),
  update: (id: string, config: unknown) => api.put(`/apps/${id}`, { config }),
  delete: (id: string) => api.delete(`/apps/${id}`),
  validate: (config: unknown) => api.post('/apps/validate', config),
};

// Data (dynamic CRUD)
export const dataApi = {
  list: (appId: string, entity: string, params?: Record<string, unknown>) =>
    api.get(`/apps/${appId}/data/${entity}`, { params }),
  get: (appId: string, entity: string, id: string) =>
    api.get(`/apps/${appId}/data/${entity}/${id}`),
  create: (appId: string, entity: string, data: Record<string, unknown>) =>
    api.post(`/apps/${appId}/data/${entity}`, data),
  update: (appId: string, entity: string, id: string, data: Record<string, unknown>) =>
    api.put(`/apps/${appId}/data/${entity}/${id}`, data),
  delete: (appId: string, entity: string, id: string) =>
    api.delete(`/apps/${appId}/data/${entity}/${id}`),
  stats: (appId: string, entity: string) =>
    api.get(`/apps/${appId}/data/${entity}/stats`),
  importCsv: (appId: string, entity: string, file: File, mapping?: Record<string, string>) => {
    const form = new FormData();
    form.append('file', file);
    if (mapping) form.append('mapping', JSON.stringify(mapping));
    return api.post(`/apps/${appId}/data/${entity}/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportCsv: (appId: string, entity: string) =>
    api.get(`/apps/${appId}/data/${entity}/export`, { responseType: 'blob' }),
};

// Notifications
export const notificationsApi = {
  list: (appId: string) => api.get(`/apps/${appId}/notifications`),
  markRead: (appId: string, id: string) => api.put(`/apps/${appId}/notifications/${id}/read`),
  markAllRead: (appId: string) => api.put(`/apps/${appId}/notifications/read-all`),
};
