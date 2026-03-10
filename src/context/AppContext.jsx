import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('nakib-cloud-lang') || 'en');
  const [theme, setThemeState] = useState(() => localStorage.getItem('nakib-cloud-theme') || 'light');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language);
    localStorage.setItem('nakib-cloud-lang', language);
  }, [language]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nakib-cloud-theme', theme);
  }, [theme]);

  function setLanguage(lang) {
    setLanguageState(lang);
  }

  function toggleLanguage() {
    setLanguageState(l => l === 'en' ? 'bn' : 'en');
  }

  function setTheme(t) {
    setThemeState(t);
  }

  function toggleTheme() {
    setThemeState(t => t === 'light' ? 'dark' : 'light');
  }

  function showToast(message, type = 'info', duration = 4000) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <AppContext.Provider value={{ language, theme, toasts, setLanguage, toggleLanguage, setTheme, toggleTheme, showToast, removeToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
