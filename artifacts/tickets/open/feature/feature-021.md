---
id: feature-021
title: Derived Capability Calculations
priority: P2
severity: MEDIUM
status: in-progress
domain: character-lifecycle
source: matrix-gap (Character SG-3)
matrix_source: character-lifecycle R013, R014, R015, R016, R017, R018
created_by: master-planner
created_at: 2026-02-28
---

# feature-021: Derived Capability Calculations

## Summary

Trainer movement capabilities (Overland, Swimming, Throwing Range, Power, High Jump, Long Jump) are not auto-calculated from stats and skills. Values can be stored manually but are not derived from the formulas in PTU. 6 matrix rules (3 Partial, 3 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R013 | Power Capability | Missing — base 4 + Athletics/Combat modifiers not computed |
| R014 | High Jump Capability | Missing — no calculation from Acrobatics |
| R015 | Long Jump Capability | Missing — half Acrobatics rank not computed |
| R016 | Overland Movement Speed | Partial — raw stats stored, `3 + (Athletics+Acrobatics)/2` not implemented |
| R017 | Swimming Speed | Partial — can store manually, half Overland not auto-calculated |
| R018 | Throwing Range | Partial — can store manually, `4 + Athletics rank` not auto-calculated |

## PTU Rules

- Chapter 3/5: Trainer Physical Capabilities
- Overland = 3 + floor((Athletics rank + Acrobatics rank) / 2)
- Swimming = floor(Overland / 2)
- Throwing Range = 4 + Athletics rank
- Power = 4 + Athletics rank modifier
- High Jump = Acrobatics rank / 2
- Long Jump = Acrobatics rank

## Implementation Scope

PARTIAL-scope — can be implemented as computed properties. No design spec needed.

## Affected Areas

- `app/utils/` or `app/composables/` — capability calculation utility
- `app/components/character/` — display computed values
- `app/server/services/combatant.service.ts` — use computed movement for grid

## Resolution Log

### Implementation (2026-03-03)

**Pre-existing utility:** `app/utils/trainerDerivedStats.ts` already implemented all 6 PTU capability formulas correctly (Power, High Jump, Long Jump, Overland, Swimming, Throwing Range). It was already integrated into character display via `CapabilitiesDisplay.vue` and `HumanStatsTab.vue`.

**Gap identified:** The VTT movement system (`combatantCapabilities.ts` and `useGridMovement.ts`) was using hardcoded defaults (Overland=5, Swimming=0) for human combatants instead of computing from trainer skills.

**Commits:**
1. `3912f8da` — `feat: derive human trainer Overland and Swimming speeds from skills`
   - `app/utils/combatantCapabilities.ts`: Updated `getOverlandSpeed`, `getSwimSpeed`, `combatantCanSwim` to compute from skills via `computeTrainerDerivedStats` instead of returning hardcoded defaults
   - Added `getHumanOverlandSpeed` and `getHumanSwimSpeed` private helpers

2. `6d54d85e` — `feat: use derived trainer speeds in VTT grid movement`
   - `app/composables/useGridMovement.ts`: Updated `getTerrainAwareSpeed` to compute human Swimming speed for water terrain; updated `getSpeed` fallback to use `getOverlandSpeed` instead of `DEFAULT_MOVEMENT_SPEED` for humans

**Coverage of matrix rules after fix:**
| Rule | Status |
|------|--------|
| R013 (Power) | Computed — `computeTrainerDerivedStats` in display + utility |
| R014 (High Jump) | Computed — `computeTrainerDerivedStats` in display + utility |
| R015 (Long Jump) | Computed — `computeTrainerDerivedStats` in display + utility |
| R016 (Overland) | Computed — display via `CapabilitiesDisplay.vue`, VTT via `getOverlandSpeed` |
| R017 (Swimming) | Computed — display via `CapabilitiesDisplay.vue`, VTT via `getSwimSpeed`/`combatantCanSwim` |
| R018 (Throwing Range) | Computed — `computeTrainerDerivedStats` in display + utility |

**Downstream consumers automatically fixed** (all call `getOverlandSpeed`/`getSwimSpeed`):
- `mounting.service.ts` — mount movement calculation
- `next-turn.post.ts` — mount movement reset per turn
- `MountControls.vue` — mount speed display
- `useGridMovement.ts` — VTT movement range, speed averaging, terrain-aware speed

### Fix Cycle (2026-03-03) — code-review-298

**HIGH-01: Redundant computeTrainerDerivedStats calls per combatant.**

3. `013d35bd` — `refactor: consolidate redundant computeTrainerDerivedStats calls into getHumanDerivedSpeeds`
   - `app/utils/combatantCapabilities.ts`: Replaced separate `getHumanOverlandSpeed`/`getHumanSwimSpeed` with single exported `getHumanDerivedSpeeds` that calls `computeTrainerDerivedStats` once. Simplified `combatantCanSwim` to return `true` for humans (minimum Swimming >= 2).
   - `app/composables/useGridMovement.ts`: Updated `getMaxPossibleSpeed` hot path to use `getHumanDerivedSpeeds` for human combatants, eliminating 3 redundant derivation calls per movement query.

**MED-01: Unit tests for speed derivation functions.**

4. `908c4c8a` — `test: add unit tests for trainer speed derivation functions`
   - `app/tests/unit/utils/combatantCapabilities.test.ts`: Added 17 test cases covering `getOverlandSpeed`, `getSwimSpeed`, `combatantCanSwim` for both human and Pokemon combatants. Updated `makeHumanCombatant` helper to accept `skills` parameter.

**MED-02: Wrong commit hashes in resolution log.**

5. `039a043c` — `docs: fix incorrect commit hashes in feature-021 resolution log`
   - `artifacts/tickets/open/feature/feature-021.md`: Corrected `f822d987` → `3912f8da` and `311adc9d` → `6d54d85e`.
