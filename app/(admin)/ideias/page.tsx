'use client';

import { BulkImportDialog } from '@/components/feature/ideas/bulk-import-dialog';
import { IdeaFormDialog } from '@/components/feature/ideas/idea-form-dialog';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import type { ContentType, Idea, IdeaStatus, Paginated } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_VARIANT: Record<IdeaStatus, 'warning' | 'success' | 'secondary'> = {
  PENDING: 'warning',
  EXPANDED: 'success',
  DISCARDED: 'secondary',
};

export default function IdeasPage() {
  const { currentSiteId, currentSite } = useCurrentSite();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [status, setStatus] = useState<IdeaStatus | ''>('');
  const [contentTypeId, setContentTypeId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selection, setSelection] = useState<Set<string>>(new Set());

  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);

  const { data: contentTypes = [] } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });

  const queryString = new URLSearchParams({
    ...(currentSiteId ? { siteId: currentSiteId } : {}),
    ...(status ? { status } : {}),
    ...(contentTypeId ? { contentTypeId } : {}),
    ...(search ? { search } : {}),
    page: String(page),
    pageSize: String(pageSize),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['ideas', currentSiteId, status, contentTypeId, search, page],
    queryFn: () => api<Paginated<Idea>>(`/ideas?${queryString}`),
    enabled: !!currentSiteId,
  });

  const ideas = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) =>
      api('/ideas/bulk-delete', { method: 'POST', json: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setSelection(new Set());
    },
  });

  const bulkStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: IdeaStatus }) =>
      api('/ideas/bulk-status', { method: 'POST', json: { ids, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setSelection(new Set());
    },
  });

  const expand = useMutation({
    mutationFn: (ideaId: string) =>
      api<{ id: string }>('/contents/expand', {
        method: 'POST',
        json: { ideaId, generateImage: true },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-cost'] });
      router.push(`/conteudos/${data.id}`);
    },
    onError: (e: Error) => alert(`Falha ao expandir: ${e.message}`),
  });

  function toggleAll() {
    if (selection.size === ideas.length) setSelection(new Set());
    else setSelection(new Set(ideas.map((i) => i.id)));
  }
  function toggle(id: string) {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelection(next);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ideias</h1>
          <p className="text-sm text-muted-foreground">
            Lista de pautas em {currentSite?.name ?? '—'}. Importe em lote ou crie individualmente.
            Expansão em IA acontece na Fase 3+.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Importar em lote
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova ideia
          </Button>
        </div>
      </header>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar título, briefing ou keyword…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            className="w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as IdeaStatus | '');
              setPage(1);
            }}
          >
            <option value="">Todos status</option>
            <option value="PENDING">PENDING</option>
            <option value="EXPANDED">EXPANDED</option>
            <option value="DISCARDED">DISCARDED</option>
          </Select>
          <Select
            className="w-48"
            value={contentTypeId}
            onChange={(e) => {
              setContentTypeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos tipos</option>
            {contentTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Bulk actions */}
      {selection.size > 0 && (
        <Card className="p-3 flex items-center gap-3 bg-muted/50">
          <span className="text-sm font-medium">{selection.size} selecionada(s)</span>
          <Select
            className="w-40"
            value=""
            onChange={(e) => {
              const next = e.target.value as IdeaStatus;
              if (next) bulkStatus.mutate({ ids: Array.from(selection), status: next });
            }}
          >
            <option value="">Mudar status…</option>
            <option value="PENDING">→ PENDING</option>
            <option value="EXPANDED">→ EXPANDED</option>
            <option value="DISCARDED">→ DISCARDED</option>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(`Apagar ${selection.size} ideia(s)?`))
                bulkDelete.mutate(Array.from(selection));
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Apagar
          </Button>
        </Card>
      )}

      <Card>
        <Table>
          <THead>
            <TR>
              <TH className="w-8">
                <input
                  type="checkbox"
                  checked={ideas.length > 0 && selection.size === ideas.length}
                  onChange={toggleAll}
                />
              </TH>
              <TH>Título</TH>
              <TH>Tipo</TH>
              <TH>Keywords</TH>
              <TH>Status</TH>
              <TH>Criada</TH>
              <TH className="text-right">Ações</TH>
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
            {!isLoading && ideas.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma ideia. Use <strong>Importar em lote</strong> para começar.
                </TD>
              </TR>
            )}
            {ideas.map((i) => (
              <TR key={i.id}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selection.has(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                </TD>
                <TD className="font-medium max-w-md truncate">{i.titleSeed}</TD>
                <TD className="text-muted-foreground">{i.contentType?.name ?? '—'}</TD>
                <TD className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {i.keywords.join(', ') || '—'}
                </TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[i.status]}>{i.status}</Badge>
                </TD>
                <TD className="text-xs text-muted-foreground">
                  {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    {i.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={expand.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Expandir "${i.titleSeed.slice(0, 60)}…" via IA?\n\nIsso fará ~7 chamadas de texto + 1 imagem (~$0.05–0.17).`,
                            )
                          )
                            expand.mutate(i.id);
                        }}
                        title="Expandir com IA"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(i);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Apagar ideia "${i.titleSeed}"?`))
                          bulkDelete.mutate([i.id]);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {ideas.length} de {total} (página {page}/{totalPages})
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}

      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <IdeaFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
