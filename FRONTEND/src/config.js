const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000'
    : 'https://www.nystai.in'; // NGINX handles /api → backend

export default API_BASE;
