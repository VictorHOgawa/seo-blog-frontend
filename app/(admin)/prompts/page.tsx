'use client';

import { PlaygroundDialog } from '@/components/feature/prompts/playground-dialog';
import { PromptFormDialog } from '@/components/feature/prompts/prompt-form-dialog';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { PROMPT_FIELDS, type ContentType, type PromptTemplate } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function PromptsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { currentSiteId } = useCurrentSite();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts', currentSiteId],
    queryFn: () => api<PromptTemplate[]>(`/prompts?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });
  const { data: contentTypes = [] } = useQuery({
    queryKey: ['content-types', currentSiteId],
    queryFn: () => api<ContentType[]>(`/content-types?siteId=${currentSiteId}`),
    enabled: !!currentSiteId,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [running, setRunning] = useState<PromptTemplate | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api(`/prompts/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  });

  function ctLabel(id: string | null) {
    if (!id) return '— todos —';
    return contentTypes.find((c) => c.id === id)?.name ?? id.slice(0, 6);
  }
  function fieldLabel(value: string) {
    return PROMPT_FIELDS.find((f) => f.value === value)?.label ?? value;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Templates por site / tipo / campo. Cada campo (título, corpo, meta, …) tem seu próprio
            prompt configurável.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Novo prompt
          </Button>
        )}
      </header>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Campo</TH>
              <TH>Tipo</TH>
              <TH>Locale</TH>
              <TH>Modelo</TH>
              <TH>Temp.</TH>
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
            {!isLoading && prompts.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum prompt cadastrado para este site.
                </TD>
              </TR>
            )}
            {prompts.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{fieldLabel(p.field)}</TD>
                <TD className="text-muted-foreground">{ctLabel(p.contentTypeId)}</TD>
                <TD className="text-muted-foreground">{p.locale}</TD>
                <TD className="font-mono text-xs">{p.model}</TD>
                <TD>{p.temperature}</TD>
                <TD>
                  <Badge variant={p.active ? 'success' : 'secondary'}>
                    {p.active ? 'ativo' : 'inativo'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRunning(p);
                        setPlayOpen(true);
                      }}
                      title="Playground"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Apagar prompt "${fieldLabel(p.field)}"?`))
                              remove.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <PromptFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <PlaygroundDialog open={playOpen} onOpenChange={setPlayOpen} prompt={running} />
    </div>
  );
}
