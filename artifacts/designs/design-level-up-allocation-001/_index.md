# Design: Pokemon Level-Up Allocation UI

**Design ID:** design-level-up-allocation-001
**Feature Ticket:** feature-007
**Priority:** P1
**Domain:** pokemon-lifecycle
**Status:** design-complete
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

(Updated during implementation)

| Date | Commit | Description |
|------|--------|-------------|
| | | |
