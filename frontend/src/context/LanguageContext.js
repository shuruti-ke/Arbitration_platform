import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDirection, normalizeLanguage, SUPPORTED_LANGUAGES, translate } from '../i18n/translations';

const STORAGE_KEY = 'arbitration-platform-language';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }

  const browserLanguage = window.navigator?.language || window.navigator?.languages?.[0];
  return normalizeLanguage(browserLanguage);
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    const normalized = normalizeLanguage(language);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    document.documentElement.lang = normalized;
    document.documentElement.dir = getDirection(normalized);
  }, [language]);

  const setLanguage = (nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    dir: getDirection(language),
    languages: SUPPORTED_LANGUAGES,
    t: (key, params) => translate(language, key, params)
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
