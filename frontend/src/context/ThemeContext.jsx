import React, { createContext, useContext, useEffect, useState } from 'react';
import { sfx } from '../utils/soundEffects';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Read initial theme preference from localStorage or default to amoled
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('aryabhatta_theme');
    if (saved) return saved;
    // Default to AMOLED mode for ultra-sleek high-contrast modern experience
    return 'amoled';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'amoled') {
      root.classList.add('dark');
      root.classList.add('amoled');
      document.body.style.backgroundColor = '#000000';
    } else {
      root.classList.remove('dark');
      root.classList.remove('amoled');
      document.body.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('aryabhatta_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    sfx.playClick();
    setTheme((prev) => (prev === 'amoled' ? 'light' : 'amoled'));
  };

  const isAmoled = theme === 'amoled';

  return (
    <ThemeContext.Provider value={{ theme, isAmoled, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
