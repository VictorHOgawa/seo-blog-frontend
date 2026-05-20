'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { AnalyticsFunnel } from '@/lib/analytics-types';
import { useAnalyticsFilters } from '../filters';
import { BarRow, StateWrapper } from '../components';

export default function FunnelPage() {
  const { currentSiteId } = useCurrentSite();
  const { days } = useAnalyticsFilters();

  const q = useQuery({
    queryKey: ['analytics-funnel', currentSiteId, days],
    queryFn: () =>
      api<AnalyticsFunnel>(`/admin/analytics/funnel?siteId=${currentSiteId}&days=${days}`),
    enabled: !!currentSiteId,
  });

  const steps = q.data?.steps ?? [];
  // maior vazamento = etapa (depois da 1ª) com menor % de passagem
  let worstIdx = -1;
  for (let i = 1; i < steps.length; i++) {
    if (worstIdx === -1 || steps[i].pctOfPrev < steps[worstIdx].pctOfPrev) worstIdx = i;
  }
  const overall =
    steps.length > 1 && steps[0].sessions > 0
      ? (steps[steps.length - 1].sessions / steps[0].sessions) * 100
      : 0;

  return (
    <StateWrapper
      isLoading={q.isLoading}
      error={q.error}
      isEmpty={steps.length > 0 && steps[0].sessions === 0}
      onRetry={() => q.refetch()}
    >
      <Card className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-medium">Funil de conversão</h3>
          <p className="text-xs text-muted-foreground">
            Sessões distintas que atingiram cada etapa nos últimos {days} dias.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={s.step}>
              <BarRow
                label={`${i + 1}. ${s.label}`}
                value={s.sessions.toLocaleString('pt-BR')}
                pct={s.pctOfTop}
                caption={i === 0 ? '100%' : `${s.pctOfPrev}% de passagem`}
                color={i === worstIdx ? 'bg-red-500' : 'bg-primary'}
              />
              {i === worstIdx && (
                <p className="mt-1 pl-44 text-xs text-red-600 dark:text-red-400">
                  maior ponto de vazamento — {(100 - s.pctOfPrev).toFixed(1)}% desiste aqui
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {steps.length > 1 && (
        <Card className="mt-4 p-5">
          <div className="text-xs text-muted-foreground">Conversão ponta a ponta</div>
          <div className="mt-1 text-3xl font-bold">{overall.toFixed(2)}%</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {steps[steps.length - 1].sessions.toLocaleString('pt-BR')} de{' '}
            {steps[0].sessions.toLocaleString('pt-BR')} sessões viraram lead.
          </p>
        </Card>
      )}
    </StateWrapper>
  );
}
