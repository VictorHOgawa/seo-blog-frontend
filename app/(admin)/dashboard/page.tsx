'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCostCents } from '@/lib/format';
import type { OverviewMetrics, PublishStats } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Lightbulb,
  Send,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentSiteId, currentSite } = useCurrentSite();

  const { data: overview } = useQuery({
    queryKey: ['overview', currentSiteId],
    queryFn: () =>
      api<OverviewMetrics>(`/metrics/overview${currentSiteId ? `?siteId=${currentSiteId}` : ''}`),
    refetchInterval: 30_000,
    enabled: !!currentSiteId,
  });

  const { data: publishStats } = useQuery({
    queryKey: ['publish-stats', currentSiteId],
    queryFn: () =>
      api<PublishStats>(
        `/metrics/publish-stats?days=30${currentSiteId ? `&siteId=${currentSiteId}` : ''}`,
      ),
    refetchInterval: 60_000,
    enabled: !!currentSiteId,
  });

  const maxDay = Math.max(1, ...((publishStats?.byDay ?? []).map((d) => d.total)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Olá, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral de <strong>{currentSite?.name ?? '—'}</strong>. Atualiza a cada 30s.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashCard
          icon={Lightbulb}
          label="Ideias pendentes"
          value={overview?.ideas.pending ?? '—'}
          href="/ideias"
          hint={`de ${overview?.ideas.total ?? 0} total`}
        />
        <DashCard
          icon={FileText}
          label="Aguardando revisão"
          value={overview?.contents.expanded ?? '—'}
          href="/revisao"
          hint="status EXPANDED"
          accent={overview && overview.contents.expanded > 0 ? 'warning' : undefined}
        />
        <DashCard
          icon={Calendar}
          label="Agendados próx. 7 dias"
          value={overview?.schedule.nextWeek ?? '—'}
          href="/calendario"
          hint={`${overview?.schedule.today ?? 0} hoje`}
        />
        <DashCard
          icon={CheckCircle2}
          label="Publicados (30d)"
          value={overview?.publish.publishedLast30Days ?? '—'}
          href="/conteudos"
          hint={`${overview?.publish.publishedLast7Days ?? 0} nos últimos 7 dias`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Custo IA hoje
            </CardDescription>
            <CardTitle className="text-2xl">
              {overview ? formatCostCents(overview.aiCost.today.costCents) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>{overview?.aiCost.today.calls ?? 0} chamadas hoje</div>
            <div>
              7d: {overview ? formatCostCents(overview.aiCost.last7Days.costCents) : '—'} · 30d:{' '}
              {overview ? formatCostCents(overview.aiCost.last30Days.costCents) : '—'}
            </div>
            <Link
              href="/custos"
              className="text-[#0d78ec] hover:underline inline-flex items-center gap-1 pt-1"
            >
              Ver detalhes →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Publicações (30d)
            </CardDescription>
            <CardTitle className="text-2xl">
              {overview?.publish.successRate !== null && overview?.publish.successRate !== undefined
                ? `${overview.publish.successRate}%`
                : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              {overview?.publish.succeededLast30 ?? 0} OK · {overview?.publish.failedLast30 ?? 0}{' '}
              falhas · {overview?.publish.jobsLast30 ?? 0} jobs
            </div>
            {publishStats && (
              <div>
                tempo médio: {(publishStats.avgDurationMs / 1000).toFixed(1)}s · máx{' '}
                {(publishStats.maxDurationMs / 1000).toFixed(1)}s
              </div>
            )}
            <Link
              href="/publicacoes"
              className="text-[#0d78ec] hover:underline inline-flex items-center gap-1 pt-1"
            >
              Ver histórico →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pipeline
            </CardDescription>
            <CardTitle className="text-2xl">{overview?.contents.total ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <PipelineRow label="DRAFT" value={overview?.contents.draft ?? 0} />
            <PipelineRow
              label="EXPANDED"
              value={overview?.contents.expanded ?? 0}
              accent="warning"
            />
            <PipelineRow
              label="APPROVED"
              value={overview?.contents.approved ?? 0}
              accent="success"
            />
            <PipelineRow
              label="PUBLISHED"
              value={overview?.contents.published ?? 0}
              accent="success"
            />
          </CardContent>
        </Card>
      </div>

      {publishStats && publishStats.byDay.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Publicações por dia — últimos {publishStats.days} dias
          </h3>
          <div className="space-y-1">
            {publishStats.byDay.map((d) => (
              <div key={d.day} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-muted-foreground">
                  {new Date(d.day).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(d.succeeded / maxDay) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(d.failed / maxDay) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono">
                  {d.succeeded} OK · {d.failed} falhas
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">
          Próxima fase: hardening + docs finais (Fase 12).
        </span>
      </div>
    </div>
  );
}

function DashCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  accent?: 'warning' | 'success';
}) {
  const body = (
    <Card className="p-4 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-3xl font-bold mt-2 flex items-center gap-2">
        {value}
        {accent === 'warning' && Number(value) > 0 && (
          <Badge variant="warning" className="text-[10px]">
            ação
          </Badge>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">
      {body}
    </Link>
  ) : (
    body
  );
}

function PipelineRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'warning' | 'success';
}) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="font-mono text-[10px]">{label}</span>
      <span
        className={
          accent === 'success'
            ? 'text-emerald-700 font-semibold'
            : accent === 'warning'
              ? 'text-amber-700 font-semibold'
              : 'font-medium'
        }
      >
        {value}
      </span>
    </div>
  );
}
