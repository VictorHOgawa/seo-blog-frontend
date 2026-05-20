'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import type { AnalyticsLeads } from '@/lib/analytics-types';
import { useAnalyticsFilters } from '../filters';
import { StateWrapper } from '../components';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'danger' | 'warning'> = {
  NEW: 'secondary',
  CONTACTED: 'default',
  QUALIFIED: 'warning',
  CONVERTED: 'success',
  LOST: 'danger',
};

export default function LeadsPage() {
  const { currentSiteId } = useCurrentSite();
  const { days } = useAnalyticsFilters();
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['analytics-leads', currentSiteId, days, page],
    queryFn: () =>
      api<AnalyticsLeads>(
        `/admin/analytics/leads?siteId=${currentSiteId}&days=${days}&page=${page}&pageSize=20`,
      ),
    enabled: !!currentSiteId,
    placeholderData: keepPreviousData,
  });

  const data = q.data;

  return (
    <StateWrapper
      isLoading={q.isLoading}
      error={q.error}
      isEmpty={!!data && data.total === 0}
      emptyMessage={`Nenhum lead capturado nos últimos ${days} dias.`}
      onRetry={() => q.refetch()}
    >
      {data && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Leads capturados</h3>
              <p className="text-xs text-muted-foreground">
                {data.total.toLocaleString('pt-BR')} leads nos últimos {days} dias.
              </p>
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Nome</TH>
                <TH>Contato</TH>
                <TH>Origem</TH>
                <TH>Status</TH>
                <TH>Quando</TH>
              </TR>
            </THead>
            <TBody>
              {data.items.map((lead) => (
                <TR key={lead.id}>
                  <TD className="font-medium">{lead.name ?? '—'}</TD>
                  <TD className="text-xs">
                    <div>{lead.email ?? '—'}</div>
                    <div className="text-muted-foreground">{lead.phone ?? ''}</div>
                  </TD>
                  <TD className="text-xs">
                    {lead.utmSource ?? lead.source ?? '(direto)'}
                    {lead.utmCampaign && (
                      <div className="text-muted-foreground">{lead.utmCampaign}</div>
                    )}
                  </TD>
                  <TD>
                    <Badge variant={STATUS_VARIANT[lead.status] ?? 'secondary'}>
                      {lead.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString('pt-BR')}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">
                Página {data.page} de {data.pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-40 enabled:hover:bg-muted"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-40 enabled:hover:bg-muted"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </StateWrapper>
  );
}
