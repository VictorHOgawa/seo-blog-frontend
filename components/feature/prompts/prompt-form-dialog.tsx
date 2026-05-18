'use client';

import { Button } from '@/components/ui/button';
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
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { api } from '@/lib/api';
import { PROMPT_FIELDS, type ContentType, type ModelInfo, type PromptField, type PromptTemplate } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface FormState {
  contentTypeId: string;
  field: PromptField;
  locale: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: string;
  maxTokens: string;
  active: boolean;
}

const empty: FormState = {
  contentTypeId: '',
  field: 'BODY',
  locale: 'pt-BR',
  model: 'anthropic/claude-sonnet-4.5',
  systemPrompt:
    'Você é um redator profissional. Tom: {{site.toneOfVoice}}. Saída sempre em {{locale}}.',
  userPrompt:
    'Tema: {{title}}\nBriefing: {{briefing}}\nKeywords: {{keywords}}\n\nEscreva o conteúdo solicitado.',
  temperature: '0.7',
  maxTokens: '',
  active: true,
};

export function PromptFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PromptTemplate | null;
}) {
  const { currentSiteId } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: contentTypes = [] } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });
  const { data: models } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => api<{ text: ModelInfo[] }>('/ai/models'),
  });

  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        contentTypeId: editing.contentTypeId ?? '',
        field: editing.field,
        locale: editing.locale,
        model: editing.model,
        systemPrompt: editing.systemPrompt,
        userPrompt: editing.userPrompt,
        temperature: String(editing.temperature),
        maxTokens: editing.maxTokens ? String(editing.maxTokens) : '',
        active: editing.active,
      });
    } else {
      setForm(empty);
    }
    setError(null);
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        contentTypeId: form.contentTypeId || undefined,
        field: form.field,
        locale: form.locale,
        model: form.model,
        systemPrompt: form.systemPrompt,
        userPrompt: form.userPrompt,
        temperature: Number(form.temperature),
        maxTokens: form.maxTokens ? Number(form.maxTokens) : undefined,
        active: form.active,
      };
      if (editing) {
        return api(`/prompts/${editing.id}`, { method: 'PATCH', json: payload });
      }
      return api('/prompts', {
        method: 'POST',
        json: { ...payload, siteId: currentSiteId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      onOpenChange(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prompt' : 'Novo prompt'}</DialogTitle>
          <DialogDescription>
            Variáveis disponíveis: <code>{'{{title}}'}</code> <code>{'{{briefing}}'}</code>{' '}
            <code>{'{{keywords}}'}</code> <code>{'{{locale}}'}</code>{' '}
            <code>{'{{site.name}}'}</code> <code>{'{{site.toneOfVoice}}'}</code>
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Tipo de conteúdo</Label>
              <Select
                value={form.contentTypeId}
                onChange={(e) => setForm({ ...form, contentTypeId: e.target.value })}
              >
                <option value="">— qualquer tipo —</option>
                {contentTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Campo</Label>
              <Select
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value as PromptField })}
              >
                {PROMPT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Locale</Label>
              <Input
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Modelo</Label>
              <Select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              >
                {(models?.text ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                    {m.pricing
                      ? ` — in $${m.pricing.inputPerMTokens}/M · out $${m.pricing.outputPerMTokens}/M`
                      : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>System prompt</Label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label>User prompt</Label>
            <textarea
              value={form.userPrompt}
              onChange={(e) => setForm({ ...form, userPrompt: e.target.value })}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <Label>Max tokens (opcional)</Label>
              <Input
                type="number"
                min="1"
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo
            </label>
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
