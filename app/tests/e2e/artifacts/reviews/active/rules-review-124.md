---
review_id: rules-review-124
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 3f362c7
  - e0d2e23
  - d613c6d
  - da0f7da
files_reviewed:
  - app/pages/gm/scenes/[id].vue
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/components/habitat/BudgetGuide.vue
  - app/components/encounter/BudgetIndicator.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-23T07:35:00Z
follows_up: code-review-130
---

## Review Scope

Game logic review of ptu-rule-060 P0 re-review fixes. Focus: whether the M4 fix (PC-only player count) correctly implements PTU Core p.473 encounter budget formula.

## PTU Reference

PTU Core p.473 (Running the Game -- Encounter Design):

> "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] From there, simply multiply the Experience drop by your number of Trainers."

The formula is: `avgPokemonLevel * 2 * numberOfPlayerTrainers = totalLevelBudget`

Key terms:
- **"average Pokemon Level of your PCs"** -- Pokemon owned by player characters, not NPCs
- **"your number of Trainers"** -- the player trainers in the encounter, not all human characters

## Issues

### CRITICAL

#### C1: `characterType === 'pc'` will never match -- budget formula is dead code

**File:** `app/pages/gm/scenes/[id].vue` (line 223)
**Commit:** `d613c6d`

The M4 fix correctly identifies that PTU p.473 counts only player trainers, not NPC characters. However, the implementation filters for `characterType === 'pc'`, which is not a valid value. The `CharacterType` union is `'player' | 'npc' | 'trainer'` (defined in `app/types/character.ts:12`). The Prisma schema also uses `'player'`, `'npc'`, and `'trainer'`.

**Game logic impact:** Because the filter never matches, `playerCount` is always 0, and the function returns `undefined`. The budget display in `StartEncounterModal` never appears. The GM receives no budget guidance when starting encounters from scenes.

The fix intent is correct per PTU rules. The implementation just uses the wrong string literal. The correct value is `'player'`.

**Secondary concern (informational):** The fix correctly narrows `ownedPokemonLevels` to PC-owned Pokemon only (using `playerCharIds` on line 230). This is consistent with PTU p.473 which specifies "average Pokemon Level of your PCs." This part of the fix is sound -- it should remain after the `'pc'` to `'player'` correction.

## What Looks Good

1. **Budget formula implementation in `encounterBudget.ts` is correct.** The `calculateEncounterBudget` function implements `avgLevel * 2 * playerCount` exactly as PTU p.473 specifies. The `calculateEffectiveEnemyLevels` function correctly doubles trainer levels per PTU p.460 XP rules.

2. **`BudgetGuide.vue` extraction preserves correct formula display.** The template string `Lv.{{ effectivePartyContext.averagePokemonLevel }} x 2 x {{ effectivePartyContext.playerCount }} players = {{ budgetTotal }} levels` accurately reflects the PTU budget formula. The formula breakdown is transparent to the GM.

3. **Difficulty thresholds are reasonable.** The `DIFFICULTY_THRESHOLDS` (trivial < 40%, easy < 70%, balanced < 130%, hard < 180%, deadly > 180%) provide a sensible gradient. PTU does not prescribe exact difficulty categories, so these are GM-tool heuristics and are clearly appropriate.

4. **`useEncounterBudget` composable correctly uses encounter sides.** The composable filters player combatants by `side === 'players' && type === 'human'`, which is the correct approach for active encounters where combatant sides are explicitly assigned. This is a separate code path from the scene page's pre-encounter budget estimation, and both approaches are valid for their contexts.

## Verdict

**CHANGES_REQUIRED** -- The M4 fix intent is correct per PTU p.473 (count only player trainers), but the implementation uses the wrong `characterType` value (`'pc'` instead of `'player'`). This causes the budget formula to produce no output for any scene. One-line fix required.

## Required Changes

| ID | Severity | PTU Reference | Description | File(s) |
|----|----------|---------------|-------------|---------|
| C1 | CRITICAL | Core p.473 | Change `characterType === 'pc'` to `characterType === 'player'`. The value `'pc'` does not exist in the `CharacterType` union type. | `app/pages/gm/scenes/[id].vue` (line 223) |
