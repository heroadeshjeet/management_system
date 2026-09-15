import React from 'react';
import { Shield, Building2, LogOut, RotateCcw, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';

export const Navbar = ({ onReplaySplash }) => {
  const { user, activeBlock, logout } = useAuth();
  const { isAmoled, theme } = useTheme();

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 border-b ${
        isAmoled
          ? 'bg-black/80 backdrop-blur-xl border-white/10 text-white shadow-2xl'
          : 'bg-white/85 backdrop-blur-xl border-slate-200/80 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Brand & Block Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1 flex items-center justify-center border transition-all overflow-hidden ${
              isAmoled
                ? 'bg-neutral-950 border-brand-cyan/30 text-brand-cyan shadow-neon-cyan/20'
                : 'bg-indigo-50 border-indigo-200 text-brand-indigo'
            }`}
          >
            <img
              src={isAmoled || theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'}
              alt="Aryabhatta Group Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <span className="hidden font-extrabold text-xs tracking-tighter">AGI</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                Aryabhatta Group
              </span>
              <span className="hidden md:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Phase 5
              </span>
            </div>

            {/* Active Block Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="w-3 h-3 text-brand-cyan" />
              <span className="font-medium text-brand-cyan tracking-wide">
                {activeBlock}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Right: Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Replay Splash Screen Icon */}
          <button
            onClick={onReplaySplash}
            title="Replay Animated Intro Screen"
            className={`p-2 rounded-full border transition-colors ${
              isAmoled
                ? 'border-white/10 hover:bg-white/10 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <SoundToggle />

          {/* Theme Toggler (Light / AMOLED) */}
          <ThemeToggle />

          {/* User Session Info / Logout Button */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-current/10">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  {user.role} · ID {user.identifier}
                </span>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold uppercase ${
                  user.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : user.role === 'teacher'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Log out of session"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isAmoled
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Unified Gateway</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
