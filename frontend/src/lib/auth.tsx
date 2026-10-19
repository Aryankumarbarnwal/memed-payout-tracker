
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { Role, User } from './types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function homeFor(role: Role) {
  return role === 'brand' ? '/brand' : '/creator';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      const token = localStorage.getItem('token');

      if (!token) {
        // No token means authentication initialization is complete.
        // Keep loading true until this async task settles.
        await Promise.resolve();

        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api<{ user: User }>('/api/auth/me');

        if (!cancelled) {
          setUser(response.user);
        }
      } catch {
        localStorage.removeItem('token');

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (token: string, u: User) => {
    localStorage.setItem('token', token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}

export function useRequireRole(role: Role) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role !== role) {
      router.replace(homeFor(user.role));
    }
  }, [user, loading, role, router]);

  return {
    user: user && user.role === role ? user : null,
    loading,
    logout,
  };
}
