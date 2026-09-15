import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, isAmoled, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggler"
      aria-label="Toggle Light and AMOLED Dark Theme"
      title={isAmoled ? 'Switch to Ultra-Clean Light Mode' : 'Switch to Pure AMOLED Dark Mode'}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
        isAmoled
          ? 'bg-neutral-900/90 text-amber-300 border border-amber-400/20 hover:border-amber-400/50 shadow-sm'
          : 'bg-slate-100 text-slate-800 border border-slate-300/80 hover:border-slate-400 shadow-sm'
      }`}
    >
      <span className="relative flex items-center justify-center w-5 h-5 rounded-full">
        {isAmoled ? (
          <Moon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
      <span className="hidden sm:inline tracking-wide font-medium">
        {isAmoled ? 'AMOLED Mode' : 'Light Mode'}
      </span>
    </button>
  );
};
