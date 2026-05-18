'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { api } from '@/lib/api';
import type { ContentType, Idea, IdeaStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface FormState {
  contentTypeId: string;
  titleSeed: string;
  briefing: string;
  keywords: string;
  locale: string;
  status: IdeaStatus;
  notes: string;
}

const empty: FormState = {
  contentTypeId: '',
  titleSeed: '',
  briefing: '',
  keywords: '',
  locale: 'pt-BR',
  status: 'PENDING',
  notes: '',
};

export function IdeaFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Idea | null;
}) {
  const { currentSiteId } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: contentTypes = [] } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });

  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        contentTypeId: editing.contentTypeId,
        titleSeed: editing.titleSeed,
        briefing: editing.briefing,
        keywords: editing.keywords.join(', '),
        locale: editing.locale,
        status: editing.status,
        notes: editing.notes,
      });
    } else {
      setForm({ ...empty, contentTypeId: contentTypes[0]?.id ?? '' });
    }
    setError(null);
  }, [editing, contentTypes, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        contentTypeId: form.contentTypeId,
        titleSeed: form.titleSeed,
        briefing: form.briefing,
        keywords: form.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        locale: form.locale,
        status: form.status,
        notes: form.notes,
      };
      if (editing) return api(`/ideas/${editing.id}`, { method: 'PATCH', json: payload });
      return api('/ideas', { method: 'POST', json: { ...payload, siteId: currentSiteId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      onOpenChange(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar ideia' : 'Nova ideia'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de conteúdo</Label>
              <Select
                value={form.contentTypeId}
                onChange={(e) => setForm({ ...form, contentTypeId: e.target.value })}
                required
              >
                {contentTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as IdeaStatus })}
              >
                <option value="PENDING">PENDING</option>
                <option value="EXPANDED">EXPANDED</option>
                <option value="DISCARDED">DISCARDED</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Título / tema</Label>
            <Input
              value={form.titleSeed}
              onChange={(e) => setForm({ ...form, titleSeed: e.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-1">
            <Label>Briefing (opcional)</Label>
            <textarea
              value={form.briefing}
              onChange={(e) => setForm({ ...form, briefing: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Keywords (csv)</Label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="diabetes, sintomas"
              />
            </div>
            <div className="space-y-1">
              <Label>Locale</Label>
              <Input
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notas internas (opcional)</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
