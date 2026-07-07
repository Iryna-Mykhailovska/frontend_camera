import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:5001', // Наш новый изолированный порт
  baseURL: 'https://backend-cameras.onrender.com',
  withCredentials: true
});


// Автоматически добавляем JWT-токен к каждому запросу
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;