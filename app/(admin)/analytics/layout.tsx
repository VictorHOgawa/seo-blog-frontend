'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsFiltersProvider, DaysSelector } from './filters';

const TABS = [
  { href: '/analytics', label: 'Visão geral' },
  { href: '/analytics/funil', label: 'Funil' },
  { href: '/analytics/atribuicao', label: 'Atribuição' },
  { href: '/analytics/leads', label: 'Leads' },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnalyticsFiltersProvider>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <BarChart3 className="h-6 w-6" /> Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Tracking de comportamento das LPs. Agregado pelo hub de tracking.
            </p>
          </div>
          <DaysSelector />
        </header>

        <nav className="flex gap-1 border-b">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </AnalyticsFiltersProvider>
  );
}
