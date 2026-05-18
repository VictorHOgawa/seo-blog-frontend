'use client';

import { RegenerateButton } from '@/components/feature/contents/regenerate-button';
import { SeoPreview } from '@/components/feature/contents/seo-preview';
import { VersionDiff } from '@/components/feature/contents/version-diff';
import { RelatedTab } from '@/components/feature/contents/related-tab';
import { useCurrentSite } from '@/components/providers/current-site-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCostCents, formatDate } from '@/lib/format';
import {
  CONTENT_STATUS_LABEL,
  type Content,
  type ContentStatus,
  type ContentVersionRow,
  type MediaAsset,
} from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Save, Send, Sparkles } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Tab = 'content' | 'seo' | 'media' | 'related' | 'history';

export default function ContentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentSite } = useCurrentSite();

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', params.id],
    queryFn: () => api<Content>(`/contents/${params.id}`),
  });
  const { data: versions = [] } = useQuery({
    queryKey: ['content-versions', params.id],
    queryFn: () => api<ContentVersionRow[]>(`/contents/${params.id}/versions`),
    enabled: !!content,
  });

  const [tab, setTab] = useState<Tab>('content');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    bodyMd: '',
    excerpt: '',
    metaDescription: '',
  });
  const [dirty, setDirty] = useState(false);

  // Inicializa o form APENAS quando muda o id (nova rota) ou quando o
  // conteúdo chega pela primeira vez. Refetches subsequentes do React Query
  // não devem sobrescrever o form (caso contrário perdem o que o usuário
  // digitou ou um campo regenerado em outra aba).
  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!content) return;
    if (initializedFor.current === content.id && !dirty) {
      // mesmo content já carregado — só sincroniza campos que vieram do
      // servidor (ex.: regerar TAGS atualiza content.tags) sem mexer no form
      return;
    }
    if (initializedFor.current !== content.id) {
      setForm({
        title: content.title,
        slug: content.slug,
        bodyMd: content.bodyMd,
        excerpt: content.excerpt,
        metaDescription: content.metaDescription,
      });
      setDirty(false);
      initializedFor.current = content.id;
    }
  }, [content, dirty]);

  const save = useMutation({
    mutationFn: () =>
      api<Content>(`/contents/${params.id}`, {
        method: 'PATCH',
        json: form,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', params.id] });
      queryClient.invalidateQueries({ queryKey: ['content-versions', params.id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setDirty(false);
    },
  });

  const transition = useMutation({
    mutationFn: (to: ContentStatus) =>
      api(`/contents/${params.id}/transition`, { method: 'POST', json: { to } }),
    onSuccess: (_, to) => {
      queryClient.invalidateQueries({ queryKey: ['content', params.id] });
      queryClient.invalidateQueries({ queryKey: ['content-versions', params.id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setStatusFeedback({ kind: 'ok', to: to as ContentStatus });
      setTimeout(() => setStatusFeedback(null), 2500);
    },
    onError: (e: Error) => {
      setStatusFeedback({ kind: 'err', message: e.message });
      setTimeout(() => setStatusFeedback(null), 4000);
    },
  });
  const [statusFeedback, setStatusFeedback] = useState<
    { kind: 'ok'; to: ContentStatus } | { kind: 'err'; message: string } | null
  >(null);

  const generateCover = useMutation({
    mutationFn: (prompt?: string) =>
      api<MediaAsset>(`/contents/${params.id}/cover`, {
        method: 'POST',
        json: prompt ? { prompt } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', params.id] });
      queryClient.invalidateQueries({ queryKey: ['content-versions', params.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-cost'] });
    },
    onError: (e: Error) => alert(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api(`/contents/${params.id}`, { method: 'DELETE' }),
    onSuccess: () => router.replace('/conteudos'),
  });

  const publishNow = useMutation({
    mutationFn: () => api(`/contents/${params.id}/publish-now`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', params.id] });
      queryClient.invalidateQueries({ queryKey: ['publish-jobs'] });
      alert('Publicação enfileirada. Verifique em /publicacoes.');
    },
    onError: (e: Error) => alert(e.message),
  });

  if (isLoading || !content)
    return (
      <div className="text-sm text-muted-foreground">Carregando…</div>
    );

  function updateField<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{content.title || '(sem título)'}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{CONTENT_STATUS_LABEL[content.status]}</Badge>
            <span>v{content.version}</span>
            <span>·</span>
            <span>{content.contentType?.name}</span>
            <span>·</span>
            <span>{content.locale}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {statusFeedback?.kind === 'ok' && (
            <span className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
              ✓ Status → {CONTENT_STATUS_LABEL[statusFeedback.to]}
            </span>
          )}
          {statusFeedback?.kind === 'err' && (
            <span className="text-xs text-red-700 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded max-w-xs truncate">
              ⚠ {statusFeedback.message}
            </span>
          )}
          <Select
            className="w-44"
            value=""
            disabled={transition.isPending}
            onChange={(e) => {
              const v = e.target.value as ContentStatus;
              if (v) transition.mutate(v);
            }}
          >
            <option value="">
              {transition.isPending ? 'Mudando status…' : 'Mover status…'}
            </option>
            {(Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[]).map((s) => (
              <option key={s} value={s} disabled={s === content.status}>
                → {CONTENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          {(content.status === 'APPROVED' || content.status === 'UNPUBLISHED') && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Publicar AGORA, sem agendar?')) publishNow.mutate();
              }}
              disabled={publishNow.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {publishNow.isPending ? 'Enfileirando…' : 'Publicar agora'}
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {save.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </header>

      <div className="border-b flex gap-1">
        {[
          { id: 'content' as Tab, label: 'Conteúdo' },
          { id: 'seo' as Tab, label: 'SEO + Preview' },
          { id: 'media' as Tab, label: 'Mídia / Capa' },
          { id: 'related' as Tab, label: 'Links Internos' },
          { id: 'history' as Tab, label: `Histórico (${versions.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
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

      {tab === 'content' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Título</Label>
              <RegenerateButton
                contentId={content.id}
                field="TITLE"
                onResult={(v) => updateField('title', v)}
              />
            </div>
            <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Corpo (Markdown)</Label>
              <RegenerateButton
                contentId={content.id}
                field="BODY"
                onResult={(v) => updateField('bodyMd', v)}
              />
            </div>
            <textarea
              value={form.bodyMd}
              onChange={(e) => updateField('bodyMd', e.target.value)}
              rows={24}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {form.bodyMd.split(/\s+/).filter(Boolean).length} palavras
            </p>
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Meta description</Label>
                <RegenerateButton
                  contentId={content.id}
                  field="META_DESCRIPTION"
                  onResult={(v) => updateField('metaDescription', v)}
                />
              </div>
              <textarea
                value={form.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p
                className={
                  'text-xs ' +
                  (form.metaDescription.length > 160
                    ? 'text-red-600'
                    : form.metaDescription.length < 120
                      ? 'text-amber-600'
                      : 'text-muted-foreground')
                }
              >
                {form.metaDescription.length}/160 caracteres (ideal 150–160)
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Excerpt</Label>
                <RegenerateButton
                  contentId={content.id}
                  field="EXCERPT"
                  onResult={(v) => updateField('excerpt', v)}
                />
              </div>
              <textarea
                value={form.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Card className="p-4 space-y-2">
              <h3 className="text-sm font-medium">Tags & Categorias</h3>
              <div className="flex flex-wrap gap-1">
                {(content.tags ?? []).map((t) => (
                  <Badge key={t.tag.id} variant="secondary">
                    {t.tag.name}
                  </Badge>
                ))}
                {(content.tags ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">sem tags</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {(content.categories ?? []).map((c) => (
                  <Badge key={c.category.id}>{c.category.name}</Badge>
                ))}
              </div>
              <RegenerateButton contentId={content.id} field="TAGS" label="Regerar tags" />
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">JSON-LD</h3>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                {JSON.stringify(content.jsonLd, null, 2)}
              </pre>
            </Card>
          </div>
          <SeoPreview
            content={{
              title: form.title,
              slug: form.slug,
              metaDescription: form.metaDescription,
              excerpt: form.excerpt,
              ogImage: content.ogImage,
            }}
            site={{ domain: currentSite?.domain ?? null, name: currentSite?.name ?? '' }}
            contentTypeRoute={content.contentType?.routePrefix}
          />
        </div>
      )}

      {tab === 'media' && (
        <Card className="p-6 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Imagem de capa (OG)</h3>
              <p className="text-sm text-muted-foreground">
                Usada como `og:image` em Facebook/LinkedIn/Twitter e na listagem de blog.
              </p>
            </div>
            <Button
              onClick={() => generateCover.mutate(undefined)}
              disabled={generateCover.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateCover.isPending ? 'Gerando…' : 'Gerar via IA'}
            </Button>
          </div>
          {content.ogImage?.url ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.ogImage.url}
                alt={content.ogImage.alt}
                className="w-full max-w-2xl rounded-md border"
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Modelo: <code>{content.ogImage.model ?? '—'}</code></div>
                <div>Origem: {content.ogImage.source}</div>
                {content.ogImage.generationPrompt && (
                  <div className="line-clamp-2">Prompt: {content.ogImage.generationPrompt}</div>
                )}
                <div>Custo: {formatCostCents(content.ogImage.costCents)}</div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl h-64 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5" />
                Nenhuma imagem ainda
              </div>
            </div>
          )}
          <RegenerateButton contentId={content.id} field="IMAGE_PROMPT" label="Regerar prompt da imagem" />
        </Card>
      )}

      {tab === 'related' && <RelatedTab contentId={content.id} />}

      {tab === 'history' && (
        <div className="space-y-6">
          <Card>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3">Versão</th>
                  <th className="p-3">Quando</th>
                  <th className="p-3">Mudou</th>
                </tr>
              </thead>
              <tbody>
                {versions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      Sem versões registradas.
                    </td>
                  </tr>
                )}
                {versions.map((v) => {
                  const snap = v.snapshot as Record<string, unknown>;
                  const keys = Object.keys(snap).filter(
                    (k) => snap[k] !== null && snap[k] !== undefined,
                  );
                  return (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="p-3 font-mono">{v.version}</td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(v.createdAt)}</td>
                      <td className="p-3 text-xs text-muted-foreground">{keys.join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-2">Comparar versões</h3>
            <VersionDiff contentId={content.id} versions={versions} />
          </div>
        </div>
      )}

      <div className="border-t pt-4 flex justify-end">
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Apagar este conteúdo? Esta ação não pode ser desfeita.'))
              remove.mutate();
          }}
        >
          Apagar conteúdo
        </Button>
      </div>
    </div>
  );
}
