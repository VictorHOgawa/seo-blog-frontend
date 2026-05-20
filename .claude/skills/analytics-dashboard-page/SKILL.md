---
name: analytics-dashboard-page
description: >-
  Cria ou altera uma página/visualização no dashboard de analytics do seo-blog-frontend
  (rota (admin)/analytics). Use quando o usuário pedir uma "tela de dashboard", "gráfico de
  tracking", "visualização de leads/funil/atribuição", "página de analytics", ou um novo card/
  métrica no painel de tracking. Garante que a visualização siga os princípios insight-first.
---

# Criar/alterar página do dashboard de analytics

O dashboard de analytics é o motivo da iniciativa existir: transformar dados de tracking em decisão comercial. As LPs antigas capturavam bem e visualizavam mal — esta skill evita repetir isso.

## Leia primeiro — obrigatório

- `docs/tracking/ARQUITETURA-TRACKING.md` §7 — **Princípios de visualização** (8 princípios). Não pule.
- `docs/tracking/LICOES-LPS-EXISTENTES.md` — anti-padrões AP2, AP3, AP4 (dashboard clonado por LP, tabela crua sem insight, agregação no client).
- `docs/tracking/PLANO-TRACKING.md` Fase 4 — escopo e critérios de aceite das telas.

## Princípios que esta skill faz cumprir

1. **Insight-first.** A tela responde uma pergunta de negócio (caiu? de onde vem? onde vaza?). Tabela crua é drill-down, nunca a tela principal.
2. **Comparação sempre.** Todo número grande tem variação vs. período anterior (▲▼ %). Número solo é proibido.
3. **Agregação no backend.** A página consome um endpoint `/admin/analytics/*` que já devolve dado resumido. **Nunca** baixe log cru e agregue no browser.
4. **Um dashboard, N sites.** O filtro é `siteId` via seletor. Zero código específico por LP. Site novo aparece sozinho.
5. **Estados explícitos:** `loading` (skeleton), `empty` ("site sem dados — verifique a integração"), `error` (retry).
6. **Cada tela cabe numa decisão.** Métrica de vaidade fica no rodapé ou fora.

## Passos

1. **Defina a pergunta de negócio** que a tela responde. Se não há uma, não crie a tela.
2. **Endpoint backend.** Verifique se já existe um `/admin/analytics/*` que serve o dado. Se não, isso é trabalho no `seo-blog-backend` — use a skill `analytics-query` lá. A página não nasce antes do endpoint.
3. **Rota.** Crie em `app/(admin)/analytics/...`. Mantenha separado de `(admin)/dashboard/` (operacional do CMS).
4. **Filtros padrão:** seletor de site (respeitando `siteAccess`/role do usuário) + range de datas (7d/30d/90d/custom). Reutilize os componentes de filtro se já existirem.
5. **Charts:** use `recharts` (decisão DP1 — confirme em PONTOS-ATENCAO-TRACKING.md se já foi ratificada). Line para tendência, bar para ranking, funil para conversão.
6. **Data fetching:** server component ou React Query, conforme o padrão já usado no painel admin. Respeite o filtro de role (`REVISOR` read-only, etc.).
7. **Estados:** implemente loading/empty/error antes de considerar a tela pronta.

## Telas previstas (Fase 4) — não duplicar

`/analytics` (overview), `/analytics/funil`, `/analytics/atribuicao`, `/analytics/leads`, `/analytics/eventos`. Antes de criar, cheque se a tela pedida já é uma dessas.

## Edge cases

- **Site sem nenhum dado:** empty state claro, com link para o playbook de integração.
- **Range muito grande (90d) lento:** o endpoint deve paginar/limitar; se a tela travar, o problema é no backend (agregação), não na tela.
- **Comparar sites:** é first-class — a tela de overview deve permitir multi-seleção de site.

## NÃO faça

- ❌ Tela cujo conteúdo principal é tabela de sessões cruas (AP3).
- ❌ Baixar todos os eventos e `reduce` no client (AP4).
- ❌ Código/rota específicos por LP (AP2).
- ❌ Card com número sem comparação.

## Ao terminar

- Considere rodar o agent `analytics-dashboard-reviewer`.
- Entrada em `docs/tracking/CHANGELOG-TRACKING.md`.
