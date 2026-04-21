// src/context/AuthContext.js
// F-013: tokens stored in HttpOnly cookies set by the server — never in localStorage
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// All requests must carry cookies
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      // On 401, attempt token refresh (cookie-based — no token needed in body)
      if (err?.response?.status === 401) {
        try {
          await axios.post(`${API_BASE_URL}/auth/refresh`, {});
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
    // Server sets HttpOnly cookies; response body only contains user + expiresIn
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      // Server reads tokens from cookies and blacklists them, then clears cookies
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
