import React, { createContext, useContext, useState, useEffect } from 'react';
import { RoutePath } from '../types';

interface RouterContextType {
  currentPath: RoutePath;
  navigate: (path: RoutePath) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() => {
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname + window.location.search) as RoutePath;
      const pathname = window.location.pathname;
      const validPrefixes = [
        '/',
        '/ai',
        '/marketplace',
        '/services',
        '/expert',
        '/academy',
        '/digital-products',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/signin',
        '/register',
        '/forgot-password',
        '/verify-email',
        '/reset-password',
        '/account',
        '/seller',
        '/checkout',
        '/management',
        '/affiliate',
        '/notifications',
        '/settings',
        '/search',
        '/r/',
      ];
      const isValid = validPrefixes.some((prefix) =>
        prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)
      );
      return isValid ? path : '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname + window.location.search) as RoutePath;
      setCurrentPath(path || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: RoutePath) => {
    if (path !== currentPath) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setCurrentPath(path);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
