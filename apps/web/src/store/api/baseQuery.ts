import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout, setToken, setUser } from '../slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const token = localStorage.getItem('accessToken');
  
  const argsObj = typeof args === 'string' ? { url: args } : args;
  
  const result = await fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (argsObj.headers) {
        const requestHeaders = new Headers(argsObj.headers as HeadersInit);
        requestHeaders.forEach((value: string, key: string) => headers.set(key, value));
      }
      return headers;
    },
  })(argsObj, api, extraOptions);

  if (result.error) {
    const status = result.error.status;
    
    if (status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !argsObj.url.toString().includes('/auth/refresh')) {
        try {
          const refreshResult = await fetchBaseQuery({
            baseUrl: API_BASE_URL,
          })({
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          }, api, extraOptions);

          if (refreshResult.data) {
            const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as {
              accessToken: string;
              refreshToken: string;
            };
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            api.dispatch(setToken(accessToken));
            
            const retryResult = await fetchBaseQuery({
              baseUrl: API_BASE_URL,
              prepareHeaders: (headers) => {
                headers.set('Content-Type', 'application/json');
                headers.set('Authorization', `Bearer ${accessToken}`);
                if (argsObj.headers) {
                  const requestHeaders = new Headers(argsObj.headers as HeadersInit);
                  requestHeaders.forEach((value: string, key: string) => headers.set(key, value));
                }
                return headers;
              },
            })(argsObj, api, extraOptions);
            
            return retryResult;
          }
        } catch {
          api.dispatch(logout());
        }
      } else {
        api.dispatch(logout());
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Job', 'Technician', 'Inventory', 'Client', 'Location', 'Report'],
  endpoints: () => ({}),
});
