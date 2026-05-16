import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
        throw refreshError;
      }
    }
    
    return Promise.reject(error);
  }
);

export const jobAPI = {
  getJobs: () => apiClient.get('/me/jobs'),
  getJob: (jobId: string) => apiClient.get(`/jobs/${jobId}`),
  acceptJob: (jobId: string) => apiClient.post(`/jobs/${jobId}/accept`),
  declineJob: (jobId: string, reason: string) => apiClient.post(`/jobs/${jobId}/decline`, { reason }),
  checkIn: (jobId: string, latitude: number, longitude: number) => 
    apiClient.post(`/jobs/${jobId}/check-in`, { latitude, longitude }),
  verifyOTP: (jobId: string, otp: string) => apiClient.post(`/jobs/${jobId}/verify-otp`, { otp }),
  submitSurvey: (jobId: string, surveyData: any) => 
    apiClient.post(`/jobs/${jobId}/survey`, surveyData),
  completeJob: (jobId: string, signature: string) => 
    apiClient.post(`/jobs/${jobId}/complete`, { signature }),
  uploadPhoto: (jobId: string, photoUri: string, type: string) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: `photo_${jobId}_${type}.jpg`,
    } as any);
    formData.append('type', type);
    return apiClient.post(`/jobs/${jobId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const locationAPI = {
  pingLocation: (latitude: number, longitude: number) =>
    apiClient.post('/location/ping', { latitude, longitude }),
};

export const inventoryAPI = {
  getMaterials: () => apiClient.get('/inventory'),
  useMaterial: (itemId: string, quantity: number) =>
    apiClient.post('/inventory/use', { itemId, quantity }),
};

export default apiClient;