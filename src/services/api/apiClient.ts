import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storageService } from '../storage/storageService';
import { ApiError } from '../../models/api.model';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Production Render cloud server default
  return 'https://hfinmate-backend.onrender.com/v1';
};


export const BASE_URL = getBaseUrl();

// eslint-disable-next-line import/no-named-as-default-member
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const session = await storageService.getItem<{ token?: string }>('user_session');
      const directToken = await storageService.getItem<string>('auth_token');
      const token = session?.token || directToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore token fetch failure on anonymous requests
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error structure
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const formattedError: ApiError = {
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      message:
        error.response?.data?.message ||
        error.message ||
        'Có lỗi xảy ra khi kết nối máy chủ.',
      details: (error.response?.data as Record<string, unknown>) || undefined,
    };
    return Promise.reject(formattedError);
  }
);
