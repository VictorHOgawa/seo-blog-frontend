---
name: tracking-consent-banner
description: >-
  Cria ou customiza o banner de consentimento LGPD (cookies) de uma LP e o gating de tracking.
  Use quando o usuário pedir "banner de cookies", "consentimento LGPD", "aceitar cookies",
  "página de preferências de cookies", ou ajustar quais trackers carregam antes/depois do
  consentimento. Implementa o modelo híbrido (analytics opt-out, marketing opt-in).
---

# Banner de consentimento LGPD + gating de tracking

Nenhuma das LPs antigas tinha consentimento real (anti-padrão AP9). Esta skill implementa o gating correto, no **modelo híbrido** já adotado pela iniciativa.

## Leia primeiro

- `docs/tracking/ARQUITETURA-TRACKING.md` §4.2 — modelo híbrido de consentimento.
- `docs/tracking/PLANO-TRACKING.md` Fase 3 — escopo e critérios de aceite.

## Modelo híbrido (decisão 2026-05-20)

A LGPD admite mais de uma base legal. Em vez de opt-in para tudo:

| Categoria | Cobre | Base legal | Modelo |
|---|---|---|---|
| **analytics** | hub de tracking próprio (dado first-party, IP hasheado) | legítimo interesse | **opt-out** — default ligado |
| **marketing** | GTM / Meta Pixel / TikTok (compartilham com terceiros) | consentimento | **opt-in** — default desligado |

Ou seja: o hub rastreia desde o primeiro hit; o usuário desativa em `/preferencias-cookies`. Os pixels de marketing só carregam após o "Aceitar".

> ⚠️ Não é parecer jurídico. A aplicação da LGPD a cookies não é tão codificada quanto o GDPR — validar com compliance. LP de saúde (dado sensível) pede cautela extra.

## Como o gating funciona

1. **Primeira visita:** `analytics` já roda (opt-out). `marketing` desligado → GTM/pixels **não** carregam. O `<ConsentBanner>` aparece (informativo).
2. **Aceitar** → `marketing: true` → persiste, `POST /tracking/consent`, `<GtmLoader>` injeta o GTM.
3. **Recusar** → `marketing: false` → persiste, `POST /tracking/consent`; analytics segue (opt-out), GTM não carrega.
4. **`/preferencias-cookies`** → toggles para `analytics` e `marketing`; revisão/revogação a qualquer momento. Desligar `analytics` aqui interrompe o envio ao hub.

## Implementação (componentes em `lib/tracking/`)

- `consent.ts` — 2 categorias independentes; `hasAnalyticsConsent()` (default true), `hasMarketingConsent()` (default false), `hasDecided()`, `setConsent()`.
- `client.ts` — gateia `sendSession`/`lead`/`flush` em `hasAnalyticsConsent()`, `mirrorToDataLayer` em `hasMarketingConsent()`; `updateConsent()` persiste + `POST /tracking/consent` + reage.
- `<ConsentBanner>` — informativo (Aceitar / Recusar / Preferências); aparece 1× por `consentVersion`.
- `<GtmLoader>` — injeta o GTM **só** quando `hasMarketingConsent()`; o GTM sai do `layout.tsx`.
- Página `/preferencias-cookies` — toggles.

## Versão do consentimento

`consentVersion` (env `NEXT_PUBLIC_TRACKING_CONSENT_VERSION`). Mudou materialmente o texto/categorias → incremente a versão → o banner reaparece. **Só incremente quando o texto for materialmente diferente** (ver DP5 em PONTOS-ATENCAO-TRACKING.md).

## Validação

Cobrir em `consent.spec.ts` (E2E): banner aparece e some ao decidir; "Recusar" grava `marketing=false` e analytics segue; opt-out por padrão (analytics rastreia sem tocar no banner); GTM só após "Aceitar"; opt-out de analytics em `/preferencias-cookies` para o tracking. Cada decisão gera linha em `tracking_consent_log`.

## NÃO faça

- ❌ Checkbox de consentimento escondido só no formulário, sem banner (AP9).
- ❌ Carregar GTM/Pixel e "desligar" depois — eles têm que **não carregar** antes do opt-in de marketing.
- ❌ Deixar `tracking_consent_log` sem ser escrito (a falha do Inova — decisão D8).
- ❌ Bloquear o `analytics` por opt-in — no modelo híbrido ele é opt-out (legítimo interesse).
