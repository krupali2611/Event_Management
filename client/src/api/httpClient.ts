import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/utils/authStorage';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const fallbackApiBaseUrl = 'http://localhost:5000/api';

export const httpClient = axios.create({
  baseURL: configuredApiBaseUrl && configuredApiBaseUrl.length > 0 ? configuredApiBaseUrl.replace(/\/+$/, '') : fallbackApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    return Promise.reject(error);
  },
);
