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
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { api } from '@/lib/api';
import {
  parseCsv,
  parseJson,
  parseMarkdown,
  parsePaste,
  type ParsedIdea,
} from '@/lib/parsers';
import type { ContentType } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type Tab = 'paste' | 'csv' | 'json' | 'markdown';

const tabs: { id: Tab; label: string; placeholder: string }[] = [
  {
    id: 'paste',
    label: 'Colar (1/linha)',
    placeholder: 'Cole as ideias, uma por linha…\nEx.:\nSintomas de diabetes\nPrevenção de AVC',
  },
  {
    id: 'csv',
    label: 'CSV',
    placeholder:
      'title,briefing,keywords\n"Sintomas de diabetes","Visão geral","diabetes;sintomas"\n"Prevenção de AVC","","avc;prevenção"',
  },
  {
    id: 'json',
    label: 'JSON',
    placeholder:
      '[\n  { "titleSeed": "Sintomas de diabetes", "briefing": "Visão geral", "keywords": ["diabetes","sintomas"] }\n]',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    placeholder: '- Sintomas de diabetes\n- Prevenção de AVC\n1. Hipertensão',
  },
];

export function BulkImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentSiteId } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: contentTypes = [] } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });

  const [tab, setTab] = useState<Tab>('paste');
  const [text, setText] = useState('');
  const [contentTypeId, setContentTypeId] = useState<string>('');
  const [locale, setLocale] = useState('pt-BR');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedIdea[] | null>(null);

  // default content type when ready
  if (!contentTypeId && contentTypes.length > 0) {
    setContentTypeId(contentTypes[0].id);
  }

  function parseNow() {
    setError(null);
    try {
      let items: ParsedIdea[];
      if (tab === 'paste') items = parsePaste(text);
      else if (tab === 'markdown') items = parseMarkdown(text);
      else if (tab === 'json') items = parseJson(text);
      else items = parseCsv(text);
      if (items.length === 0) {
        setError('Nenhuma ideia detectada no texto.');
        setParsed(null);
        return;
      }
      setParsed(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setParsed(null);
    }
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!parsed || !currentSiteId || !contentTypeId) throw new Error('Faltam dados');
      const items = parsed.map((p) => ({
        siteId: currentSiteId,
        contentTypeId,
        titleSeed: p.titleSeed,
        briefing: p.briefing,
        keywords: p.keywords,
        locale: p.locale ?? locale,
        notes: p.notes,
      }));
      return api<{ count: number }>('/ideas/bulk', { method: 'POST', json: { items } });
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      reset();
      onOpenChange(false);
      // simple feedback — could be toast later
      alert(`${count} ideias importadas.`);
    },
    onError: (e: Error) => setError(e.message),
  });

  function reset() {
    setText('');
    setParsed(null);
    setError(null);
    setTab('paste');
  }

  const ctOptions = useMemo(
    () => contentTypes.filter((ct) => ct.active),
    [contentTypes],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importar ideias em lote</DialogTitle>
          <DialogDescription>
            Cole, suba ou converta uma lista para o pipeline. As ideias entram como{' '}
            <strong>PENDING</strong> e ficam aguardando expansão pela IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de conteúdo</Label>
              <Select value={contentTypeId} onChange={(e) => setContentTypeId(e.target.value)}>
                {ctOptions.length === 0 && <option value="">— sem tipos ativos —</option>}
                {ctOptions.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} ({ct.slug})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Locale default</Label>
              <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="pt-BR" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setParsed(null);
                }}
                className={
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ' +
                  (tab === t.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground')
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {!parsed && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tabs.find((t) => t.id === tab)?.placeholder}
                className="flex min-h-[220px] w-full rounded-md border border-input bg-background p-3 text-sm font-mono"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {tab === 'csv' && 'Colunas aceitas: title|titleSeed (obrigatória), briefing, keywords, locale, notes. keywords separadas por ; ou |.'}
                  {tab === 'json' && 'Array de objetos com titleSeed, briefing, keywords[].'}
                  {tab === 'markdown' && 'Listas com -, * ou 1. são detectadas.'}
                  {tab === 'paste' && 'Uma ideia por linha.'}
                </p>
                <Button type="button" onClick={parseNow} disabled={!text.trim()}>
                  Pré-visualizar
                </Button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}

          {parsed && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {parsed.length} ideia{parsed.length === 1 ? '' : 's'} detectada
                  {parsed.length === 1 ? '' : 's'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setParsed(null)}>
                  Voltar para edição
                </Button>
              </div>
              <div className="max-h-96 overflow-auto border rounded-md">
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-10">#</TH>
                      <TH className="min-w-[320px]">Título</TH>
                      <TH className="min-w-[280px]">Briefing</TH>
                      <TH className="min-w-[200px]">Keywords</TH>
                      <TH className="w-10"></TH>
                    </TR>
                  </THead>
                  <TBody>
                    {parsed.map((p, i) => (
                      <TR key={i}>
                        <TD className="text-muted-foreground">{i + 1}</TD>
                        <TD>
                          <Input
                            value={p.titleSeed}
                            onChange={(e) => {
                              const next = [...parsed];
                              next[i] = { ...next[i], titleSeed: e.target.value };
                              setParsed(next);
                            }}
                          />
                        </TD>
                        <TD>
                          <Input
                            value={p.briefing ?? ''}
                            onChange={(e) => {
                              const next = [...parsed];
                              next[i] = { ...next[i], briefing: e.target.value };
                              setParsed(next);
                            }}
                          />
                        </TD>
                        <TD>
                          <Input
                            value={(p.keywords ?? []).join(', ')}
                            onChange={(e) => {
                              const next = [...parsed];
                              next[i] = {
                                ...next[i],
                                keywords: e.target.value
                                  .split(',')
                                  .map((k) => k.trim())
                                  .filter(Boolean),
                              };
                              setParsed(next);
                            }}
                          />
                        </TD>
                        <TD>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setParsed(parsed.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {parsed && (
            <Button
              type="button"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || parsed.length === 0 || !contentTypeId}
            >
              {submit.isPending ? 'Importando…' : `Importar ${parsed.length}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
