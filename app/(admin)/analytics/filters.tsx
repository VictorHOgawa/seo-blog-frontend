'use client';

/**
 * Filtro de período compartilhado pelas telas de analytics.
 * O site vem do seletor global (`useCurrentSite`).
 */
import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

export type AnalyticsDays = 7 | 30 | 90;

interface FiltersCtx {
  days: AnalyticsDays;
  setDays: (d: AnalyticsDays) => void;
}

const Ctx = createContext<FiltersCtx | null>(null);

export function AnalyticsFiltersProvider({ children }: { children: React.ReactNode }) {
  const [days, setDays] = useState<AnalyticsDays>(30);
  return <Ctx.Provider value={{ days, setDays }}>{children}</Ctx.Provider>;
}

export function useAnalyticsFilters(): FiltersCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAnalyticsFilters deve estar dentro de AnalyticsFiltersProvider');
  return ctx;
}

const OPTIONS: AnalyticsDays[] = [7, 30, 90];

export function DaysSelector() {
  const { days, setDays } = useAnalyticsFilters();
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDays(d)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition-colors',
            days === d
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}
