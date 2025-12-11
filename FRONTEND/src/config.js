const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000'
    : 'http://64.227.89.7'; // NGINX handles /api → backend

export default API_BASE;
