import React, { createContext, useContext, useState, useEffect } from 'react';
import { sfx } from '../utils/soundEffects';

const AuthContext = createContext();

export const PHASE_1_MOCKS = {
  Admin: {
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
  T101: {
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
  '241342': {
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
};

export const AuthProvider = ({ children }) => {
  const [activeBlock] = useState('Abdul Kalam Block');
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
        return parsed.route || '/';
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

  /**
   * Unified single-door login method
   */
  const login = async (identifier, password) => {
    const trimmedId = identifier ? identifier.trim() : '';
    const mock = PHASE_1_MOCKS[trimmedId];

    if (mock && mock.password === password) {
      sfx.playSuccess();
      const sessionUser = {
        identifier: mock.identifier,
        role: mock.role,
        name: mock.name,
        roleTitle: mock.roleTitle,
        department: mock.department,
        block: activeBlock,
        office: mock.office,
        route: mock.route,
        avatar: mock.avatar,
      };
      setUser(sessionUser);
      setCurrentRoute(mock.route);
      return { success: true, user: sessionUser };
    }

    // Try backend authentication as complementary fallback
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sfx.playSuccess();
        const sessionUser = {
          ...data.user,
          block: activeBlock,
          roleTitle: data.user.role === 'admin' ? 'Administrator' : data.user.role === 'teacher' ? 'Faculty Member' : 'Student',
          office: 'Abdul Kalam Block',
        };
        setUser(sessionUser);
        setCurrentRoute(sessionUser.route || `/${sessionUser.role}`);
        return { success: true, user: sessionUser };
      }
    } catch {
      // Offline / fallback to error
    }

    sfx.playError();
    return {
      success: false,
      message: 'Invalid credentials. Please verify your ID and password.',
    };
  };

  const logout = () => {
    sfx.playClick();
    setUser(null);
    setCurrentRoute('/');
    localStorage.removeItem('aryabhatta_user');
  };

  const navigateTo = (route) => {
    sfx.playClick();
    setCurrentRoute(route);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBlock,
        currentRoute,
        navigateTo,
        login,
        logout,
        mockAccounts: Object.values(PHASE_1_MOCKS),
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
