import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../config/appwrite';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const user = await account.get();
      setUser(user);
      console.log('✅ User session restored:', user.name);
    } catch (error) {
      console.log('No active session found');
      localStorage.removeItem('session');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always check for active session on app load
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with Appwrite:', { email });
      
      // Check if there's already an active session
      try {
        const existingUser = await account.get();
        if (existingUser) {
          console.log('✅ User already logged in:', existingUser.name);
          setUser(existingUser);
          return { success: true };
        }
      } catch (sessionError) {
        // No active session, proceed with login
      }
      
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      
      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      console.log('✅ Login successful:', user.name);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('session is active')) {
        // Session already exists, try to get current user
        try {
          const user = await account.get();
          setUser(user);
          return { success: true };
        } catch (getUserError) {
          return { 
            success: false, 
            error: 'Session conflict. Please refresh the page.' 
          };
        }
      }
      
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const user = await account.create('unique()', userData.email, userData.password, userData.full_name);
      const session = await account.createEmailPasswordSession(userData.email, userData.password);
      
      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, data: { user } };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};