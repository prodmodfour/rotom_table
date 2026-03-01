# Design: Pokemon Level-Up Allocation UI

**Design ID:** design-level-up-allocation-001
**Feature Ticket:** feature-007
**Priority:** P1
**Domain:** pokemon-lifecycle
**Status:** p1-implemented
**Created:** 2026-02-28

## Scope

Interactive GM-facing UI for allocating stat points, assigning abilities at milestone levels, and learning moves during Pokemon level-up. Transforms the current informational-only level-up notifications into actionable workflows with PTU rule enforcement.

## Matrix Coverage

| Rule | Title | Tier |
|------|-------|------|
| R027 | Level Up -- Stat Point | P0 |
| R028 | Level Up -- Move Check | P1 |
| R014 | Abilities -- Level 20 | P1 |
| R015 | Abilities -- Level 40 | P1 |

## Priority Tiers

### P0: Stat Point Allocation with Base Relations Validation

- Pure utility: `validateBaseRelations()` (nature-adjusted base stats per decree-035)
- Pure utility: `extractStatPoints()` (reverse-engineer current allocation from DB stats)
- Server endpoint: `POST /api/pokemon/:id/allocate-stats` (validate + apply stat point changes)
- Composable: `useLevelUpAllocation()` (client-side state management for allocation flow)
- Component: `StatAllocationPanel.vue` (interactive stat point allocator with real-time validation)
- Integration: wire `PokemonLevelUpPanel.vue` to show allocation controls after XP gain

### P1: Ability Assignment + Move Learning UI

- Server endpoint: `POST /api/pokemon/:id/assign-ability` (validate ability choice by milestone)
- Server endpoint: `POST /api/pokemon/:id/learn-move` (add move to active set, enforce 6-move max)
- Component: `AbilityAssignmentPanel.vue` (ability picker from species list, filtered by milestone rules)
- Component: `MoveLearningPanel.vue` (new move selection with slot management)
- Composable: extend `useLevelUpAllocation()` with ability/move state
- Integration: wire `LevelUpNotification.vue` action buttons for abilities and moves

## Design Documents

| File | Contents |
|------|----------|
| [shared-specs.md](shared-specs.md) | Existing code analysis, data models, stat point extraction formulas |
| [spec-p0.md](spec-p0.md) | Stat allocation: Base Relations validation, endpoint, UI component |
| [spec-p1.md](spec-p1.md) | Ability assignment at levels 20/40, move learning from learnset |
| [testing-strategy.md](testing-strategy.md) | Unit test plan with specific test cases per tier |

## Key Design Decisions

1. **Base Relations uses nature-adjusted base stats** (decree-035) -- the ordering constraint is derived from species base stats AFTER applying the Pokemon's nature. This matches PTU p.198 ("with a neutral nature...") and the evolution sequence on p.203.

2. **Stat allocation is per-point, not batch** -- the GM allocates one stat point at a time (or uses +/- controls). Real-time Base Relations validation shows which stats are valid targets. This is simpler than the evolution flow (which redistributes all points at once) because level-up only adds 1 point per level.

3. **Existing stat points are extracted, not stored separately** -- stat point allocation is derived from `currentStat - natureAdjustedBaseStat`. No new DB columns needed. This matches the evolution design (shared-specs.md of design-pokemon-evolution-001).

4. **Move learning is optional, not forced** -- PTU says Pokemon "may learn" moves. The UI presents available moves but does not auto-add them. If the Pokemon already has 6 moves, the GM must choose which to replace.

5. **Ability assignment is a one-time action per milestone** -- once the 2nd ability (Level 20) or 3rd ability (Level 40) is assigned, it cannot be re-triggered from the level-up UI. The ability count on the Pokemon record determines eligibility.

6. **Reuses the evolution design's stat recalculation infrastructure** -- `validateBaseRelations()` and `extractStatPoints()` are shared between level-up allocation and evolution stat redistribution. Both features are in the pokemon-lifecycle domain and operate on the same data model.

## Dependencies

- No schema migrations required
- No seed changes required
- Shares validation logic with feature-006 (evolution) -- `validateBaseRelations()` should be extracted to a shared utility if evolution lands first
- `applyNatureToBaseStats()` from `constants/natures.ts` is already available

## Interaction with Evolution (feature-006)

Level-up and evolution both involve stat point allocation with Base Relations validation. Key differences:

