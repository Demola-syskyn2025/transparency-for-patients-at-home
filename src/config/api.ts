// src/config/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
// For Android emulator use 10.0.2.2, for physical device use your machine's IP
// For Android emulator: 'http://10.0.2.2:8080/api'
// For web or iOS simulator: 'http://localhost:8080/api'
// For physical device: 'http://<YOUR_IP>:8080/api'
export const API_BASE_URL = 'http://192.168.1.103:8080/api'; // Your actual IP

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      // The AuthContext will detect the missing token and redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
