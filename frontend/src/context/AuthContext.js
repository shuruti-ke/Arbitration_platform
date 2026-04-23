// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// All requests carry cookies (HttpOnly) AND Bearer header for Vercel proxy compat
axios.defaults.withCredentials = true;

function getStoredToken() {
  try { return localStorage.getItem('accessToken'); } catch { return null; }
}
function setStoredTokens(accessToken, refreshToken) {
  try {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  } catch {}
}
function clearStoredTokens() {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch {}
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const clearSession = () => {
    clearStoredTokens();
    applyToken(null);
    setUser(null);
  };

  useEffect(() => {
    const token = getStoredToken();
    if (token) applyToken(token);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      if (err?.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, refreshToken ? { refreshToken } : {});
          if (refreshRes.data.accessToken) {
            setStoredTokens(refreshRes.data.accessToken, null);
            applyToken(refreshRes.data.accessToken);
          }
          const retry = await axios.get(`${API_BASE_URL}/auth/me`);
          setUser(retry.data.user);
          return;
        } catch {
          // Refresh also failed — session expired
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
    if (accessToken) {
      setStoredTokens(accessToken, refreshToken);
      applyToken(accessToken);
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch {}
    clearSession();
  };

  const hasRole = (...roles) => !!(user && (roles.includes(user.role) || user.role === 'admin'));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
