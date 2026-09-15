import React, { createContext, useContext, useState, useEffect } from 'react';
import { sfx } from '../utils/soundEffects';

const AuthContext = createContext();

export const DEMO_ACCOUNTS = [
  {
    identifier: 'Admin',
    password: 'Aryabhatta@2000',
    role: 'admin',
    name: 'Dr. Suresh Chandra',
    roleTitle: 'Chief Director & Administrator',
    department: 'Central Academic Directorate',
    block: 'Abdul Kalam Block',
    office: 'Kalam Block - 4th Floor, Suite 401',
    route: '/admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    identifier: 'T101',
    password: '123',
    role: 'teacher',
    name: 'Prof. Rajesh Sharma',
    roleTitle: 'Senior Assistant Professor',
    department: 'Department of Computer Science & Engineering',
    block: 'Abdul Kalam Block',
    office: 'Kalam Block - 2nd Floor, Faculty Cabin 12',
    route: '/teacher',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    identifier: '241342',
    password: '123',
    role: 'student',
    name: 'Aman Kumar Verma',
    roleTitle: 'Undergraduate Scholar',
    department: 'B.Tech - Computer Science (Section A)',
    block: 'Abdul Kalam Block',
    office: 'Kalam Block - Smart Classroom AK-104',
    route: '/student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
];

export const AuthProvider = ({ children }) => {
  const [activeBlock] = useState('Abdul Kalam Block');
  const [token, setToken] = useState(() => {
    return localStorage.getItem('aryabhatta_token') || null;
  });
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aryabhatta_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [currentRoute, setCurrentRoute] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aryabhatta_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.route || `/${parsed.role}` || '/';
      }
    } catch {
      // fallback
    }
    return '/';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('aryabhatta_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aryabhatta_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('aryabhatta_token', token);
    } else {
      localStorage.removeItem('aryabhatta_token');
    }
  }, [token]);

  /**
   * Database-backed unified login method
   */
  const login = async (identifier, password) => {
    const trimmedId = identifier ? identifier.trim() : '';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': trimmedId,
          'x-actor-role': 'auth',
        },
        body: JSON.stringify({ identifier: trimmedId, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        const sessionUser = {
          ...data.user,
          identifier: data.user.fileNumber || data.user.identifier || trimmedId,
          fileNumber: data.user.fileNumber || trimmedId,
          block: data.user.block || activeBlock,
          roleTitle:
            data.user.role === 'admin'
              ? 'Administrator'
              : data.user.role === 'teacher'
              ? 'Faculty Member'
              : 'Student',
          office:
            data.user.role === 'admin'
              ? 'Kalam Block - 4th Floor, Suite 401'
              : data.user.role === 'teacher'
              ? 'Kalam Block - 2nd Floor, Faculty Cabin 12'
              : 'Kalam Block - Smart Classroom AK-104',
          route: data.user.route || `/${data.user.role}`,
          avatar:
            data.user.avatar ||
            (data.user.role === 'admin'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : data.user.role === 'teacher'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'),
        };

        setUser(sessionUser);
        setToken(data.token);
        setCurrentRoute(sessionUser.route);
        return { success: true, user: sessionUser, token: data.token };
      } else {
        sfx.playError();
        return {
          success: false,
          message: data.message || 'Invalid credentials. Please verify your ID and password.',
        };
      }
    } catch (err) {
      console.warn('⚠️ [Auth Network Warning]: Failed to reach MongoDB auth endpoint, checking local fallback...', err);

      // Graceful offline fallback if server unreachable
      const mock = DEMO_ACCOUNTS.find(
        (acc) => acc.identifier.toLowerCase() === trimmedId.toLowerCase()
      );

      if (mock && mock.password === password) {
        sfx.playSuccess();
        const sessionUser = {
          ...mock,
          block: activeBlock,
        };
        const offlineToken = `offline-token-${mock.role}-${Date.now()}`;
        setUser(sessionUser);
        setToken(offlineToken);
        setCurrentRoute(mock.route);
        return { success: true, user: sessionUser, token: offlineToken };
      }

      sfx.playError();
      return {
        success: false,
        message: 'Could not connect to authentication server. Please ensure backend is running.',
      };
    }
  };

  const logout = () => {
    sfx.playClick();
    setUser(null);
    setToken(null);
    setCurrentRoute('/');
    localStorage.removeItem('aryabhatta_user');
    localStorage.removeItem('aryabhatta_token');
  };

  const navigateTo = (route) => {
    sfx.playClick();
    setCurrentRoute(route);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBlock,
        currentRoute,
        navigateTo,
        login,
        logout,
        mockAccounts: DEMO_ACCOUNTS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
