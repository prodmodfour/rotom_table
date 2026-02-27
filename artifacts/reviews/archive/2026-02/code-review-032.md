---
review_id: code-review-032
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-024, refactoring-026
domain: code-health
commits_reviewed:
  - 5b5fb0c
  - 860abf3
  - 50ee867
  - 8eaa354
  - 0004898
files_reviewed:
  - app/composables/usePokemonSheetRolls.ts
  - app/components/common/HealingTab.vue
  - app/pages/gm/pokemon/[id].vue
  - app/pages/gm/characters/[id].vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-18T13:00:00
---

## Review Scope

Joint review of refactoring-024 (extract composable + component from pokemon sheet) and refactoring-026 (deduplicate healing tab between pokemon and character sheets). 5 commits across 4 source files and 2 new extractions.

## Verification Performed

1. **Composable correctness (usePokemonSheetRolls.ts:28-137):** Typed interfaces exported (`MoveRollState`, `SkillRollState`). State returned as `readonly()`. Accepts `Ref<Pokemon | null>` — null-safe with early returns. Uses `useDamageCalculation()` composable (DIP). All 6 extracted functions (`rollSkill`, `rollAttack`, `rollDamage`, `getMoveDamageFormula`, `getAttackStat`, plus state) match the original logic in the pre-refactor diff.

2. **Component correctness (HealingTab.vue:128-215):** Props well-typed (`entityType: 'pokemon' | 'character'`, `entityId: string`, `entity: Pokemon | HumanCharacter`). Emits typed `healed` event. Uses `useRestHealing()` composable internally. All 5 handlers (rest, extendedRest, pokemonCenter, healInjury, newDay) delegate to composable and emit `healed` on success — functionally equivalent to the old per-page handlers that called `loadPokemon()`/`loadCharacter()` inline.

3. **Character-only features (HealingTab.vue:35-38, 101-111, 164-183):** Drain AP display, Drain AP heal action, and entity-specific description text all conditionally rendered via `entityType === 'character'`. Matches the original character sheet behavior.

4. **Null safety:** Both parent pages guard content with `v-else-if="pokemon"` (pokemon/[id].vue:35) and `v-else-if="character"` (characters/[id].vue:35), so HealingTab only renders when the entity is non-null. No null guards needed inside the component.

5. **Type safety:** The `as any` casts from refactoring-024 Finding 3 were already absent — `Pokemon` and `HumanCharacter` types both have `restMinutesToday`, `lastInjuryTime`, `injuriesHealedToday` fields (app/types/character.ts:129-131, 190-192). The single `as HumanCharacter` cast for `drainedAp` (HealingTab.vue:149) is correct type narrowing, not an unsafe cast.

6. **No leftover references:** Grepped both page files for all healing-related identifiers (`healingLoading`, `healingInfo`, `lastHealingResult`, `handleRest`, `handleExtendedRest`, `handlePokemonCenter`, `handleHealInjury`, `handleNewDay`, `formatRestTime`) — zero results. Clean removal.

7. **SCSS:** Healing styles removed from both pages and consolidated into HealingTab.vue with scoped styles. Uses correct SCSS variables (`$color-danger`, `$color-success`, `$spacing-*`, `$border-radius-*`).

## Size Reduction

| File | Before | After | Delta |
|------|--------|-------|-------|
| pokemon/[id].vue | 1614 | 1242 | -372 |
| characters/[id].vue | 953 | 680 | -273 |
| **New:** usePokemonSheetRolls.ts | — | 137 | +137 |
| **New:** HealingTab.vue | — | 314 | +314 |
| **Net** | 2567 | 2373 | -194 |

Pokemon sheet breakdown: Script 318 → 145 lines, Template 528 → 428 lines, SCSS 763 → 666 lines. Script responsibilities reduced from 6 to 2 (data loading, edit mode). Remaining SCSS bulk tracked by refactoring-032 (open, P2).

## Issues

### CRITICAL
None.

### HIGH
None.

### MEDIUM
None.

## What Looks Good

- **Commit structure is exemplary.** 5 commits in correct dependency order: extract composable (pure add) → extract component (pure add) → wire pokemon sheet → wire character sheet → update logs. Each intermediate state compiles.
- **HealingTab entity-type branching is clean.** Character-only features (Drain AP display, Drain AP heal action, description variants) handled via a single `entityType` prop with computed descriptions rather than slot-based overrides. Right level of abstraction for the current two entity types.
- **usePokemonSheetRolls returns readonly state.** Prevents template-side mutation of roll results. Good defensive pattern.
- **applyResult helper in HealingTab** eliminates the 5x duplicated `if (result) { lastHealingResult.value = ...; await loadX() }` pattern from the old handlers. Single emit replaces inline parent reload.

## Verdict

APPROVED — Clean extraction refactoring. Both tickets fully addressed (minus the EXT-LAYER `$fetch` finding from refactoring-024, which was a suggested improvement, not a required fix — the remaining 2 responsibilities in the script are within SRP bounds). No behavior changes. No regressions possible from these changes since the extracted code is identical to the original.

## Required Changes

None.

## Scenarios to Re-run

None — pure refactoring with no behavior changes. Healing mechanics are unchanged. Dice rolling is unchanged.
