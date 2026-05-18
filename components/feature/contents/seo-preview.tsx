'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { Content, Site } from '@/lib/types';

interface Props {
  content: Pick<Content, 'title' | 'slug' | 'metaDescription' | 'excerpt'> & {
    ogImage?: Content['ogImage'];
  };
  site: Pick<Site, 'domain' | 'name'>;
  contentTypeRoute?: string;
}

export function SeoPreview({ content, site, contentTypeRoute = '/blog' }: Props) {
  const host = site.domain ?? 'seudominio.com.br';
  const url = `https://${host}${contentTypeRoute}/${content.slug || 'slug'}`;

  return (
    <div className="space-y-4">
      {/* Google SERP */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Google (SERP)</CardTitle>
        </CardHeader>
        <div className="space-y-1">
          <div className="text-xs text-emerald-700 dark:text-emerald-500">{url}</div>
          <div className="text-lg text-blue-700 dark:text-blue-400 font-medium truncate">
            {content.title || 'Título do post'}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {content.metaDescription ||
              content.excerpt ||
              'Meta description aparece aqui — 150 a 160 caracteres ideais.'}
          </div>
          <div className="text-xs text-muted-foreground pt-1">
            {content.metaDescription.length}/160 caracteres
          </div>
        </div>
      </Card>

      {/* OG / Facebook */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Open Graph (Facebook / LinkedIn)</CardTitle>
        </CardHeader>
        <div className="rounded-md border overflow-hidden">
          {content.ogImage?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.ogImage.url}
              alt={content.ogImage.alt || content.title}
              className="w-full h-48 object-cover bg-muted"
            />
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center text-xs text-muted-foreground">
              sem imagem de capa
            </div>
          )}
          <div className="p-3 bg-muted/40">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">
              {host.toUpperCase()}
            </div>
            <div className="text-sm font-semibold line-clamp-2">
              {content.title || 'Título do post'}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {content.metaDescription || content.excerpt}
            </div>
          </div>
        </div>
      </Card>

      {/* Twitter */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-xs text-muted-foreground font-normal">Twitter / X</CardTitle>
        </CardHeader>
        <div className="rounded-2xl border overflow-hidden">
          {content.ogImage?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.ogImage.url}
              alt={content.ogImage.alt || content.title}
              className="w-full h-44 object-cover bg-muted"
            />
          ) : (
            <div className="w-full h-44 bg-muted flex items-center justify-center text-xs text-muted-foreground">
              sem imagem
            </div>
          )}
          <div className="p-3">
            <div className="text-sm font-medium line-clamp-2">{content.title || 'Título do post'}</div>
            <div className="text-xs text-muted-foreground">{host}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
