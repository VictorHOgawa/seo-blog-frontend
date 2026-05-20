---
name: tracking-consent-banner
description: >-
  Cria ou customiza o banner de consentimento LGPD (cookies) de uma LP e o gating de tracking.
  Use quando o usuário pedir "banner de cookies", "consentimento LGPD", "aceitar cookies",
  "página de preferências de cookies", ou ajustar quais trackers carregam antes/depois do
  consentimento. Garante que nenhum tracking (próprio ou GTM/Meta) rode antes do opt-in.
---

# Banner de consentimento LGPD + gating de tracking

Nenhuma das LPs antigas tinha consentimento real (anti-padrão AP9). Esta skill implementa o gating correto: nada de tracking antes do opt-in, e a decisão fica auditável.

## Leia primeiro

- `docs/tracking/ARQUITETURA-TRACKING.md` §4.2 — `ConsentManager` e o buffer de eventos pré-consent.
- `docs/tracking/PLANO-TRACKING.md` Fase 3 — escopo e critérios de aceite do consentimento.
- `docs/tracking/CATALOGO-EVENTOS.md` — eventos `consent_*` se existirem.

## Como o gating funciona

1. **Antes da decisão:** o `client.ts` não envia nada. Eventos vão para um buffer em memória (o `ConsentManager`). Scripts de terceiros (GTM, Meta Pixel, TikTok) **não carregam**.
2. **Usuário aceita** (`analytics: true`): persiste o estado em `localStorage`, faz `POST /tracking/consent`, dá flush no buffer, carrega os scripts de terceiros.
3. **Usuário rejeita:** persiste `false`, faz `POST /tracking/consent` (registra a recusa), descarta o buffer, scripts não carregam.
4. **Revogação:** página `/preferencias-cookies` permite mudar a decisão a qualquer momento — novo `POST /tracking/consent`.

## Categorias

- **Essenciais:** sempre ativas (não rastreiam comportamento). Sem opt-in.
- **Analytics:** tracking próprio do hub + GTM. Requer opt-in.
- **Marketing:** Meta Pixel, TikTok, remarketing. Opt-in separado.

## Versão do consentimento

`consentVersion` (env `NEXT_PUBLIC_TRACKING_CONSENT_VERSION`, ex.: `2026-05-19-v1`). Mudou materialmente o texto/categorias do banner → incremente a versão → visitantes recorrentes veem o banner de novo. **Só incremente quando o texto for materialmente diferente** (ver DP5 em PONTOS-ATENCAO-TRACKING.md). Cada `POST /tracking/consent` grava a versão.

## Passos

1. **`<ConsentBanner />`** — componente parametrizável: texto, link da política de privacidade, versão. Renderizado dentro do `<TrackingProvider>`.
2. **Bloqueie scripts de terceiros** até `consent.analytics === true` (GTM) / `consent.marketing === true` (Meta/TikTok). GTM nunca carrega no `layout` de forma incondicional.
3. **Página `/preferencias-cookies`** para revisão e revogação.
4. **Default seguro:** primeira visita = só essenciais. Nenhum tracking sai.

## Validação

- Primeira visita em aba anônima: zero `POST` na aba Network antes de clicar no banner.
- Aceitar: flush do buffer + 1 registro de consent + GTM carrega.
- Rejeitar: nenhum `POST` de evento; 1 registro de consent com `false`.
- Revogar em `/preferencias-cookies`: eventos param.

## Edge cases

- **LP que já tinha GTM hardcoded no layout:** mova para carregamento condicional. Não deixe os dois caminhos.
- **SSR:** o estado de consent só existe no client; trate o flash inicial (banner não deve "piscar" para quem já decidiu — leia `localStorage` no client antes do primeiro paint).
- **Bots/crawlers:** não precisam de banner, mas também não geram consent — ok, simplesmente não rastreados.

## NÃO faça

- ❌ Checkbox de consentimento escondido só no formulário, sem banner (era o "consent" falso das LPs antigas — AP9).
- ❌ Carregar GTM/Pixel e "desligar" depois — eles têm que **não carregar** antes do opt-in.
- ❌ Deixar `tracking_consent_log` sem ser escrito (a falha do Inova — decisão D8).
