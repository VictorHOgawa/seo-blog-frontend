'use client';

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
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { api } from '@/lib/api';
import { formatCostCents, formatTokens } from '@/lib/format';
import type { AiPreviewResult, PromptTemplate } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function extractVars(...templates: string[]): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  for (const t of templates) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) set.add(m[1]);
  }
  return [...set];
}

export function PlaygroundDialog({
  open,
  onOpenChange,
  prompt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prompt: PromptTemplate | null;
}) {
  const { currentSite } = useCurrentSite();
  const queryClient = useQueryClient();
  const vars = useMemo(
    () => (prompt ? extractVars(prompt.systemPrompt, prompt.userPrompt) : []),
    [prompt],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [useCache, setUseCache] = useState(true);
  const [result, setResult] = useState<AiPreviewResult | null>(null);

  useEffect(() => {
    if (!prompt) return;
    const defaults: Record<string, string> = {
      title: 'Sintomas iniciais de diabetes tipo 2',
      briefing: 'Visão geral para leigos com checklist e quando procurar um médico.',
      keywords: 'diabetes, sintomas, glicemia',
      locale: prompt.locale,
    };
    if (currentSite) {
      defaults['site.name'] = currentSite.name;
      defaults['site.toneOfVoice'] = currentSite.toneOfVoice;
      defaults['site.authorName'] = currentSite.authorName;
    }
    const filled: Record<string, string> = {};
    for (const v of vars) filled[v] = values[v] ?? defaults[v] ?? '';
    setValues(filled);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, open]);

  const run = useMutation({
    mutationFn: async () => {
      if (!prompt) throw new Error('No prompt');
      const variables: Record<string, unknown> = {};
      for (const k of Object.keys(values)) {
        // suporta path com ponto: site.name -> { site: { name } }
        const parts = k.split('.');
        let cur: Record<string, unknown> = variables;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = (cur[parts[i]] as Record<string, unknown>) ?? {};
          cur = cur[parts[i]] as Record<string, unknown>;
        }
        cur[parts[parts.length - 1]] = values[k];
      }
      return api<AiPreviewResult>('/ai/preview', {
        method: 'POST',
        json: {
          model: prompt.model,
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          variables,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens ?? undefined,
          siteId: prompt.siteId,
          promptTemplateId: prompt.id,
          useCache,
        },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['ai-cost'] });
    },
  });

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Playground — {prompt.field}</DialogTitle>
          <DialogDescription>
            Modelo: <code>{prompt.model}</code> · temp {prompt.temperature}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Variáveis</h3>
            {vars.length === 0 && (
              <p className="text-sm text-muted-foreground">Esse prompt não usa variáveis.</p>
            )}
            {vars.map((v) => (
              <div key={v} className="space-y-1">
                <Label className="font-mono text-xs">{'{{' + v + '}}'}</Label>
                {v.includes('.') || v.toLowerCase().includes('briefing') ? (
                  <textarea
                    value={values[v] ?? ''}
                    onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <Input
                    value={values[v] ?? ''}
                    onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm pt-2">
              <input
                type="checkbox"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
              />
              Usar cache (24h, mesmo hash → 0 custo)
            </label>
            <Card className="p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/30">
              <p className="text-xs text-amber-900 dark:text-amber-300 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Clicar em <strong>Rodar</strong> gera 1 chamada paga à OpenRouter. Custo aproximado
                visível abaixo após a execução.
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Resultado</h3>
            {!result && !run.isPending && (
              <p className="text-sm text-muted-foreground">— ainda não executado —</p>
            )}
            {run.isPending && <p className="text-sm text-muted-foreground">Chamando OpenRouter…</p>}
            {run.error && (
              <Card className="p-3 bg-red-50 border-red-200 dark:bg-red-950/30">
                <p className="text-xs text-red-900 dark:text-red-300">
                  {(run.error as Error).message}
                </p>
              </Card>
            )}
            {result && (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Card className="p-2">
                    <div className="text-muted-foreground">Custo</div>
                    <div className="font-semibold">{formatCostCents(result.costCents)}</div>
                  </Card>
                  <Card className="p-2">
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">
                      {formatTokens(result.inputTokens)} → {formatTokens(result.outputTokens)}
                    </div>
                  </Card>
                  <Card className="p-2">
                    <div className="text-muted-foreground">{result.cached ? 'Cache' : 'Tempo'}</div>
                    <div className="font-semibold">
                      {result.cached ? 'HIT' : `${(result.durationMs / 1000).toFixed(1)}s`}
                    </div>
                  </Card>
                </div>
                <Card className="p-3 max-h-96 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap font-sans">{result.text}</pre>
                </Card>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={() => run.mutate()} disabled={run.isPending}>
            <Play className="h-4 w-4 mr-2" />
            {run.isPending ? 'Rodando…' : 'Rodar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
