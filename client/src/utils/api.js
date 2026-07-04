import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 60000
});

// Attach JWT from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ae_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ae_token');
      localStorage.removeItem('ae_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  googleLogin: data => api.post('/auth/google', data),
  verifyOTP: data => api.post('/auth/verify-otp', data),
  resendOTP: data => api.post('/auth/resend-otp', data),
  me: () => api.get('/auth/me'),
  updateProfile: data => api.patch('/auth/profile', data)
};

// Products
export const productsAPI = {
  getAll: params => api.get('/products', { params }),
  getById: id => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getPresets: () => api.get('/products/presets'),
  create: data => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.patch(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: id => api.delete(`/products/${id}`)
};

// Visualizer
export const visualizerAPI = {
  uploadPhoto: formData => api.post('/visualizer/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  }),
  segment: (photoUrl) => api.post('/visualizer/segment', { photoUrl }, {
    timeout: 150000 // 2.5 min — first run downloads SegFormer model (~85MB)
  }),
  generate: data => api.post('/visualizer/generate', data, { timeout: 300000 })
};

// Renders
export const rendersAPI = {
  getMine: () => api.get('/renders'),
  getById: id => api.get(`/renders/${id}`),
  getShared: token => api.get(`/renders/shared/${token}`),
  share: id => api.post(`/renders/${id}/share`),
  delete: id => api.delete(`/renders/${id}`)
};

// Quotes
export const quotesAPI = {
  submit: data => api.post('/quotes', data),
  getMine: () => api.get('/quotes/mine'),
  getAll: params => api.get('/quotes', { params }),
  updateStatus: (id, data) => api.patch(`/quotes/${id}/status`, data)
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  seed: () => api.post('/admin/seed')
};

export default api;
