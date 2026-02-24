// src/config/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Determine API URL based on platform
let API_BASE_URL: string;

if (Platform.OS === 'web') {
  // Web: use localhost
  API_BASE_URL = 'http://localhost:8080/api';
} else {
  // Mobile (iOS/Android): use your local network IP
  // Make sure your server is bound to 0.0.0.0 and firewall allows port 8080
  API_BASE_URL = 'http://192.168.101.101:8080/api';
}

export { API_BASE_URL };

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
