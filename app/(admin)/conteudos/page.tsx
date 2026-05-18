'use client';

import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import {
  CONTENT_STATUS_LABEL,
  type Content,
  type ContentStatus,
  type Paginated,
} from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_VARIANT: Record<ContentStatus, 'warning' | 'success' | 'secondary' | 'default' | 'danger'> = {
  DRAFT: 'secondary',
  EXPANDED: 'warning',
  APPROVED: 'success',
  SCHEDULED: 'warning',
  PUBLISHED: 'success',
  UNPUBLISHED: 'danger',
  ARCHIVED: 'secondary',
};

export default function ContentsPage() {
  const { currentSiteId, currentSite } = useCurrentSite();
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const queryString = new URLSearchParams({
    ...(currentSiteId ? { siteId: currentSiteId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    page: String(page),
    pageSize: '50',
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['contents', currentSiteId, status, search, page],
    queryFn: () => api<Paginated<Content>>(`/contents?${queryString}`),
    enabled: !!currentSiteId,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Conteúdos</h1>
          <p className="text-sm text-muted-foreground">
            Posts expandidos e aguardando revisão em {currentSite?.name ?? '—'}. Para gerar novos,
            abra <Link className="underline" href="/ideias">Ideias</Link> e clique em &ldquo;Expandir&rdquo;.
          </p>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar título, slug, meta…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            className="w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ContentStatus | '');
              setPage(1);
            }}
          >
            <option value="">Todos status</option>
            {(Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[]).map((s) => (
              <option key={s} value={s}>
                {CONTENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH className="w-20">Capa</TH>
              <TH>Título</TH>
              <TH>Tipo</TH>
              <TH>Status</TH>
              <TH>v.</TH>
              <TH>Atualizado</TH>
              <TH className="text-right">Abrir</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={7} className="text-center text-muted-foreground">
                  Carregando…
                </TD>
              </TR>
            )}
            {!isLoading && items.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum conteúdo ainda. Expanda uma ideia em <Link href="/ideias" className="underline">/ideias</Link>.
                </TD>
              </TR>
            )}
            {items.map((c) => (
              <TR key={c.id}>
                <TD>
                  {c.ogImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.ogImage.url}
                      alt=""
                      className="w-16 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-muted rounded" />
                  )}
                </TD>
                <TD className="font-medium max-w-md truncate">{c.title || '(sem título)'}</TD>
                <TD className="text-muted-foreground">{c.contentType?.name ?? '—'}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</Badge>
                </TD>
                <TD>{c.version}</TD>
                <TD className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</TD>
                <TD className="text-right">
                  <Link href={`/conteudos/${c.id}`} className="text-sm underline">
                    Editar →
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
