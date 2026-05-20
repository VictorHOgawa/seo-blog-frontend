'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Card } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import type { AnalyticsAttribution } from '@/lib/analytics-types';
import { useAnalyticsFilters } from '../filters';
import { StateWrapper } from '../components';

export default function AttributionPage() {
  const { currentSiteId } = useCurrentSite();
  const { days } = useAnalyticsFilters();

  const q = useQuery({
    queryKey: ['analytics-attribution', currentSiteId, days],
    queryFn: () =>
      api<AnalyticsAttribution>(
        `/admin/analytics/attribution?siteId=${currentSiteId}&days=${days}`,
      ),
    enabled: !!currentSiteId,
  });

  const rows = q.data?.bySource ?? [];
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads));

  return (
    <StateWrapper
      isLoading={q.isLoading}
      error={q.error}
      isEmpty={rows.length === 0}
      emptyMessage={`Nenhuma origem identificada nos últimos ${days} dias.`}
      onRetry={() => q.refetch()}
    >
      <Card className="p-5">
        <h3 className="text-sm font-medium">Atribuição por origem (first-touch)</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          De onde vêm as sessões e os leads. Origem = `utm_source` da primeira visita.
        </p>
        <Table>
          <THead>
            <TR>
              <TH>Origem</TH>
              <TH>Sessões</TH>
              <TH>Leads</TH>
              <TH>Conversão</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.source}>
                <TD className="font-medium">{r.source}</TD>
                <TD className="font-mono text-xs">
                  {r.sessions.toLocaleString('pt-BR')}
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-24 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(r.leads / maxLeads) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{r.leads}</span>
                  </div>
                </TD>
                <TD className="font-mono text-xs">{r.conversionRate.toFixed(2)}%</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </StateWrapper>
  );
}
