// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      // On 401, try to refresh the token before logging out
      if (err?.response?.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const newToken = refreshRes.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            // fetchProfile will re-run via the token useEffect
            return;
          } catch {
            // refresh also failed — clear everything
          }
        }
      }
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { accessToken, refreshToken, user: userData } = res.data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      // F-004: send refresh token so the server can blacklist it too
      const refreshToken = localStorage.getItem('refreshToken');
      await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
    } catch {}
    clearSession();
  };

  const hasRole = (...roles) => !!(user && (roles.includes(user.role) || user.role === 'admin'));

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
