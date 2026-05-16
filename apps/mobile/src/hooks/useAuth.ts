import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

export interface User {
  id: string;
  phone: string;
  fullName?: string;
  role: 'technician';
  pin?: string;
  biometricsEnabled?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsReady(true);
    }
  };

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { phone, password });
      const { user, accessToken, refreshToken } = response.data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const loginWithOTP = useCallback(async (phone: string, otp: string) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { phone, otp });
      const { user, accessToken, refreshToken } = response.data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    try {
      await apiClient.post('/auth/setup-pin', { userId: user?.id, pin });
      
      const updatedUser = { ...user!, pin };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Pin setup failed:', error);
      throw error;
    }
  }, [user]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedPin = user?.pin;
    if (storedPin === pin) {
      return true;
    }
    return false;
  }, [user]);

  const enableBiometrics = useCallback(async () => {
    try {
      await apiClient.post('/auth/enable-biometrics', { userId: user?.id });
      
      const updatedUser = { ...user!, biometricsEnabled: true };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Biometrics setup failed:', error);
      throw error;
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isReady,
    login,
    loginWithOTP,
    setupPin,
    verifyPin,
    enableBiometrics,
    logout,
  };
}