import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('wf_token');
      const storedUser = await SecureStore.getItemAsync('wf_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        // Proactively fetch fresh user info in background
        fetchUser();
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
      await SecureStore.setItemAsync('wf_user', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch user', err);
      if (err.response && err.response.status === 401) {
        logout();
      }
    }
  };

  const login = async (email, password, role) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/login', { email, password, role });
      
      setToken(data.token);
      setUser(data);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      await SecureStore.setItemAsync('wf_token', data.token);
      await SecureStore.setItemAsync('wf_user', JSON.stringify(data));
      await SecureStore.setItemAsync('wf_last_role', data.role);
      
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/register', userData);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
      await SecureStore.deleteItemAsync('wf_token');
      await SecureStore.deleteItemAsync('wf_user');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { data } = await api.post('/api/auth/forgotpassword', { email });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetPassword = async (email, otp, password) => {
    try {
      const { data } = await api.post('/api/auth/resetpassword', { email, otp, password });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const getSecurityQuestion = async (email) => {
    try {
      const { data } = await api.post('/api/auth/get-security-question', { email });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetPasswordSecurity = async (email, securityAnswer, newPassword) => {
    try {
      const { data } = await api.post('/api/auth/reset-password-security', { email, securityAnswer, newPassword });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const setupSecurity = async (securityQuestion, securityAnswer, newPassword) => {
    try {
      const { data } = await api.put('/api/auth/setup-security', { securityQuestion, securityAnswer, newPassword });
      if (data.token) {
        setToken(data.token);
        await SecureStore.setItemAsync('wf_token', data.token);
      }
      await fetchUser();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const { data } = await api.put('/api/auth/change-password', { currentPassword, newPassword });
      if (data.token) {
        setToken(data.token);
        await SecureStore.setItemAsync('wf_token', data.token);
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      loading,
      error,
      login,
      register,
      forgotPassword,
      resetPassword,
      getSecurityQuestion,
      resetPasswordSecurity,
      setupSecurity,
      changePassword,
      logout,
      clearError: () => setError(null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
