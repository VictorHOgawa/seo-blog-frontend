'use client';

import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Content, Paginated } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Mode = 'DAILY' | 'WEEKLY' | 'EVERY_N_DAYS';

export function BulkScheduleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentSiteId } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: pool } = useQuery({
    queryKey: ['contents', currentSiteId, 'APPROVED'],
    queryFn: () =>
      api<Paginated<Content>>(`/contents?siteId=${currentSiteId}&status=APPROVED&pageSize=200`),
    enabled: !!currentSiteId && open,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [mode, setMode] = useState<Mode>('DAILY');
  const [everyN, setEveryN] = useState(2);
  const [skipWeekends, setSkipWeekends] = useState(true);

  const items = pool?.items ?? [];

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  const save = useMutation({
    mutationFn: () =>
      api<{ count: number }>('/schedule/bulk', {
        method: 'POST',
        json: {
          contentIds: Array.from(selected),
          startDate,
          time,
          mode,
          everyN: mode === 'EVERY_N_DAYS' ? everyN : undefined,
          skipWeekends,
        },
      }),
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      alert(`${count} agendados!`);
      onOpenChange(false);
    },
    onError: (e: Error) => alert(e.message),
  });

  // pré-visualização de datas
  const previewDates = previewSchedule({
    n: selected.size,
    startDate,
    time,
    mode,
    everyN,
    skipWeekends,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agendar em lote</DialogTitle>
          <DialogDescription>
            Selecione conteúdos <strong>APPROVED</strong>, defina regra de cadência e
            pré-visualize as datas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Data inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Horário (HH:MM)</Label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} pattern="\d{2}:\d{2}" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cadência</Label>
              <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="DAILY">1 por dia</option>
                <option value="WEEKLY">1 por semana</option>
                <option value="EVERY_N_DAYS">A cada N dias…</option>
              </Select>
            </div>
            {mode === 'EVERY_N_DAYS' && (
              <div className="space-y-1">
                <Label>N (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  value={everyN}
                  onChange={(e) => setEveryN(Number(e.target.value))}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipWeekends}
                onChange={(e) => setSkipWeekends(e.target.checked)}
              />
              Pular fins de semana
            </label>

            <Card className="p-3 text-xs space-y-1 max-h-48 overflow-auto">
              <div className="font-medium">Pré-visualização ({previewDates.length}):</div>
              {previewDates.map((d, i) => (
                <div key={i} className="text-muted-foreground">
                  {d.toLocaleString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              ))}
              {previewDates.length === 0 && (
                <div className="text-muted-foreground">Selecione conteúdos.</div>
              )}
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conteúdos aprovados ({items.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === items.length ? 'Limpar' : 'Selecionar todos'}
              </Button>
            </div>
            <Card className="max-h-72 overflow-auto p-2 space-y-1">
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">
                  Nenhum conteúdo aprovado. Aprove em <code>/revisao</code>.
                </p>
              )}
              {items.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm p-1.5 hover:bg-muted rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => {
                      const next = new Set(selected);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      setSelected(next);
                    }}
                  />
                  <span className="truncate flex-1">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.contentType?.name}</span>
                </label>
              ))}
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => save.mutate()}
            disabled={selected.size === 0 || save.isPending}
          >
            {save.isPending ? 'Agendando…' : `Agendar ${selected.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function previewSchedule(o: {
  n: number;
  startDate: string;
  time: string;
  mode: Mode;
  everyN: number;
  skipWeekends: boolean;
}): Date[] {
  if (o.n === 0) return [];
  const [hh, mm] = o.time.split(':').map(Number);
  const out: Date[] = [];
  let cur = new Date(o.startDate);
  cur.setHours(hh || 0, mm || 0, 0, 0);
  while (out.length < o.n) {
    if (o.skipWeekends) {
      while (cur.getDay() === 0 || cur.getDay() === 6) {
        cur = new Date(cur.getTime() + 24 * 3600 * 1000);
      }
    }
    out.push(new Date(cur));
    const step = o.mode === 'DAILY' ? 1 : o.mode === 'WEEKLY' ? 7 : Math.max(1, o.everyN);
    cur = new Date(cur.getTime() + step * 24 * 3600 * 1000);
  }
  return out;
}
