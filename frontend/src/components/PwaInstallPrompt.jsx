import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { sfx } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

export const PwaInstallPrompt = () => {
  const { isAmoled, theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed in this session
    const isDismissed = sessionStorage.getItem('agi_pwa_dismissed') === 'true';
    if (isDismissed) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      sfx.playSuccess();
      haptics.success();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    sfx.playClick();
    haptics.tap(25);

    if (!deferredPrompt) {
      // Fallback instructions if prompt not triggerable
      alert('To install, tap your browser menu (⋮ or Share) and select "Add to Home Screen"');
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        sfx.playSuccess();
        haptics.success();
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    sfx.playClick();
    haptics.tap(15);
    setIsVisible(false);
    sessionStorage.setItem('agi_pwa_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 animate-slide-up ${
        /* On mobile: fixed bottom center with margin. On desktop: floating bottom right */
        'bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm'
      }`}
    >
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all relative overflow-hidden ${
          isAmoled
            ? 'bg-neutral-950/90 border-white/15 text-white shadow-neon-cyan/15'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Glow ambient circle */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-cyan/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start gap-3.5">
          {/* Logo / App Icon */}
          <div
            className={`w-12 h-12 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border ${
              isAmoled
                ? 'bg-neutral-900 border-white/10'
                : 'bg-indigo-50 border-indigo-100 text-brand-indigo'
            }`}
          >
            <img
              src={isAmoled || theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'}
              alt="AGI Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Text Information */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black tracking-tight truncate">
                Install Aryabhatta App
              </h4>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              Fast, standalone access to Kalam Block attendance, notices, and test grades.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-cyan to-blue-600 text-black hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>

              <button
                onClick={handleDismiss}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAmoled
                    ? 'border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Dismiss Icon */}
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/5 transition-colors absolute top-3 right-3"
            title="Dismiss prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
