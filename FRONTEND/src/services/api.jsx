import axios from 'axios';
import API_BASE from '../config';

// Create axios instance
const API = axios.create({
  baseURL:
    import.meta.env.MODE === 'development' ? API_BASE : API_BASE + '/api',
});

// REQUEST INTERCEPTOR
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR — AUTO LOGOUT ON TOKEN EXPIRED
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token_expiry');

      // Force redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);


export default API;
