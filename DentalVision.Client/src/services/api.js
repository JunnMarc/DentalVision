import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5098/api',
});

// Request interceptor to automatically append JWT token and Tenant context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantSlug = localStorage.getItem('tenant_slug') || 'default';
    config.headers['X-Tenant-Slug'] = tenantSlug;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens and auth issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
