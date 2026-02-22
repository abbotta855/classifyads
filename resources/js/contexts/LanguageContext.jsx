import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Safely get i18n - useTranslation might fail during initial render
  let i18n = null;
  try {
    const translation = useTranslation();
    i18n = translation.i18n;
  } catch (e) {
    // i18n not ready yet, will initialize on next render
    console.warn('i18n not ready:', e);
  }
  
  const [language, setLanguage] = useState(() => {
    // Initialize from localStorage or default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('i18nextLng') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    // Sync with i18n language when i18n is available
    if (i18n) {
      const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
      if (savedLanguage !== language) {
        setLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
    }
  }, [i18n, language]);

  const changeLanguage = (lng) => {
    setLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    if (i18n) {
      i18n.changeLanguage(lng);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

