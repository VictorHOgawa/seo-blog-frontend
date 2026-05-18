'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { useAuth } from '@/components/providers/auth-provider';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { api } from '@/lib/api';
import type { ContentType } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ContentTypesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { currentSiteId, currentSite } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentType | null>(null);
  const [form, setForm] = useState({ slug: '', name: '', routePrefix: '' });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return api(`/content-types/${editing.id}`, {
          method: 'PATCH',
          json: { name: form.name, routePrefix: form.routePrefix },
        });
      }
      return api('/content-types', {
        method: 'POST',
        json: { ...form, siteId: currentSiteId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/content-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({ slug: '', name: '', routePrefix: '' });
    setError(null);
    setOpen(true);
  }
  function openEdit(ct: ContentType) {
    setEditing(ct);
    setForm({ slug: ct.slug, name: ct.name, routePrefix: ct.routePrefix });
    setError(null);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tipos de conteúdo</h1>
          <p className="text-sm text-muted-foreground">
            Para {currentSite?.name ?? '—'}. Cada tipo gera uma seção no site (ex.: /blog, /noticias).
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} disabled={!currentSiteId}>
            <Plus className="h-4 w-4 mr-2" /> Novo tipo
          </Button>
        )}
      </header>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Slug</TH>
              <TH>Rota</TH>
              <TH>Status</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={5} className="text-center text-muted-foreground">
                  Carregando…
                </TD>
              </TR>
            )}
            {!isLoading && types.length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center text-muted-foreground">
                  Nenhum tipo cadastrado.
                </TD>
              </TR>
            )}
            {types.map((ct) => (
              <TR key={ct.id}>
                <TD className="font-medium">{ct.name}</TD>
                <TD className="text-muted-foreground">{ct.slug}</TD>
                <TD className="text-muted-foreground font-mono text-xs">{ct.routePrefix}</TD>
                <TD>
                  <Badge variant={ct.active ? 'success' : 'secondary'}>
                    {ct.active ? 'ativo' : 'inativo'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  {isAdmin && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ct)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Apagar tipo "${ct.name}"?`)) remove.mutate(ct.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar tipo' : 'Novo tipo de conteúdo'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="blog"
                required
                disabled={!!editing}
              />
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Blog"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Rota</Label>
              <Input
                value={form.routePrefix}
                onChange={(e) => setForm({ ...form, routePrefix: e.target.value })}
                placeholder="/blog"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