| Aspect | Level-Up (this feature) | Evolution (feature-006) |
|--------|------------------------|------------------------|
| Stat points | +1 per level (incremental) | Redistribute all Level+10 points |
| Base stats | Same species, same base | New species, new base |
| Nature | Applied once at creation | Re-applied to new species base |
| Validation | Same Base Relations rule | Same Base Relations rule |
| HP formula | Same: Level + (HP * 3) + 10 | Same formula, new base |

The `validateBaseRelations()` function is identical for both. If evolution ships first, level-up reuses it. If level-up ships first, evolution reuses it.

## Implementation Log

### P0: Stat Point Allocation (2026-02-28)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-28 | 4dd592e | `app/utils/baseRelations.ts` — shared utility: buildStatTiers, validateBaseRelations, getValidAllocationTargets, extractStatPoints, formatStatName |
| 2026-02-28 | 5130701 | `app/utils/evolutionCheck.ts` — refactor to delegate validateBaseRelations to shared utility |
| 2026-02-28 | 43b7f52 | `app/server/api/pokemon/[id]/allocate-stats.post.ts` — stat allocation endpoint with Base Relations enforcement |
| 2026-02-28 | e8b6b0c | `app/composables/useLevelUpAllocation.ts` — reactive allocation state management |
| 2026-02-28 | 09e6025 | `app/components/pokemon/StatAllocationPanel.vue` — interactive stat allocator UI |
| 2026-02-28 | 1460447 | `app/components/pokemon/PokemonLevelUpPanel.vue` + `app/pages/gm/pokemon/[id].vue` — integration with "Allocate Stats" button |
| 2026-02-28 | b546d5b | `app/components/encounter/LevelUpNotification.vue` + SCSS — allocation navigation link |

**Files created:** 4 new files
**Files modified:** 4 existing files
**All P0 acceptance criteria addressed.**

### P0 Fix Cycle (2026-03-01, code-review-229)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-03-01 | 24b84d1 | `app/utils/baseRelations.ts` — add warnings field to extractStatPoints for negative clamping |
| 2026-03-01 | abb33a1 | `app/assets/scss/components/_level-up-notification.scss` — replace hardcoded 4px with $spacing-xs |
| 2026-03-01 | bb3422e | `app/components/pokemon/StatAllocationPanel.vue` — allow partial allocation, add confirmation dialog |
| 2026-03-01 | a1b4337 | `app/tests/unit/utils/baseRelations.test.ts` — 37 unit tests for all baseRelations functions |
| 2026-03-01 | 44e0d46 | `.claude/skills/references/app-surface.md` — add 4 new level-up allocation file entries |

**Addressed:** H1 (unit tests), H2 (docs), M1 (warnings), M2 (partial allocation), M3 (SCSS)

### P1: Ability Assignment + Move Learning (2026-03-01)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-03-01 | d1cd4197 | `app/utils/abilityAssignment.ts` — getAbilityPool() utility with categorizeAbilities() |
| 2026-03-01 | 2669e244 | `app/server/api/abilities/batch.post.ts` — batch ability detail lookup endpoint |
| 2026-03-01 | ef9b9e94 | `app/server/api/pokemon/[id]/assign-ability.post.ts` — ability assignment with milestone validation |
| 2026-03-01 | a20e2ff3 | `app/components/pokemon/AbilityAssignmentPanel.vue` — radio button ability picker with category labels |
| 2026-03-01 | da1fcef5 | `app/server/api/moves/batch.post.ts` — batch move detail lookup endpoint |
| 2026-03-01 | 43d8c40d | `app/server/api/pokemon/[id]/learn-move.post.ts` — move learning with add/replace support |
| 2026-03-01 | c14dbddf | `app/components/pokemon/MoveLearningPanel.vue` — current moves + available moves + replace UI |
| 2026-03-01 | 1d7828fc | `app/composables/useLevelUpAllocation.ts` — extend with pendingAbilityMilestone + pendingNewMoves |
| 2026-03-01 | 555f9b74 | `app/components/encounter/LevelUpNotification.vue` + SCSS — clickable ability/move action buttons |
| 2026-03-01 | dcf67640 | `app/server/api/species/[name].get.ts` — single species lookup for ability pool data |
| 2026-03-01 | 7ea7658e | `app/components/pokemon/PokemonLevelUpPanel.vue` — inline ability/move panels with species fetch |
| 2026-03-01 | 3bbbb00d | `app/components/encounter/XpDistributionResults.vue` — wire ability/move event handlers |

**Files created:** 7 new files
**Files modified:** 5 existing files
**All P1 acceptance criteria addressed.**
