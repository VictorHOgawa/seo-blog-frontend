---
name: lp-tracking-integration
description: >-
  Integra uma landing page (LP) Next.js ao hub central de tracking do seo-blog.
  Use quando o usuário pedir para "plugar tracking", "adicionar tracking", "integrar a LP ao
  hub", "instalar o lib/tracking", configurar captura de eventos/UTM/sessão/consentimento numa LP,
  ou conectar uma LP nova ao dashboard de analytics. Aplica o PLAYBOOK-NOVA-LP.md ao repo atual.
---

# Integrar uma LP ao Hub de Tracking

Esta skill executa o procedimento de integração de tracking numa LP, seguindo o playbook canônico da iniciativa.

## Antes de tudo — leia a fonte da verdade

Os documentos vivos da iniciativa ficam em `docs/tracking/` na raiz do monorepo `seo-blog` (de uma LP, o caminho costuma ser relativo ao repo `seo-blog`; peça o caminho se não encontrar). **Leia, nesta ordem:**

1. `docs/tracking/PLAYBOOK-NOVA-LP.md` — o passo-a-passo que esta skill executa.
2. `docs/tracking/ARQUITETURA-TRACKING.md` §4 — estrutura do `lib/tracking/`.
3. `docs/tracking/CATALOGO-EVENTOS.md` — nomes de evento válidos.
4. `docs/tracking/LICOES-LPS-EXISTENTES.md` — anti-padrões AP1–AP11 a NÃO repetir.

Se esses arquivos não existirem no contexto, peça ao usuário o caminho do repo `seo-blog` antes de prosseguir. **Não invente a arquitetura.**

## Pré-requisitos (verifique e pare se faltar)

- A LP é Next.js 13+ (App Router preferível). Confira `package.json`.
- O backend tem o módulo `tracking` no ar (Fase 1 do `PLANO-TRACKING.md` concluída). Se não, esta integração não pode ser testada ponta-a-ponta — avise o usuário.
- O site está cadastrado no admin com `publicKey`. Se não estiver, oriente cadastrar primeiro.

## Passos

1. **Confirme o branch.** Trabalhe num branch dedicado (ex.: `feat/tracking-hub-integration`). Nunca na branch default.
2. **Instale `src/lib/tracking/`** com os módulos: `client.ts`, `session.ts`, `attribution.ts`, `consent.ts`, `events.ts`, `provider.tsx`, `hooks.ts`, `components/TrackedButton.tsx`, `components/ConsentBanner.tsx`. Use a implementação de referência da Health Voice (`health-voice-institutional-v2`) quando ela existir; até lá, gere a partir de `ARQUITETURA-TRACKING.md §4`.
3. **Env vars:** adicione `NEXT_PUBLIC_TRACKING_ENDPOINT`, `NEXT_PUBLIC_TRACKING_SITE_KEY`, `NEXT_PUBLIC_TRACKING_CONSENT_VERSION` em `.env.local` e liste-as (sem valor) em `.env.example`.
4. **`<TrackingProvider>`** no `app/layout.tsx` root, envolvendo `children`, com `<ConsentBanner />`.
5. **CTAs:** migre cada botão/link crítico para `<TrackedButton>` ou `useTracking()`. Padrão de `elementId`: `<tipo>_<seção>_<verbo>` snake_case.
6. **Formulário de lead:** dispare `form_submit` antes do fetch e `lead_created` + `client.lead()` após sucesso. A API de lead existente da LP continua existindo — o hub recebe em paralelo, não substitui.
7. **Pixels existentes (GTM/Meta/TikTok):** mantenha funcionando. Mova IDs hardcoded para env vars. Não remova.
8. **Validação manual:** rode o checklist do passo 8 do playbook (sessão, evento, UTM, consent gating, replay).

## Edge cases

- **LP não-Next.js:** os módulos de `lib/tracking/` funcionam em qualquer browser; só o `<TrackingProvider>`/hooks são específicos de React. Importe `client.ts` direto. Registre a adaptação no playbook.
- **LP sem formulário de lead:** pule passo 6; ainda assim instale sessão + page_view + cta_click.
- **GTM carregando sem consent:** é violação de LGPD — o gating do passo 4 (ConsentBanner) deve bloquear o script do GTM até `consent.analytics === true`.

## Ao terminar

- Rode o checklist de aceite final do `PLAYBOOK-NOVA-LP.md`.
- Adicione entrada em `docs/tracking/CHANGELOG-TRACKING.md` (`Added`, Fase 2 ou Fase 5).
- Se algum passo precisou ser adaptado, **atualize o `PLAYBOOK-NOVA-LP.md`** — ele só vale se reflete a realidade.

## NÃO faça (anti-padrões — ver LICOES-LPS-EXISTENTES.md)

- ❌ Não crie tabela/endpoint por LP. O `siteId` diferencia (AP1).
- ❌ Não invente nomes de evento — use o catálogo (AP7).
- ❌ Não grave PII em `properties` de evento — só metadados (AP11).
- ❌ Não dispare tracking antes do consentimento (AP9).
