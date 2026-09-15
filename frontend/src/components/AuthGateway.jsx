import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sfx } from '../utils/soundEffects';

export const AuthGateway = () => {
  const { login, mockAccounts, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both Identifier and Password.');
      sfx.playError();
      triggerShake();
      return;
    }

    setIsLoading(true);
    sfx.playClick();

    const result = await login(identifier, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Invalid credentials.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const fillMock = (account) => {
    sfx.playClick();
    setIdentifier(account.identifier);
    setPassword(account.password);
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-brand-indigo/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-cyan/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div
        className={`w-full max-w-md p-6 sm:p-8 rounded-3xl transition-all duration-300 relative z-10 ${
          shake ? 'animate-bounce' : ''
        } ${
          isAmoled
            ? 'glass-panel-amoled text-white shadow-2xl border-white/10'
            : 'glass-panel-light text-slate-900 shadow-xl border-slate-200/90'
        }`}
      >
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-cyan/20 to-brand-indigo/30 border border-brand-cyan/30 text-brand-cyan mb-4 shadow-neon-cyan/20">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Single-Door Gateway
          </h2>

          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-semibold text-brand-cyan">
            <Building2 className="w-3.5 h-3.5" />
            <span>{activeBlock} Access Portal</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unified access for Administrators, Faculty & Students
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
              Identifier
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="login-identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="File Number / Teacher ID / Admin"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none ${
                  isAmoled
                    ? 'bg-neutral-900/90 border border-white/10 focus:border-brand-cyan text-white placeholder-neutral-500'
                    : 'bg-slate-50 border border-slate-300 focus:border-brand-indigo text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your security credentials"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm font-medium transition-all outline-none ${
                  isAmoled
                    ? 'bg-neutral-900/90 border border-white/10 focus:border-brand-cyan text-white placeholder-neutral-500'
                    : 'bg-slate-50 border border-slate-300 focus:border-brand-indigo text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet hover:opacity-95 shadow-lg shadow-brand-indigo/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Enter Kalam Block Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Phase 1 Quick Fill Demo Credentials */}
        <div className="mt-7 pt-5 border-t border-current/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Phase 1 Quick-Fill Mocks</span>
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {mockAccounts.map((acc) => (
              <button
                key={acc.identifier}
                type="button"
                onClick={() => fillMock(acc)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isAmoled
                    ? 'bg-neutral-900/60 border-white/10 hover:border-brand-cyan/60 hover:bg-neutral-800 text-slate-200'
                    : 'bg-slate-100/90 border-slate-200 hover:border-brand-indigo/60 hover:bg-slate-200/80 text-slate-800'
                }`}
              >
                <span className="capitalize text-brand-cyan text-[11px] font-bold">
                  {acc.role}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  ID: {acc.identifier}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 text-[11px] text-center text-slate-500">
            Admin: <code className="font-mono text-slate-400">Admin / Aryabhatta@2000</code> | Faculty/Student password: <code className="font-mono text-slate-400">123</code>
          </div>
        </div>

        {/* Creator Credit Footer */}
        <div className="mt-6 text-center text-xs text-slate-400/80">
          <span>By </span>
          <span className="font-bold text-slate-400 hover:text-brand-cyan transition-colors">
            Adeshjeet_Official
          </span>
        </div>
      </div>
    </div>
  );
};
