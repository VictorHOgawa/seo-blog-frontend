'use client';

import { api } from '@/lib/api';
import type { Site } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

interface CurrentSiteState {
  sites: Site[];
  currentSiteId: string | null;
  currentSite: Site | null;
  setCurrentSiteId: (id: string) => void;
  loading: boolean;
}

const Context = React.createContext<CurrentSiteState | null>(null);
const STORAGE_KEY = 'seoblog.current_site_id';

export function CurrentSiteProvider({ children }: { children: React.ReactNode }) {
  const [currentSiteId, setCurrentSiteIdState] = React.useState<string | null>(null);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => api<Site[]>('/sites'),
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCurrentSiteIdState(stored);
    } else if (sites.length > 0) {
      setCurrentSiteIdState(sites[0].id);
    }
  }, [sites]);

  const setCurrentSiteId = React.useCallback((id: string) => {
    setCurrentSiteIdState(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const currentSite = sites.find((s) => s.id === currentSiteId) ?? null;

  return (
    <Context.Provider
      value={{ sites, currentSiteId, currentSite, setCurrentSiteId, loading: isLoading }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCurrentSite() {
  const ctx = React.useContext(Context);
  if (!ctx) throw new Error('useCurrentSite must be inside CurrentSiteProvider');
  return ctx;
}
