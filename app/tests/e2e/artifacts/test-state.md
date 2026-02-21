---
last_updated: 2026-02-21T22:30:00
updated_by: slave-collector (plan-20260221-071325)
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | **STALE** | done | done | created | 83.0% (73/88) |
| capture | done (33) | **STALE** | done | done | created | 75.0% (18/24) |
| healing | done (42) | **STALE** | done | done | created | 80.0% (24/30) |
| pokemon-lifecycle | done (68) | **STALE** | done | done | created | 75.0% (33/44) |
| character-lifecycle | done (68) | **STALE** | done | done | created | 68.3% (28/41) |
| encounter-tables | done (27) | **STALE** | done | done | created | 64.3% (9/14) |
| scenes | done (42) | **STALE** | done | done | created | 55.6% (10/18) |
| vtt-grid | done (42) | **STALE** | done | done | created | 46.7% (7/15) |

**Overall: 202/274 correct (73.7%) — stale, will increase significantly after re-mapping**

## Active Work

All 8 domains fully processed through M2 ticket creation. Matrix pipeline is **complete** (M7) but all capabilities are stale.

## Staleness Status

All 8 domains are stale due to sessions 5–13 code changes. Re-mapping is now urgent — session 13 added P1 implementations on top of session 12's P0 implementations.

**Session 13 changes (4 P1/P0 implementations + follow-up fixes):**
- **combat:** ptu-rule-045 P1 — DR from armor in damage calc, evasion from shields, Focus stat bonuses, Heavy Armor speed CS (major new capabilities in damage calc + combatant builder + move calculation composable)
- **pokemon-lifecycle:** ptu-rule-055 P1 — XpDistributionModal, encounter store actions, end-encounter integration, xpDistributed safety flag (major new capabilities)
- **character-lifecycle:** ptu-rule-056 P1 — Trainer class constants, ClassFeatureSection, EdgeSelectionSection, useCharacterCreation state management (major new capabilities)
- **encounter-tables:** ptu-rule-058 P0 — Density separated from spawn count, DENSITY_SUGGESTIONS, explicit count spinner, densityMultiplier removed from UI (significant capability change)

**Combined sessions 12+13 impact per domain:**
1. **combat** — Equipment P0+P1: 4 API endpoints, 1 constants file, 1 utility, equipment bonuses in damage calc + combatant builder + move composable + evasion
2. **pokemon-lifecycle** — XP P0+P1: 2 API endpoints, 1 utility, 1 modal component, store actions, end-encounter integration
3. **character-lifecycle** — Char creation P0+P1: 3 constants files, 5 components, 1 composable, 1 validation utility
4. **encounter-tables** — Density P0: type changes, service refactoring, UI changes, store changes

## Audit Correction

- **combat-R010** (evasion CS treatment): Original audit classified as "Approximation" — Game Logic Reviewer (rules-review-102) independently confirmed the implementation was already correct per PTU's two-part evasion system. Audit item should be reclassified as "Correct" on next re-audit.

## Session 14 Changes (additional staleness)

- **combat:** ptu-rule-077 fix — Focus (Speed) stat bonuses now applied to initiative + evasion (combatant.service.ts, useMoveCalculation.ts, useCombat.ts, damageCalculation.ts, calculate-damage endpoint)
- **combat:** ptu-rule-045 P2 — HumanEquipmentTab.vue, EquipmentCatalogBrowser.vue, CharacterModal + GM page wiring
- **encounter-tables:** ptu-rule-060 P0 — encounterBudget.ts utility, useEncounterBudget composable, BudgetIndicator component, GenerateEncounterModal + StartEncounterModal extensions
- **encounter-tables:** ptu-rule-058 P1 fixes — NaN guards, null guard, WS broadcast, utility extraction in SignificancePanel + XpDistributionModal + experienceCalculation.ts
- **pokemon-lifecycle:** ptu-rule-055 P2 — LevelUpNotification.vue, add-experience endpoint, XpDistributionModal level-up integration
- **character-lifecycle:** ptu-rule-056 P2 — BiographySection.vue, useCharacterCreation biography fields, gm/create.vue quick/full-create mode toggle

## Recommended Next Steps

1. Re-map all 8 domains — sessions 12-14 added major new capabilities across combat, pokemon-lifecycle, character-lifecycle, encounter-tables
2. Fix ptu-rule-058 P1 issues from code-review-123 (CHANGES_REQUIRED)
3. Continue P2 implementations: 045 (equipment UI), 055 (level-up notifications), 056 (biographical fields)
4. Review ptu-rule-060 P0 and ptu-rule-077 fix
