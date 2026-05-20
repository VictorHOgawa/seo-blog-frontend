# `.claude/` — seo-blog-frontend

Skills e agents que dão suporte à **iniciativa de Hub de Tracking de LPs**. A documentação viva da iniciativa fica em `../docs/tracking/` (raiz do monorepo `seo-blog`).

## Skills (`skills/`)

Invocadas automaticamente quando a tarefa do usuário casa com a `description`, ou explicitamente via `/<nome>`.

| Skill | Para quê |
|---|---|
| `lp-tracking-integration` | Integrar uma LP nova ao hub de tracking (aplica o `PLAYBOOK-NOVA-LP.md`) |
| `lp-event-catalog` | Adicionar/renomear evento de tracking de forma consistente em todo o pipeline |
| `analytics-dashboard-page` | Criar/alterar página do dashboard de analytics seguindo os princípios insight-first |
| `tracking-consent-banner` | Banner de consentimento LGPD + gating de tracking |

## Agents (`agents/`)

Subagentes especializados, invocados via Task.

| Agent | Para quê |
|---|---|
| `lp-tracking-auditor` | Audita o tracking de uma LP e gera relatório de gaps (read-only) |
| `analytics-dashboard-reviewer` | Revisa páginas do dashboard contra os princípios de visualização (read-only) |

## Princípio

Estas skills/agents **não substituem** os documentos vivos de `docs/tracking/` — elas apontam para eles. Se a arquitetura mudar, o doc muda primeiro; a skill só descreve o procedimento. Veja `docs/tracking/README.md`.
