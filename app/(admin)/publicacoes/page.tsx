'use client';

import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Paginated, PublishJob, PublishJobStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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

export default function PublishJobsPage() {
  const { currentSiteId, currentSite } = useCurrentSite();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<PublishJobStatus | ''>('');
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({
    ...(currentSiteId ? { siteId: currentSiteId } : {}),
    ...(status ? { status } : {}),
    page: String(page),
    pageSize: '50',
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['publish-jobs', currentSiteId, status, page],
    queryFn: () => api<Paginated<PublishJob>>(`/publish-jobs?${qs}`),
    enabled: !!currentSiteId,
    refetchInterval: 10_000,
  });

  const retry = useMutation({
    mutationFn: (id: string) => api(`/publish-jobs/${id}/retry`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publish-jobs'] }),
    onError: (e: Error) => alert(e.message),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Histórico de publicações</h1>
        <p className="text-sm text-muted-foreground">
          {total} jobs em {currentSite?.name ?? '—'}. Atualiza a cada 10s.
        </p>
      </header>

      <Card className="p-4">
        <Select
          className="w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PublishJobStatus | '');
            setPage(1);
          }}
        >
          <option value="">Todos status</option>
          <option value="PENDING">PENDING</option>
          <option value="RUNNING">RUNNING</option>
          <option value="SUCCEEDED">SUCCEEDED</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Quando</TH>
              <TH>Conteúdo</TH>
              <TH>Status</TH>
              <TH>Tentativas</TH>
              <TH>Erro</TH>
              <TH className="text-right">Ações</TH>
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
            {!isLoading && items.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum job. Agende em <Link className="underline" href="/calendario">/calendario</Link>.
                </TD>
              </TR>
            )}
            {items.map((j) => (
              <TR key={j.id}>
                <TD className="text-xs text-muted-foreground">
                  <div>{formatDate(j.scheduledFor)}</div>
                  {j.finishedAt && j.finishedAt !== j.scheduledFor && (
                    <div className="opacity-60">→ {formatDate(j.finishedAt)}</div>
                  )}
                </TD>
                <TD className="max-w-md truncate">
                  <Link href={`/conteudos/${j.contentId}`} className="hover:underline">
                    {j.content?.title ?? j.contentId.slice(0, 8)}
                  </Link>
                </TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                </TD>
                <TD className="text-xs">{j.attempts}</TD>
                <TD className="text-xs text-red-600 max-w-xs truncate" title={j.lastError ?? ''}>
                  {j.lastError ?? '—'}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/conteudos/${j.contentId}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {j.status === 'FAILED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retry.mutate(j.id)}
                        disabled={retry.isPending}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
