import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  async function signup(payload) {
    const response = await api.post('/auth/signup', payload);
    setUser(response.data.user);
    return response.data;
  }

  async function login(payload) {
    const response = await api.post('/auth/login', payload);
    setUser(response.data.user);
    return response.data;
  }

  async function updateProfile(payload) {
    const response = await api.put('/auth/profile', payload);
    setUser(response.data.user);
    return response.data;
  }

  async function requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data;
  }

  async function confirmPasswordReset(token, password) {
    const response = await api.post('/auth/password-reset/confirm', { token, password });
    return response.data;
  }

  async function changePassword(payload) {
    const response = await api.post('/auth/change-password', payload);
    return response.data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
      updateProfile,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
