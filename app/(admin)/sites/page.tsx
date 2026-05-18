'use client';

import { Badge } from '@/components/ui/badge';
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
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { useAuth } from '@/components/providers/auth-provider';
import { api } from '@/lib/api';
import type { Site } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SiteFormState {
  slug: string;
  name: string;
  domain: string;
  authorName: string;
  toneOfVoice: string;
  defaultLocale: string;
  supportedLocales: string;
  revalidateUrl: string;
  revalidateSecret: string;
}

const empty: SiteFormState = {
  slug: '',
  name: '',
  domain: '',
  authorName: '',
  toneOfVoice: '',
  defaultLocale: 'pt-BR',
  supportedLocales: 'pt-BR',
  revalidateUrl: '',
  revalidateSecret: '',
};

function siteToForm(s: Site): SiteFormState {
  return {
    slug: s.slug,
    name: s.name,
    domain: s.domain ?? '',
    authorName: s.authorName,
    toneOfVoice: s.toneOfVoice,
    defaultLocale: s.defaultLocale,
    supportedLocales: s.supportedLocales.join(','),
    revalidateUrl: s.revalidateUrl ?? '',
    revalidateSecret: s.revalidateSecret ?? '',
  };
}

function formToPayload(f: SiteFormState) {
  return {
    slug: f.slug,
    name: f.name,
    domain: f.domain || undefined,
    authorName: f.authorName,
    toneOfVoice: f.toneOfVoice,
    defaultLocale: f.defaultLocale,
    supportedLocales: f.supportedLocales.split(',').map((x) => x.trim()).filter(Boolean),
    revalidateUrl: f.revalidateUrl || undefined,
    revalidateSecret: f.revalidateSecret || undefined,
  };
}

export default function SitesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => api<Site[]>('/sites'),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState<SiteFormState>(empty);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (editing) return api<Site>(`/sites/${editing.id}`, { method: 'PATCH', json: payload });
      return api<Site>('/sites', { method: 'POST', json: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setOpen(false);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/sites/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  }
  function openEdit(s: Site) {
    setEditing(s);
    setForm(siteToForm(s));
    setError(null);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sites</h1>
          <p className="text-sm text-muted-foreground">LPs gerenciadas por este CMS.</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Novo site
          </Button>
        )}
      </header>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Slug</TH>
              <TH>Domínio</TH>
              <TH>Locales</TH>
              <TH>Tipos</TH>
              <TH>Status</TH>
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
            {!isLoading && sites.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-center text-muted-foreground">
                  Nenhum site.
                </TD>
              </TR>
            )}
            {sites.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.name}</TD>
                <TD className="text-muted-foreground">{s.slug}</TD>
                <TD className="text-muted-foreground">{s.domain ?? '—'}</TD>
                <TD className="text-muted-foreground">{s.supportedLocales.join(', ')}</TD>
                <TD>{s._count?.contentTypes ?? 0}</TD>
                <TD>
                  <Badge variant={s.active ? 'success' : 'secondary'}>
                    {s.active ? 'ativo' : 'inativo'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  {isAdmin && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Apagar site "${s.name}"? Esta ação é destrutiva.`))
                            remove.mutate(s.id);
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
            <DialogTitle>{editing ? 'Editar site' : 'Novo site'}</DialogTitle>
            <DialogDescription>Configuração do tenant.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Slug"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
                placeholder="health-voice"
                required
                disabled={!!editing}
              />
              <Field
                label="Nome"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Health Voice"
                required
              />
            </div>
            <Field
              label="Domínio"
              value={form.domain}
              onChange={(v) => setForm({ ...form, domain: v })}
              placeholder="healthvoice.com.br"
            />
            <Field
              label="Autor (aparece nos posts)"
              value={form.authorName}
              onChange={(v) => setForm({ ...form, authorName: v })}
              placeholder="Health Voice"
              required
            />
            <div className="space-y-1">
              <Label>Tom de voz / persona</Label>
              <textarea
                value={form.toneOfVoice}
                onChange={(e) => setForm({ ...form, toneOfVoice: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Profissional, baseado em evidências…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Locale default"
                value={form.defaultLocale}
                onChange={(v) => setForm({ ...form, defaultLocale: v })}
                placeholder="pt-BR"
              />
              <Field
                label="Locales suportados (csv)"
                value={form.supportedLocales}
                onChange={(v) => setForm({ ...form, supportedLocales: v })}
                placeholder="pt-BR,en,es"
              />
            </div>
            <Field
              label="Webhook revalidate URL"
              value={form.revalidateUrl}
              onChange={(v) => setForm({ ...form, revalidateUrl: v })}
              placeholder="https://healthvoice.com.br/api/revalidate"
            />
            <Field
              label="Revalidate secret"
              value={form.revalidateSecret}
              onChange={(v) => setForm({ ...form, revalidateSecret: v })}
              placeholder="(usado no header X-Revalidate-Secret)"
            />
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

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
  );
}
