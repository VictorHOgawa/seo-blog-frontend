'use client';

import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api, getToken } from '@/lib/api';
import { env } from '@/lib/env';
import { formatCostCents, formatDate, formatTokens } from '@/lib/format';
import type { AiUsageMetrics } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';

export default function CostsPage() {
  const { currentSiteId } = useCurrentSite();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['ai-cost', currentSiteId, days],
    queryFn: () =>
      api<AiUsageMetrics>(
        `/metrics/ai-cost?days=${days}${currentSiteId ? `&siteId=${currentSiteId}` : ''}`,
      ),
    refetchInterval: 15_000,
  });

  const maxDay = Math.max(1, ...((data?.byDay ?? []).map((d) => d.costCents)));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Custos de IA</h1>
          <p className="text-sm text-muted-foreground">
            Dados desde {data ? new Date(data.since).toLocaleDateString('pt-BR') : '—'}. Atualiza
            sozinho a cada 15s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <Button
            variant="outline"
            size="md"
            onClick={async () => {
              const token = getToken();
              const url = `${env.NEXT_PUBLIC_API_URL}/metrics/ai-cost/export.csv?days=${days}${currentSiteId ? `&siteId=${currentSiteId}` : ''}`;
              const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `ai-cost-${days}d.csv`;
              link.click();
              URL.revokeObjectURL(link.href);
            }}
          >
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total gasto</div>
          <div className="text-2xl font-semibold">
            {data ? formatCostCents(data.total.costCents) : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Chamadas</div>
          <div className="text-2xl font-semibold">{data?.total.calls ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Tokens input</div>
          <div className="text-2xl font-semibold">
            {data ? formatTokens(data.total.inputTokens) : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Tokens output</div>
          <div className="text-2xl font-semibold">
            {data ? formatTokens(data.total.outputTokens) : '—'}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Por dia</h3>
        {(data?.byDay ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <div className="space-y-1">
            {(data?.byDay ?? []).map((d) => (
              <div key={d.day} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-muted-foreground">
                  {new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(d.costCents / maxDay) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono">{formatCostCents(d.costCents)}</span>
                <span className="w-12 text-right text-muted-foreground">{d.count}×</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium">Por modelo</h3>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Modelo</TH>
              <TH className="text-right">Chamadas</TH>
              <TH className="text-right">Input</TH>
              <TH className="text-right">Output</TH>
              <TH className="text-right">Custo</TH>
            </TR>
          </THead>
          <TBody>
            {(data?.byModel ?? []).length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center text-muted-foreground">
                  —
                </TD>
              </TR>
            )}
            {(data?.byModel ?? []).map((m) => (
              <TR key={m.model}>
                <TD className="font-mono text-xs">{m.model}</TD>
                <TD className="text-right">{m.calls}</TD>
                <TD className="text-right">{formatTokens(m.inputTokens)}</TD>
                <TD className="text-right">{formatTokens(m.outputTokens)}</TD>
                <TD className="text-right font-medium">{formatCostCents(m.costCents)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium">Últimas 20 chamadas</h3>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Data</TH>
              <TH>Modelo</TH>
              <TH className="text-right">Tokens</TH>
              <TH className="text-right">Tempo</TH>
              <TH className="text-right">Custo</TH>
              <TH>Cache</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={6} className="text-center text-muted-foreground">
                  Carregando…
                </TD>
              </TR>
            )}
            {(data?.recent ?? []).map((r) => (
              <TR key={r.id}>
                <TD className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</TD>
                <TD className="font-mono text-xs">{r.model}</TD>
                <TD className="text-right text-xs">
                  {formatTokens(r.inputTokens)} → {formatTokens(r.outputTokens)}
                </TD>
                <TD className="text-right text-xs">{(r.durationMs / 1000).toFixed(2)}s</TD>
                <TD className="text-right font-medium">{formatCostCents(r.costCents)}</TD>
                <TD>
                  {r.cached ? (
                    <Badge variant="success">HIT</Badge>
                  ) : (
                    <Badge variant="secondary">live</Badge>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
