'use client';

/**
 * Componentes compartilhados das telas de analytics.
 * Gráficos em CSS (barras) — mesmo padrão do dashboard/custos, sem lib externa.
 */
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Variação percentual entre dois períodos, com seta e cor. */
export function DeltaBadge({
  current,
  previous,
  /** quando true, cair é bom (ex.: custo) — inverte as cores */
  invert = false,
}: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  if (previous === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {current > 0 ? 'novo período' : 'sem histórico'}
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const good = flat ? false : invert ? !up : up;
  const Icon = flat ? ArrowRight : up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        flat
          ? 'text-muted-foreground'
          : good
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
      )}
      title={`período anterior: ${previous}`}
    >
      <Icon className="h-3 w-3" />
      {flat ? '~0%' : `${up ? '+' : ''}${pct.toFixed(1)}%`}
    </span>
  );
}

/** Card de KPI com valor grande e comparação obrigatória vs. período anterior. */
export function StatCard({
  label,
  value,
  current,
  previous,
  hint,
  invert,
}: {
  label: string;
  value: string | number;
  current: number;
  previous: number;
  hint?: string;
  invert?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        <DeltaBadge current={current} previous={previous} invert={invert} />
        {hint && <span className="text-xs text-muted-foreground">· {hint}</span>}
      </div>
    </Card>
  );
}

/** Linha de barra horizontal — usada em funil, atribuição e séries. */
export function BarRow({
  label,
  value,
  pct,
  caption,
  color = 'bg-primary',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  pct: number;
  caption?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-44 shrink-0 truncate">{label}</span>
      <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
        <div
          className={cn('h-full rounded', color)}
          style={{ width: `${Math.max(1, Math.min(100, pct))}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right font-mono text-xs">{value}</span>
      {caption && (
        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
          {caption}
        </span>
      )}
    </div>
  );
}

/** Trata loading / erro / vazio antes de renderizar o conteúdo. */
export function StateWrapper({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Sem dados no período.',
  onRetry,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          Erro ao carregar: {error instanceof Error ? error.message : 'desconhecido'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border px-3 py-1 text-sm hover:bg-muted"
          >
            Tentar de novo
          </button>
        )}
      </Card>
    );
  }
  if (isEmpty) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sem dados pode significar que a LP ainda não foi integrada — ver o
          playbook de tracking.
        </p>
      </Card>
    );
  }
  return <>{children}</>;
}
