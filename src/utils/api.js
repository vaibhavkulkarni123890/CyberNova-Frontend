import axios from 'axios';
import { executeFunction, isAppwriteDeployment } from '../config/appwrite';
import { callAppwriteFunction } from './directAppwriteCall';

// API Configuration for Appwrite deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const IS_APPWRITE = isAppwriteDeployment();
const APPWRITE_FUNCTION_ID = process.env.REACT_APP_APPWRITE_FUNCTION_ID;

// Debug logging
console.log('🔧 API Configuration Debug:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('IS_APPWRITE:', IS_APPWRITE);
console.log('APPWRITE_FUNCTION_ID:', APPWRITE_FUNCTION_ID);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for Appwrite functions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Appwrite Functions
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (IS_APPWRITE) {
      // For Appwrite Functions, we need to structure the request differently
      const originalData = config.data;
      const originalUrl = config.url;
      
      config.url = ''; // Appwrite function URL is already in baseURL
      config.method = 'POST'; // Appwrite functions always use POST
      
      // Wrap the request in Appwrite function format
      config.data = {
        method: config.method || 'GET',
        path: originalUrl,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: originalData ? JSON.stringify(originalData) : undefined,
      };
    } else {
      // Standard API configuration
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle Appwrite function response format
    if (IS_APPWRITE && response.data && response.data.body) {
      try {
        response.data = JSON.parse(response.data.body);
      } catch (e) {
        // If parsing fails, use the original response
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods with Appwrite support
export const authAPI = {
  login: async (email, password) => {
    console.log('🔍 Login attempt - IS_APPWRITE:', IS_APPWRITE, 'FUNCTION_ID:', APPWRITE_FUNCTION_ID);
    
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        console.log('✅ Using direct Appwrite call for login');
        const result = await callAppwriteFunction(APPWRITE_FUNCTION_ID, {
          method: 'POST',
          path: '/api/auth/login',
          headers: {},
          body: JSON.stringify({ email, password })
        });
        console.log('✅ Appwrite login result:', result);
        return { data: result };
      } catch (error) {
        console.error('❌ Appwrite login error:', error);
        throw error;
      }
    }
    
    console.log('⚠️ Falling back to axios for login');
    return api.post('/api/auth/login', { email, password });
  },
  
  register: async (userData) => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/auth/register',
          method: 'POST',
          body: userData
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite register error:', error);
        throw error;
      }
    }
    return api.post('/api/auth/register', userData);
  },
  
  getMe: async () => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const token = localStorage.getItem('token');
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite getMe error:', error);
        throw error;
      }
    }
    return api.get('/api/auth/me');
  },
};

export const dashboardAPI = {
  getStats: async () => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const token = localStorage.getItem('token');
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/dashboard/stats',
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite getStats error:', error);
        throw error;
      }
    }
    return api.get('/api/dashboard/stats');
  },
  
  getAlerts: async () => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const token = localStorage.getItem('token');
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/dashboard/alerts',
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite getAlerts error:', error);
        throw error;
      }
    }
    return api.get('/api/dashboard/alerts');
  },
  
  systemScan: async () => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const token = localStorage.getItem('token');
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/system/scan',
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite systemScan error:', error);
        throw error;
      }
    }
    return api.post('/api/system/scan');
  },
};

export const waitlistAPI = {
  join: async (email) => {
    if (IS_APPWRITE && APPWRITE_FUNCTION_ID) {
      try {
        const result = await executeFunction(APPWRITE_FUNCTION_ID, {
          path: '/api/waitlist',
          method: 'POST',
          body: { email }
        });
        return { data: result };
      } catch (error) {
        console.error('Appwrite waitlist error:', error);
        throw error;
      }
    }
    return api.post('/api/waitlist', { email });
  },
};

export default api;