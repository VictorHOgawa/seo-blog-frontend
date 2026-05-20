---
name: lp-event-catalog
description: >-
  Adiciona, renomeia ou remove um evento de tracking de forma consistente em todo o pipeline.
  Use quando o usuário pedir para "criar um evento de tracking", "rastrear um novo clique/ação",
  "adicionar evento ao catálogo", renomear um evento existente, ou quando perceber tracking de uma
  ação que ainda não tem evento canônico. Mantém CATALOGO-EVENTOS.md, events.ts e o DTO do backend
  em sincronia.
---

# Adicionar / alterar evento no catálogo de tracking

Evento de tracking é contrato compartilhado entre LP, backend e dashboard. Mudar em um lugar só quebra os outros. Esta skill garante a mudança atômica nos 3 pontos.

## Leia primeiro

- `docs/tracking/CATALOGO-EVENTOS.md` — catálogo + convenções de naming. **Fonte da verdade.**
- `docs/tracking/ARQUITETURA-TRACKING.md` §4.3 — o tipo `TrackingEvent` em `events.ts`.

## Regras de naming (não negociáveis)

- Evento: `snake_case`, formato `<objeto>_<verbo>` (`cta_click`, `form_submit`). Verbo no presente curto.
- `elementId`: `snake_case`, `<tipo>_<seção>_<verbo>` (`cta_hero_demo`).
- `properties`: camelCase, primitivos, **sem PII**, < 2KB.
- Sem prefixo de produto no nome — contexto vai em `properties` ou no `siteId`.

## Decisão: canônico ou específico de LP?

- **Canônico** (servirá ≥80% das LPs futuras): vai na seção principal do catálogo + no DTO do backend.
- **Específico de LP**: vai na seção `[lp:slug]` do catálogo; o backend aceita só do `siteId` correspondente.

## Passos para ADICIONAR um evento

1. **Catálogo primeiro.** Adicione a entrada em `CATALOGO-EVENTOS.md`: nome, `elementId` esperado, `properties` com tipos, "quem dispara", observações. Evento sem entrada no catálogo não existe.
2. **`events.ts` da LP.** Adicione o membro ao union type `TrackingEvent`.
3. **DTO do backend** (só se canônico). Atualize o schema Zod em `tracking` (`event.dto.ts`) com a validação de `properties` para esse `name`. Isto é uma mudança no `seo-blog-backend` — se você está numa LP, sinalize que essa parte precisa ser feita lá.
4. **Dispare o evento** no componente, via `useTracking()` ou `<TrackedButton>`.
5. **CHANGELOG.** Entrada `Added (event)` em `docs/tracking/CHANGELOG-TRACKING.md`.

## Passos para RENOMEAR (perigoso)

Renomear evento quebra dashboard histórico e atribuição. **Prefira não renomear.** Se for inevitável:

1. Confirme com o usuário que o histórico daquele evento pode "quebrar" no dashboard.
2. Atualize catálogo, `events.ts`, DTO — todos juntos.
3. Considere manter o nome antigo aceito no backend por um período (alias) e migrar o dashboard.
4. CHANGELOG com tipo `Changed` + nota explícita sobre impacto no histórico.

## Edge cases

- **Mudou só o shape do `properties`, não o nome:** não renomeie. Incremente `schemaVersion` no client e trate as duas versões no backend.
- **Evento de debug temporário:** prefixe `debug_` e remova antes do merge — não polua o catálogo.
- **Dúvida sobre o nome:** pare e alinhe com o usuário antes de codar. Nome errado é caro de corrigir.

## NÃO faça

- ❌ Não use string crua de evento espalhada pelo código — sempre via `events.ts` (AP7 de LICOES-LPS-EXISTENTES.md).
- ❌ Não coloque valores de campos de formulário em `properties` (AP11).
