---
review_id: code-review-015
target: refactoring-007
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-16
commits_reviewed:
  - 5c8a2bb
  - d356d00
scenarios_to_rerun: []
---

## Review: refactoring-007 — Split useCombat.ts God composable

### Status Table

| Task | Plan | Actual | Status |
|------|------|--------|--------|
| Extract useDamageCalculation.ts | Commit 1 | 5c8a2bb | DONE |
| Extract useTypeChart.ts | Commit 2 | d356d00 | DONE |
| Update consumers | Both commits | DamageSection, MoveButton, gm/pokemon/[id], useMoveCalculation | DONE |
| Keep remaining utilities in useCombat.ts | — | 7 areas remain (234 lines) | DONE |

### Files Reviewed

| File | Lines | Action |
|------|-------|--------|
| `app/composables/useDamageCalculation.ts` | 156 | NEW — damage base chart, set/rolled damage, full calculation pipeline |
| `app/composables/useTypeChart.ts` | 94 | NEW — type effectiveness chart, immunities, STAB |
| `app/composables/useCombat.ts` | 234 | MODIFIED — slimmed from 475 lines |
| `app/composables/useMoveCalculation.ts` | 452 | MODIFIED — imports from all 3 composables |
| `app/components/encounter/DamageSection.vue` | — | MODIFIED — import source changed |
| `app/components/encounter/MoveButton.vue` | — | MODIFIED — import source changed |
| `app/pages/gm/pokemon/[id].vue` | — | MODIFIED — import source changed |

### Issues

None introduced by this refactoring.

**New ticket filed:** refactoring-016 (TEST-STALE) — `useCombat.test.ts` re-implements composable logic locally with wrong formulas (mainline Pokemon multipliers instead of PTU). Tests pass but exercise dead code, providing zero regression coverage. Pre-existing problem, not introduced by this refactoring. See ticket for details.

### What Looks Good

1. **Clean extraction.** Both commits move code verbatim — zero logic changes mixed in. Verified via `git diff` that removed code matches added code byte-for-byte.

2. **Consumer updates are complete.** Grepped for all `useCombat` references — remaining 5 call sites (GroupCombatantCard, PlayerCombatantCard, HealthBar, PokemonCard, useMoveCalculation) all import functions that correctly remain in `useCombat.ts` (health utils, evasion, stages). No stale imports to extracted functions.

3. **Responsibility boundaries are clean.** `useDamageCalculation` owns the damage pipeline (chart → roll/set → full calculation). `useTypeChart` owns type data (effectiveness chart, immunities, STAB). `useCombat` retains cohesive combat utilities (stages, HP, evasion, initiative, health, injury, XP, accuracy, movement). No cross-dependencies between the two extracted composables.

4. **File sizes are good.** All three composables well under 400 lines. The 475→234 reduction on `useCombat.ts` makes it significantly easier for agents to navigate.

5. **Commit granularity is correct.** Two commits, one per extraction, each self-contained and producing a working state.

6. **No backward-compat shims.** `useCombat.ts` doesn't re-export extracted functions — consumers import directly from the new composables. Clean cut.

### Verdict

**APPROVED.** The refactoring is a clean mechanical extraction with no behavioral changes. No regressions possible — e2e tests (135/135 combat, 40/40 capture) provide real coverage of the actual composable code paths. No scenarios need re-running.
