'use client';

import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ContentVersionRow } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface DiffResult {
  fromVersion: number;
  toVersion: number;
  fields: Record<string, { from: unknown; to: unknown; changed: boolean }>;
}

export function VersionDiff({
  contentId,
  versions,
}: {
  contentId: string;
  versions: ContentVersionRow[];
}) {
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  const [from, setFrom] = useState<number>(sorted[0]?.version ?? 1);
  const [to, setTo] = useState<number>(sorted[sorted.length - 1]?.version ?? 1);

  const { data, isLoading } = useQuery({
    queryKey: ['diff', contentId, from, to],
    queryFn: () => api<DiffResult>(`/contents/${contentId}/diff?from=${from}&to=${to}`),
    enabled: from !== to,
  });

  if (sorted.length < 2) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Pelo menos 2 versões necessárias para diff.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center gap-3 text-sm">
        <span className="font-medium">Comparar:</span>
        <Select value={from} onChange={(e) => setFrom(Number(e.target.value))} className="w-32">
          {sorted.map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version}
            </option>
          ))}
        </Select>
        <span>→</span>
        <Select value={to} onChange={(e) => setTo(Number(e.target.value))} className="w-32">
          {sorted.map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version}
            </option>
          ))}
        </Select>
      </Card>

      {from === to && (
        <p className="text-sm text-muted-foreground">Selecione versões diferentes.</p>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {data && (
        <div className="space-y-3">
          {Object.entries(data.fields)
            .filter(([, v]) => v.changed)
            .map(([key, v]) => (
              <Card key={key} className="p-3">
                <div className="text-xs font-mono uppercase text-muted-foreground mb-2">{key}</div>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">v{data.fromVersion}</div>
                    <pre className="whitespace-pre-wrap font-mono bg-red-50 dark:bg-red-950/40 p-2 rounded border-l-2 border-red-400 max-h-60 overflow-auto">
                      {renderValue(v.from)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">v{data.toVersion}</div>
                    <pre className="whitespace-pre-wrap font-mono bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border-l-2 border-emerald-400 max-h-60 overflow-auto">
                      {renderValue(v.to)}
                    </pre>
                  </div>
                </div>
              </Card>
            ))}
          {Object.values(data.fields).every((v) => !v.changed) && (
            <Card className="p-4 text-sm text-muted-foreground">
              Nenhuma diferença entre as versões selecionadas.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function renderValue(v: unknown): string {
  if (v === undefined || v === null) return '(vazio)';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join(', ');
  return JSON.stringify(v, null, 2);
}
