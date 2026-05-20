'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { AnalyticsOverview, AnalyticsTimeseries } from '@/lib/analytics-types';
import { useAnalyticsFilters } from './filters';
import { StateWrapper, StatCard } from './components';

export default function AnalyticsOverviewPage() {
  const { currentSiteId, currentSite } = useCurrentSite();
  const { days } = useAnalyticsFilters();

  const overview = useQuery({
    queryKey: ['analytics-overview', currentSiteId, days],
    queryFn: () =>
      api<AnalyticsOverview>(
        `/admin/analytics/overview?siteId=${currentSiteId}&days=${days}`,
      ),
    enabled: !!currentSiteId,
  });

  const timeseries = useQuery({
    queryKey: ['analytics-timeseries', currentSiteId, days],
    queryFn: () =>
      api<AnalyticsTimeseries>(
        `/admin/analytics/timeseries?siteId=${currentSiteId}&days=${days}`,
      ),
    enabled: !!currentSiteId,
  });

  const cur = overview.data?.current;
  const prev = overview.data?.previous;

  return (
    <StateWrapper
      isLoading={overview.isLoading || timeseries.isLoading}
      error={overview.error || timeseries.error}
      isEmpty={!!cur && cur.sessions === 0}
      emptyMessage={`Sem sessões para ${currentSite?.name ?? 'este site'} nos últimos ${days} dias.`}
      onRetry={() => {
        overview.refetch();
        timeseries.refetch();
      }}
    >
      {cur && prev && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Sessões"
            value={cur.sessions.toLocaleString('pt-BR')}
            current={cur.sessions}
            previous={prev.sessions}
          />
          <StatCard
            label="Page views"
            value={cur.pageViews.toLocaleString('pt-BR')}
            current={cur.pageViews}
            previous={prev.pageViews}
          />
          <StatCard
            label="Leads"
            value={cur.leads.toLocaleString('pt-BR')}
            current={cur.leads}
            previous={prev.leads}
          />
          <StatCard
            label="Taxa de conversão"
            value={`${cur.conversionRate.toFixed(2)}%`}
            current={cur.conversionRate}
            previous={prev.conversionRate}
            hint="leads / sessões"
          />
        </div>
      )}

      {timeseries.data && timeseries.data.series.length > 0 && (
        <TimeseriesChart data={timeseries.data} />
      )}
    </StateWrapper>
  );
}

function TimeseriesChart({ data }: { data: AnalyticsTimeseries }) {
  const max = Math.max(1, ...data.series.map((d) => d.sessions));
  return (
    <Card className="mt-4 p-4">
      <h3 className="mb-1 text-sm font-medium">Sessões por dia</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Barra mais escura = leads daquele dia.
      </p>
      <div className="flex h-40 items-end gap-0.5">
        {data.series.map((d) => {
          const h = (d.sessions / max) * 100;
          const leadH = d.sessions > 0 ? (d.leads / d.sessions) * h : 0;
          return (
            <div
              key={d.day}
              className="relative h-full flex-1"
              title={`${d.day}: ${d.sessions} sessões · ${d.pageViews} page views · ${d.leads} leads`}
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-primary/40"
                style={{ height: `${h}%` }}
              />
              <div
                className="absolute bottom-0 w-full rounded-t bg-primary"
                style={{ height: `${leadH}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data.series[0]?.day}</span>
        <span>{data.series[data.series.length - 1]?.day}</span>
      </div>
    </Card>
  );
}
