'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Content, Paginated } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const { currentSiteId, currentSite } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contents', currentSiteId, 'EXPANDED'],
    queryFn: () =>
      api<Paginated<Content>>(`/contents?siteId=${currentSiteId}&status=EXPANDED&pageSize=50`),
    enabled: !!currentSiteId,
    refetchInterval: 10_000,
  });

  const items = data?.items ?? [];
  const [busy, setBusy] = useState<string | null>(null);

  const transition = useMutation({
    mutationFn: async ({ id, to }: { id: string; to: 'APPROVED' | 'DRAFT' }) => {
      setBusy(id);
      return api(`/contents/${id}/transition`, { method: 'POST', json: { to } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setBusy(null);
    },
    onError: (e: Error) => {
      alert(e.message);
      setBusy(null);
    },
  });

  const isReviewer = user?.role === 'ADMIN' || user?.role === 'REVISOR';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Fila de revisão</h1>
        <p className="text-sm text-muted-foreground">
          Conteúdos expandidos em {currentSite?.name ?? '—'} aguardando revisão.{' '}
          {!isReviewer && (
            <span className="text-amber-600">
              · Você não tem permissão para aprovar (precisa de role REVISOR ou ADMIN).
            </span>
          )}
        </p>
      </header>

      {isLoading && (
        <Card className="p-6 text-center text-muted-foreground">Carregando…</Card>
      )}
      {!isLoading && items.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          Fila vazia. 🎉 Expanda mais ideias em <Link className="underline" href="/ideias">/ideias</Link>.
        </Card>
      )}

      <div className="space-y-3">
        {items.map((c) => (
          <Card key={c.id} className="p-4 flex gap-4">
            {c.ogImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.ogImage.url}
                alt=""
                className="w-32 h-20 object-cover rounded shrink-0"
              />
            ) : (
              <div className="w-32 h-20 bg-muted rounded shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{c.title || '(sem título)'}</h3>
                <Badge variant="warning">EXPANDED</Badge>
                <Badge variant="secondary">v{c.version}</Badge>
                <span className="text-xs text-muted-foreground">
                  {c.contentType?.name} · {c.locale}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {c.metaDescription || c.excerpt}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                Atualizado {formatDate(c.updatedAt)} ·{' '}
                {c.bodyMd.split(/\s+/).filter(Boolean).length} palavras
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href={`/conteudos/${c.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir
                </Button>
              </Link>
              {isReviewer && (
                <>
                  <Button
                    size="sm"
                    onClick={() => transition.mutate({ id: c.id, to: 'APPROVED' })}
                    disabled={busy === c.id}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Rejeitar e voltar para rascunho?'))
                        transition.mutate({ id: c.id, to: 'DRAFT' });
                    }}
                    disabled={busy === c.id}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Rejeitar
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Link href="/conteudos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para Conteúdos
      </Link>
    </div>
  );
}
