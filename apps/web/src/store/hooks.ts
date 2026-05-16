import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { login as loginAction, logout as logoutAction, User } from './slices/authSlice';
import { apiClient } from '../lib/axios';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser && !isAuthenticated) {
      try {
        const userData = JSON.parse(storedUser) as User;
        dispatch(loginAction({ user: userData, accessToken: token, refreshToken: '' }));
      } catch {
        dispatch(logoutAction());
      }
    }

    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }

    setIsReady(true);
  }, [dispatch, navigate, location.pathname, isAuthenticated]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      dispatch(loginAction({ user, accessToken, refreshToken }));
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/', { replace: true });
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const signOut = () => {
    dispatch(logoutAction());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return { user, isAuthenticated: isAuthenticated && !!user, isReady, signIn, signOut };
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
    
    if (isReady && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        navigate('/', { replace: true });
      }
    }
  }, [isReady, isAuthenticated, user, allowedRoles, navigate, location]);

  return { user, isAuthenticated, isReady };
}