import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { AuthGateway } from './components/AuthGateway';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';

const MainLayout = () => {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

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

      {/* Main Body Content */}
      <main className="flex-1">
        {!user ? (
          <AuthGateway />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="py-6 border-t border-current/10 text-center text-xs text-slate-500 dark:text-slate-500">
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
