export type AdminRole = 'ADMIN' | 'EDITOR' | 'REVISOR';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  siteAccess: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  authorName: string;
  toneOfVoice: string;
  defaultLocale: string;
  supportedLocales: string[];
  ogDefaults: Record<string, unknown>;
  indexnowKey: string | null;
  revalidateUrl: string | null;
  revalidateSecret: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { contentTypes: number };
}

export interface ContentType {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  routePrefix: string;
  schemaExtra: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export type IdeaStatus = 'PENDING' | 'EXPANDED' | 'DISCARDED';

export interface Idea {
  id: string;
  siteId: string;
  contentTypeId: string;
  titleSeed: string;
  briefing: string;
  keywords: string[];
  locale: string;
  notes: string;
  status: IdeaStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  contentType?: { id: string; slug: string; name: string };
}

export interface IdeaInput {
  siteId: string;
  contentTypeId: string;
  titleSeed: string;
  briefing?: string;
  keywords?: string[];
  locale?: string;
  notes?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PromptField =
  | 'TITLE'
  | 'SLUG'
  | 'BODY'
  | 'META_DESCRIPTION'
  | 'EXCERPT'
  | 'TAGS'
  | 'CATEGORY'
  | 'IMAGE_PROMPT'
  | 'JSON_LD'
  | 'TRANSLATION';

export interface PromptTemplate {
  id: string;
  siteId: string;
  contentTypeId: string | null;
  field: PromptField;
  locale: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelInfo {
  id: string;
  pricing: { inputPerMTokens: number; outputPerMTokens: number } | null;
}

export interface AiPreviewResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  cached: boolean;
  durationMs: number;
  model: string;
  resolvedSystemPrompt: string;
  resolvedUserPrompt: string;
}

export interface OverviewMetrics {
  ideas: { pending: number; total: number };
  contents: {
    draft: number;
    expanded: number;
    approved: number;
    published: number;
    total: number;
  };
  schedule: { today: number; nextWeek: number };
  publish: {
    publishedLast7Days: number;
    publishedLast30Days: number;
    jobsLast30: number;
    succeededLast30: number;
    failedLast30: number;
    successRate: number | null;
  };
  aiCost: {
    today: { calls: number; costCents: number };
    last7Days: { calls: number; costCents: number };
    last30Days: { calls: number; costCents: number };
  };
}

export interface PublishStats {
  since: string;
  days: number;
  total: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  pending: number;
  successRate: number | null;
  avgDurationMs: number;
  maxDurationMs: number;
  byDay: Array<{ day: string; total: number; succeeded: number; failed: number }>;
}

export interface AiUsageMetrics {
  since: string;
  days: number;
  total: {
    calls: number;
    costCents: number;
    inputTokens: number;
    outputTokens: number;
  };
  byModel: Array<{
    model: string;
    calls: number;
    costCents: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byDay: Array<{ day: string; costCents: number; count: number }>;
  recent: Array<{
    id: string;
    createdAt: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    cached: boolean;
    durationMs: number;
    siteId: string | null;
  }>;
}

export type ContentStatus =
  | 'DRAFT'
  | 'EXPANDED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';

export type MediaSource = 'AI' | 'UPLOAD' | 'EXTERNAL';

export interface MediaAsset {
  id: string;
  siteId: string;
  url: string;
  storageKey: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  sizeBytes: number | null;
  source: MediaSource;
  generationPrompt: string | null;
  model: string | null;
  costCents: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  siteId: string;
  slug: string;
  name: string;
}
export interface Category {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string;
}

export interface Content {
  id: string;
  ideaId: string | null;
  siteId: string;
  contentTypeId: string;
  locale: string;
  sourceContentId: string | null;
  title: string;
  slug: string;
  bodyMd: string;
  excerpt: string;
  metaDescription: string;
  ogImageId: string | null;
  jsonLd: Record<string, unknown>;
  status: ContentStatus;
  version: number;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  ogImage?: MediaAsset | null;
  contentType?: { id?: string; slug: string; name: string; routePrefix?: string };
  tags?: Array<{ tag: Tag }>;
  categories?: Array<{ category: Category }>;
}

export interface ContentVersionRow {
  id: string;
  contentId: string;
  version: number;
  snapshot: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: 'Rascunho',
  EXPANDED: 'Expandido',
  APPROVED: 'Aprovado',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  UNPUBLISHED: 'Despublicado',
  ARCHIVED: 'Arquivado',
};

export type PublishJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface PublishJob {
  id: string;
  contentId: string;
  scheduledFor: string;
  status: PublishJobStatus;
  attempts: number;
  lastError: string | null;
  bullJobId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  content?: {
    id: string;
    title: string;
    slug: string;
    status: ContentStatus;
    ogImage?: { url: string } | null;
    contentType?: { slug: string; name: string };
  };
}

export const PROMPT_FIELDS: { value: PromptField; label: string }[] = [
  { value: 'TITLE', label: 'Título' },
  { value: 'SLUG', label: 'Slug' },
  { value: 'BODY', label: 'Corpo do artigo' },
  { value: 'META_DESCRIPTION', label: 'Meta description' },
  { value: 'EXCERPT', label: 'Resumo / excerto' },
  { value: 'TAGS', label: 'Tags' },
  { value: 'CATEGORY', label: 'Categoria' },
  { value: 'IMAGE_PROMPT', label: 'Prompt de imagem' },
  { value: 'JSON_LD', label: 'JSON-LD' },
  { value: 'TRANSLATION', label: 'Tradução' },
];
