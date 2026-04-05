import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('clms_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.user);
      } catch {
        localStorage.removeItem('clms_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapSession();
  }, [token]);

  async function signup(payload) {
    const response = await api.post('/auth/signup', payload);
    localStorage.setItem('clms_token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  async function login(payload) {
    const response = await api.post('/auth/login', payload);
    localStorage.setItem('clms_token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  async function updateProfile(payload) {
    const response = await api.put('/auth/profile', payload);
    setUser(response.data.user);
    return response.data;
  }

  async function logout() {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } finally {
      localStorage.removeItem('clms_token');
      setToken(null);
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      signup,
      login,
      logout,
      updateProfile,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
