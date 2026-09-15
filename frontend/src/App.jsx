import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { AuthGateway } from './components/AuthGateway';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { haptics } from './utils/haptics';
import { sfx } from './utils/soundEffects';

// Code-splitting main dashboard modules via React.lazy
const AdminDashboard = lazy(() =>
  import('./components/dashboards/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  }))
);
const TeacherDashboard = lazy(() =>
  import('./components/dashboards/TeacherDashboard').then((m) => ({
    default: m.TeacherDashboard,
  }))
);
const StudentDashboard = lazy(() =>
  import('./components/dashboards/StudentDashboard').then((m) => ({
    default: m.StudentDashboard,
  }))
);

// Branded loading fallback for code-split dashboards
const DashboardLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl border-2 border-brand-cyan/20 border-t-brand-cyan animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-cyan">
        AGI
      </div>
    </div>
    <p className="text-xs text-slate-400 font-medium tracking-wide">
      Synchronizing Abdul Kalam Block Module...
    </p>
  </div>
);

const MainLayout = () => {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Security lockdown: Prevent right-click context menu and DevTools keyboard shortcuts
  useEffect(() => {
    // 1. Block right-click context menus
    const handleContextMenu = (e) => {
      e.preventDefault();
      haptics.tap(15);
    };

    // 2. Block DevTools keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
    const handleKeyDown = (e) => {
      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isCtrlShiftI =
        (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i');
      const isCtrlShiftJ =
        (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j');
      const isCtrlShiftC =
        (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c');
      const isCtrlU = (e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U');

      if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC || isCtrlU) {
        e.preventDefault();
        haptics.error();
        sfx.playError();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Clean up event listeners on unmount to prevent memory leaks
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-indigo/30">
      {/* Animated Splash Screen */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
          }}
        />
      )}

      {/* Main Responsive Glass Navbar */}
      <Navbar onReplaySplash={() => setShowSplash(true)} />

      {/* Main Body Content with Suspense Code-Splitting */}
      <main className="flex-1">
        {!user ? (
          <AuthGateway />
        ) : (
          <Suspense fallback={<DashboardLoader />}>
            {user.role === 'admin' ? (
              <AdminDashboard />
            ) : user.role === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard />
            )}
          </Suspense>
        )}
      </main>

      {/* Progressive Web App Custom Install Prompt */}
      <PwaInstallPrompt />

      {/* Institutional Footer (z-index calibrated to z-10 so it never bleeds through modals) */}
      <footer className="relative z-10 py-6 border-t border-current/10 text-center text-xs text-slate-500 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Aryabhatta Group of Institutes · Abdul Kalam Block</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span>Architected & Engineered</span>
            <span className="text-slate-600 dark:text-slate-300 font-bold hover:text-brand-cyan transition-colors">
              By Adeshjeet_Official
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
