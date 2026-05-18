# seo-blog-frontend

Painel admin Next.js do sistema de publicação SEO multi-site.

> Documentos vivos do projeto inteiro (plano, changelog, runbook, checklist de testes): https://github.com/VictorHOgawa/seo-blog-backend/tree/main/docs

## Stack

- **Next.js 15** (App Router, TS)
- **Tailwind CSS** com tokens shadcn-compatible em `app/globals.css`
- **TanStack Query** (cache + refetch automático)
- **UI primitives próprios** em `components/ui/` (Button, Input, Card, Table, Badge, Dialog, Select)
- **lucide-react** (ícones)
- **zod** (validação de env)

## Setup local

```bash
npm install
cp .env.example .env.local           # já tem default localhost:3333
npm run dev                          # localhost:3000
```

Login padrão (do seed do backend): `admin@seoblog.local` / `123456` — **trocar no primeiro login**.

## Telas

| Rota | Função |
|---|---|
| `/login` | Login (JWT) |
| `/dashboard` | Visão geral: ideias pendentes, revisão pendente, agendados, custo IA, success rate de publicação, gráfico publicações/dia |
| `/ideias` | Importação em lote (CSV/JSON/MD/Paste) + botão Expandir IA |
| `/conteudos` | Lista filtrável |
| `/conteudos/[id]` | Editor com 5 abas (Conteúdo / SEO + Preview / Mídia / Links Internos / Histórico) |
| `/revisao` | Fila de EXPANDED com 1-click Aprovar/Rejeitar |
| `/calendario` | Grid mensal + agendar em lote + reagendar/cancelar |
| `/publicacoes` | Histórico de jobs + Retry |
| `/prompts` | CRUD por field × tipo + playground com custo visível |
| `/custos` | Cards + gráfico por dia + por modelo + últimas 20 + export CSV |
| `/sites` `/content-types` `/users` | Configurações (users só ADMIN) |

## Estrutura

```
app/
├── login/page.tsx
├── (admin)/                         # route group com auth gate
│   ├── layout.tsx                   # AppShell (sidebar + topbar SiteSwitcher)
│   ├── dashboard/                   # visão geral
│   ├── ideias/                      # importação em lote
│   ├── conteudos/[id]/              # editor multi-tab
│   ├── revisao/                     # fila EXPANDED
│   ├── calendario/                  # grid mensal próprio
│   ├── publicacoes/                 # jobs + retry
│   ├── prompts/                     # CRUD + playground
│   ├── custos/                      # dashboard de custo + CSV
│   ├── sites/                       # CRUD tenant
│   ├── content-types/               # CRUD por site
│   └── users/                       # restrito a ADMIN
└── page.tsx                         # redirect /login or /dashboard

components/
├── ui/                              # primitives próprios
├── layout/                          # AppShell, Sidebar, SiteSwitcher
├── providers/                       # Query, Auth, CurrentSite
└── feature/                         # dialogs e componentes complexos
    ├── ideas/                       # BulkImportDialog, IdeaFormDialog
    ├── prompts/                     # PromptFormDialog, PlaygroundDialog
    ├── contents/                    # SeoPreview, RegenerateButton, VersionDiff, RelatedTab
    └── schedule/                    # BulkScheduleDialog

lib/
├── api.ts                           # fetch wrapper + token store
├── auth.ts                          # login/me/logout
├── env.ts                           # zod-validated
├── format.ts                        # formatCostCents, formatTokens, formatDate
├── parsers.ts                       # CSV/JSON/MD/Paste para importação
├── types.ts                         # tipos compartilhados com backend
└── utils.ts                         # cn (clsx + tailwind-merge)
```

## Build / type-check

```bash
npm run build
npm run type-check
```

## Status

✅ Fases 0–12 concluídas.
