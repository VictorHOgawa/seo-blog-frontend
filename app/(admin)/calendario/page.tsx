'use client';

import { BulkScheduleDialog } from '@/components/feature/schedule/bulk-schedule-dialog';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PublishJob, PublishJobStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const STATUS_VARIANT: Record<
  PublishJobStatus,
  'warning' | 'success' | 'danger' | 'secondary'
> = {
  PENDING: 'warning',
  RUNNING: 'warning',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  CANCELLED: 'secondary',
};

export default function CalendarPage() {
  const { currentSiteId, currentSite } = useCurrentSite();
  const queryClient = useQueryClient();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [bulkOpen, setBulkOpen] = useState(false);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['schedule', currentSiteId, cursor.toISOString().slice(0, 7)],
    queryFn: () =>
      api<PublishJob[]>(
        `/schedule?siteId=${currentSiteId}&from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`,
      ),
    enabled: !!currentSiteId,
    refetchInterval: 15_000,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api(`/schedule/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });

  const reschedule = useMutation({
    mutationFn: ({ id, scheduledFor }: { id: string; scheduledFor: string }) =>
      api(`/schedule/${id}`, { method: 'PATCH', json: { scheduledFor } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] }),
  });

  // grid: começa no domingo da semana do dia 1, termina no sábado da semana do último dia
  const gridDays = useMemo(() => {
    const first = new Date(monthStart);
    first.setDate(first.getDate() - first.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(first.getTime() + i * 24 * 3600 * 1000));
    }
    return days;
  }, [monthStart]);

  const jobsByDay = useMemo(() => {
    const m = new Map<string, PublishJob[]>();
    for (const j of jobs) {
      const key = new Date(j.scheduledFor).toISOString().slice(0, 10);
      const arr = m.get(key) ?? [];
      arr.push(j);
      m.set(key, arr);
    }
    return m;
  }, [jobs]);

  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            Publicações agendadas em {currentSite?.name ?? '—'} · {jobs.length} jobs neste mês
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[160px] text-center">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setBulkOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" /> Agendar em lote
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="p-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {gridDays.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayJobs = jobsByDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === cursor.getMonth();
            const isToday = key === today;
            return (
              <div
                key={key}
                className={cn(
                  'min-h-24 p-1.5 border-r border-b text-xs space-y-1 overflow-hidden',
                  !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                  isToday && 'ring-2 ring-inset ring-primary/40',
                )}
              >
                <div
                  className={cn(
                    'font-medium',
                    isToday && 'text-primary',
                  )}
                >
                  {day.getDate()}
                </div>
                {dayJobs.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="bg-card border rounded px-1 py-0.5 text-[10px] flex items-center gap-1"
                    title={j.content?.title}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        j.status === 'PENDING' && 'bg-amber-500',
                        j.status === 'SUCCEEDED' && 'bg-green-500',
                        j.status === 'FAILED' && 'bg-red-500',
                        j.status === 'CANCELLED' && 'bg-zinc-400',
                        j.status === 'RUNNING' && 'bg-blue-500',
                      )}
                    />
                    <span className="truncate">{j.content?.title ?? '—'}</span>
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayJobs.length - 3} mais
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium">Lista do mês</h3>
        </div>
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Carregando…</div>}
        {!isLoading && jobs.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">Nenhum job agendado neste mês.</div>
        )}
        {jobs.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="p-2 w-40">Quando</th>
                <th className="p-2">Título</th>
                <th className="p-2 w-32">Status</th>
                <th className="p-2 w-32 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="p-2 text-xs">
                    {new Date(j.scheduledFor).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-2 truncate max-w-md">
                    <Link className="hover:underline" href={`/conteudos/${j.contentId}`}>
                      {j.content?.title ?? j.contentId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-2">
                    <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const v = prompt(
                            'Nova data/hora ISO (ex.: 2026-05-25T10:00):',
                            j.scheduledFor.slice(0, 16),
                          );
                          if (v) reschedule.mutate({ id: j.id, scheduledFor: v });
                        }}
                        disabled={j.status === 'SUCCEEDED'}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Cancelar este job?')) cancel.mutate(j.id);
                        }}
                        disabled={
                          j.status === 'SUCCEEDED' || j.status === 'CANCELLED'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <BulkScheduleDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
