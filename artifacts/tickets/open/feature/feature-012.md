---
id: feature-012
title: Death & Heavily Injured Automation
priority: P1
severity: HIGH
status: in-progress
domain: combat
source: matrix-gap (combat R076, R080, R081 + healing R016, R030)
matrix_source: combat R076, R080, R081, healing R016, R030
created_by: master-planner
created_at: 2026-02-28
---

# feature-012: Death & Heavily Injured Automation

## Summary

The app tracks injury count and HP thresholds visually but does not automate the mechanical consequences. No death check at 10 injuries or extreme negative HP. No heavily injured penalty automation. 5 matrix rules across combat and healing domains.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R076 | Heavily Injured — 5+ Injuries | combat | Implemented — auto HP loss on damage and Standard Action |
| R080 | Death Conditions | combat | Implemented — auto death check at 10 injuries or HP threshold |
| R081 | Death — League Exemption | combat | Implemented — HP-based death suppressed in League mode |
| R016 | Heavily Injured Combat Penalty | healing | Implemented — same as combat R076 |
| R030 | Death from 10 Injuries | healing | Implemented — same as combat R080 |

## PTU Rules

- Chapter 7: Heavily Injured (5+ injuries) — HP loss equal to injury count on Standard Action or when taking damage
- Death at: 10+ injuries OR current HP <= min(-50, -200% maxHp)
- League Battles: death rules suppressed, faint at 0 HP instead
- GM can suppress death for narrative reasons

## Implementation Scope

PARTIAL-scope — checks and warnings can be added without a full design spec. Could be implemented as server-side validation + client warnings.

## Resolution Log

### Branch: slave/4-dev-feature-012-20260228-173500

| Commit | Description |
|--------|-------------|
| a2950ce | Pure utility functions: checkHeavilyInjured, checkDeath, applyHeavilyInjuredPenalty, calculateDeathHpThreshold |
| b99be5a | Add 'Dead' status condition to type system and constants |
| 1a368b5 | Hook heavily injured penalty + death check into damage.post.ts |
| 0f3d012 | Apply heavily injured HP penalty on turn end in next-turn.post.ts |
| 392629f | Add heavily injured penalty + death check to move.post.ts (duplicate code path) |
| 14dd1ec | Add heavily injured warning and death indicator to CombatantCard UI |
| 9b9ca2a | Update encounter store applyDamage to expose death/injury results |
| e61f1ce | Show GM alerts for heavily injured penalty and death events |
| 1128210 | Unit tests for all utility functions |

### Files Changed

**New files:**
- `app/utils/injuryMechanics.ts` — Pure utility functions for heavily injured and death checks
- `app/tests/unit/utils/injuryMechanics.test.ts` — Unit tests

**Modified files:**
- `app/types/combat.ts` — Added 'Dead' to StatusCondition union type
- `app/constants/statusConditions.ts` — Added 'Dead' to OTHER_CONDITIONS and CSS class map
- `app/server/api/encounters/[id]/damage.post.ts` — Heavily injured penalty + death check after damage
- `app/server/api/encounters/[id]/next-turn.post.ts` — Heavily injured penalty on Standard Action (turn end)
- `app/server/api/encounters/[id]/move.post.ts` — Heavily injured penalty + death check for move damage path
- `app/components/encounter/CombatantCard.vue` — Heavily Injured warning, Dead badge, GM override button
- `app/stores/encounter.ts` — applyDamage returns death/injury result data
- `app/composables/useEncounterActions.ts` — GM alert notifications for death and heavily injured
