import axios from 'axios';
import API_BASE from '../config';

const API = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? API_BASE // Local backend: http://localhost:5000
      : API_BASE + '/api', // Production: /api prefix
});

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
