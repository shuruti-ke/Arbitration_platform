// src/context/ThemeModeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeModeContext = createContext(null);
const STORAGE_KEY = 'arbitration-platform-theme-mode';

const getInitialMode = () => {
  if (typeof window === 'undefined') return 'light';

  const savedMode = window.localStorage.getItem(STORAGE_KEY);
  if (savedMode === 'light' || savedMode === 'dark') {
    return savedMode;
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
