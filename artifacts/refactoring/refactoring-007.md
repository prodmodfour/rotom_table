---
ticket_id: refactoring-007
priority: P2
categories:
  - EXT-GOD
affected_files:
  - app/composables/useCombat.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
`useCombat.ts` is a 473-line composable that contains 11 unrelated PTU mechanic areas and returns 30+ functions/constants. While well-structured with clear section headers and pure functions, its breadth makes it hard for LLM agents to locate specific mechanics and increases the risk of accidental modifications to unrelated calculations.

## Findings

### Finding 1: EXT-GOD
- **Metric:** 11 responsibility areas, 30+ exports
- **Threshold:** 3+ unrelated responsibilities
- **Impact:** When an LLM agent needs to modify damage calculation, it must read through type effectiveness charts, injury rules, initiative logic, XP formulas, and movement calculations to find the right section. The large return object (lines 416-472) makes it easy to accidentally break destructuring at call sites.
- **Evidence:**
  - Stage multipliers (lines 11-32)
  - HP calculation (lines 39-45)
  - Evasion calculation (lines 53-68)
  - Initiative calculation (lines 74-90)
  - Damage base chart + calculations (lines 96-218)
  - Type effectiveness chart + lookups (lines 242-285)
  - Type immunities (lines 290-308)
  - Injury system (lines 333-356)
  - XP calculation (lines 358-362)
  - Accuracy check (lines 384-392)
  - Action points + movement (lines 398-414)

## Suggested Refactoring
1. Extract `useDamageCalculation.ts` — damage base chart, getSetDamage, calculateDamage, STAB check
2. Extract `useTypeChart.ts` — type effectiveness table, getTypeEffectiveness, getEffectivenessDescription, type immunities
3. Keep remaining small utilities (HP, evasion, initiative, injury, XP, movement) in `useCombat.ts` as a general-purpose PTU utility composable
4. This is lower priority than tickets 001-005 — only pursue if useCombat.ts becomes a change hotspot

Estimated commits: 2-3

## Related Lessons
- none (new finding)

## Resolution Log
- Commits: `5c8a2bb` (extract useDamageCalculation), `d356d00` (extract useTypeChart)
- Files changed:
  - `app/composables/useCombat.ts` — slimmed from 475 to 234 lines (7 focused areas: stages, HP, evasion, initiative, health, injury, XP/action/movement)
  - `app/composables/useMoveCalculation.ts` — updated imports to use all 3 composables
  - `app/components/encounter/DamageSection.vue` — imports from `useDamageCalculation()`
  - `app/components/encounter/MoveButton.vue` — imports from `useTypeChart()`
  - `app/pages/gm/pokemon/[id].vue` — imports from `useDamageCalculation()`
- New files created:
  - `app/composables/useDamageCalculation.ts` (134 lines) — damage base chart, set/rolled damage, full damage calculation pipeline
  - `app/composables/useTypeChart.ts` (88 lines) — type effectiveness chart, immunities, STAB check
- Tests passing: 29/29 unit (useCombat), 414/415 unit total (1 pre-existing settings test failure), 135/135 combat e2e, 40/40 capture e2e
