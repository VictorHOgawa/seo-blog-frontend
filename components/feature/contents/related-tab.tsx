'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface RelatedItem {
  id: string;
  title: string;
  slug: string;
  locale: string;
  excerpt: string;
  publishedAt: string | null;
  ogImage: { url: string; alt: string } | null;
  contentType: { slug: string; name: string; routePrefix: string };
  score: number;
  sharedTags: string[];
  sharedCategories: string[];
}

export function RelatedTab({ contentId }: { contentId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['related', contentId],
    queryFn: () => api<RelatedItem[]>(`/contents/${contentId}/related?limit=8`),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Posts relacionados sugeridos</h3>
        <p className="text-sm text-muted-foreground">
          Score por tags compartilhadas (×1) e categorias compartilhadas (×2). A LP usa
          esses dados como bloco &ldquo;Posts relacionados&rdquo; ao final do artigo.
        </p>
      </div>

      {isLoading && (
        <Card className="p-6 text-center text-muted-foreground">Calculando…</Card>
      )}

      {!isLoading && data.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          Nenhum post relacionado ainda. Adicione tags/categorias e gere mais conteúdos para
          alimentar a linkagem.
        </Card>
      )}

      <div className="space-y-2">
        {data.map((r, idx) => (
          <Card key={r.id} className="p-3 flex items-center gap-3">
            <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
              {idx + 1}
            </div>
            {r.ogImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.ogImage.url}
                alt=""
                className="w-20 h-12 object-cover rounded shrink-0"
              />
            ) : (
              <div className="w-20 h-12 bg-muted rounded shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/conteudos/${r.id}`}
                className="font-medium truncate hover:underline block"
              >
                {r.title}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {r.contentType.name} · score <strong>{r.score}</strong>
              </p>
              <div className="flex gap-1 flex-wrap mt-1">
                {r.sharedCategories.map((c) => (
                  <Badge key={`c-${c}`} variant="default" className="text-[10px]">
                    cat: {c}
                  </Badge>
                ))}
                {r.sharedTags.map((t) => (
                  <Badge key={`t-${t}`} variant="secondary" className="text-[10px]">
                    #{t}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href={`/conteudos/${r.id}`}>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
