'use client';

import { fetchMe, logout as doLogout } from '@/lib/auth';
import { getToken } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
      // Garante que queries autenticadas (sites, contents, etc.) refaçam
      // depois do login. Crítico para o SiteSwitcher aparecer já no 1º load.
      await queryClient.invalidateQueries();
    } catch {
      setUser(null);
      doLogout();
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = React.useCallback(() => {
    doLogout();
    setUser(null);
    queryClient.clear();
    router.push('/login');
  }, [router, queryClient]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
