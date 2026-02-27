---
review_id: rules-review-120
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 9f43e79
  - 107cc67
  - 1c4a6cc
  - 6fcd1d7
  - 65e5b77
  - 05f5847
  - 2b887de
mechanics_verified:
  - encounter-budget-formula
  - player-count-definition
  - trainer-double-xp
  - average-pokemon-level
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#Page 473
  - core/11-running-the-game.md#Page 460
reviewed_at: 2026-02-22T04:30:00Z
follows_up: rules-review-114
---

## Mechanics Verified

### Encounter Budget Formula (Core p.473)

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter." (`core/11-running-the-game.md#Page 473`)
- **Implementation:** `calculateEncounterBudget()` in `app/utils/encounterBudget.ts:130-146` computes `baselinePerPlayer = avgLevel * 2` then `totalBudget = baselinePerPlayer * players`. The field was renamed from `baselineXpPerPlayer` to `levelBudgetPerPlayer` in commit `9f43e79`, which better reflects that this is a level budget, not an XP value.
- **Verification:** PTU example -- three Level 10 Trainers, Pokemon around Level 20. Budget = 20 * 2 * 3 = 120. Code produces `totalBudget: 120`, `levelBudgetPerPlayer: 40`. The renamed field clarifies the distinction between the level-budget-per-player (used for encounter design) and the actual XP (which only exists after applying significance multiplier). The JSDoc now reads "Level budget per player: averagePokemonLevel * 2" which is accurate.
- **Status:** CORRECT

### Player Count Definition -- Composable Fix (Core p.460)

- **Rule:** "Divide by the number of Players -- not the number of Pokemon." (`core/11-running-the-game.md#Page 460`)
- **Implementation (before fix):** `useEncounterBudget.ts:25` filtered `c.side === 'players'`, which included both human trainers AND their Pokemon combatants on the players side.
- **Implementation (after fix, commit `107cc67`):** Now filters `c.side === 'players' && c.type === 'human'`, correctly counting only human trainers. Comment references PTU p.460 explicitly.
- **Verification:** A party of 3 trainers each with 2 Pokemon on the players side: before fix would yield `playerCount = 9` (wrong), after fix yields `playerCount = 3` (correct). Budget with avgLevel 20: before = 20 * 2 * 9 = 360 (3x inflated), after = 20 * 2 * 3 = 120 (matches PTU example).
- **Status:** CORRECT

### Trainer Double XP Rule (Core p.460)

- **Rule:** "Total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** Unchanged from original P0. `calculateEffectiveEnemyLevels()` applies `enemy.isTrainer ? enemy.level * 2 : enemy.level`. No fix commits modified this logic.
- **Status:** CORRECT (unchanged, previously verified in rules-review-114)

### Average Pokemon Level Computation -- Scene Page (Core p.473)

- **Rule:** "multiply the average Pokemon Level of your PCs by 2" (`core/11-running-the-game.md#Page 473`)
- **Implementation (commit `6fcd1d7`):** The new `budgetInfo` computed in `app/pages/gm/scenes/[id].vue:216-252` computes `averagePokemonLevel` by:
  1. Getting scene character IDs (`sceneCharIds`)
  2. Filtering `allPokemon` by `ownerId` matching scene character IDs
  3. Computing `Math.round(sum / count)` of those Pokemon levels
  4. Passing to `analyzeEncounterBudget({ averagePokemonLevel, playerCount }, enemies)`
- **Assessment:** The `/api/pokemon` endpoint defaults to `isInLibrary: true`, so archived Pokemon are excluded from the average. The PTU text says "average Pokemon Level of your PCs" which is intentionally vague -- using all non-archived owned Pokemon is a reasonable GM-facing estimate for encounter design. The `Math.round()` rounding is acceptable since PTU doesn't specify rounding behavior for the average.
- **Status:** CORRECT

### GenerateEncounterModal Budget Guide -- Manual Input (Commit `65e5b77`)

- **Rule:** Same budget formula as above.
- **Implementation:** When no `partyContext` prop is provided (habitat pages, encounter-tables page), the modal now shows manual inputs for "Avg Pokemon Lv." and "Players". The `effectivePartyContext` computed falls back to manual input values with proper `> 0` guards. Budget formula display shows `Lv.X x 2 x Y players = Z levels`, matching the PTU formula directly.
- **Assessment:** This is a UI-only change that makes the budget guide accessible from all modal consumers. The underlying formula is identical -- `calculateEncounterBudget(effectivePartyContext.value)` calls the same pure function. The manual input approach correctly handles the case where scene context is unavailable.
- **Status:** CORRECT

## Summary

All 5 issues from code-review-124 (CHANGES_REQUIRED) have been properly addressed:

| Issue | Severity | Resolution |
|-------|----------|------------|
| C1: Unreachable UI | CRITICAL | Fixed. `budgetInfo` computed added to `[id].vue` (commit `6fcd1d7`), wired to `StartEncounterModal`. `GenerateEncounterModal` now has manual party inputs as fallback (commit `65e5b77`). |
| H1: app-surface.md | HIGH | Fixed. Budget system files added to app-surface.md (commit `05f5847`). |
| H2: Duplicate styles | HIGH | Fixed. Shared `_difficulty.scss` partial with `difficulty-text-colors` and `difficulty-bg-colors` mixins (commit `1c4a6cc`). `$color-neutral` variable replaces hardcoded `#9e9e9e`. Both components now use `@include` instead of inline rules. |
| M1: playerCount bug | MEDIUM | Fixed. `useEncounterBudget.ts:26` now filters `c.side === 'players' && c.type === 'human'` (commit `107cc67`). |
| M2: Naming | MEDIUM | Fixed. `baselineXpPerPlayer` renamed to `levelBudgetPerPlayer` with updated JSDoc (commit `9f43e79`). |

The core PTU formulas remain correctly implemented:
- Budget: `averagePokemonLevel * 2 * playerCount` (Core p.473)
- Trainer double XP: `isTrainer ? level * 2 : level` (Core p.460)
- XP: `effectiveLevels * significanceMultiplier / playerCount` (Core p.460)

No errata modifies the encounter budget guidelines or XP calculation rules.

## Rulings

1. **M2 rename from `baselineXpPerPlayer` to `levelBudgetPerPlayer` is PTU-correct.** The PTU text describes this number as "the number of Levels you have to work with to build your encounter" (p.473), which is a level budget, not an XP value. While PTU also calls it "a projected baseline Experience drop per player", the level-budget framing better distinguishes it from the actual XP calculated by `calculateEncounterXp()`. RULING: Rename improves PTU terminology alignment.

2. **M1 player count filter fix is PTU-correct.** PTU p.460 explicitly states "Divide by the number of Players -- not the number of Pokemon." The fix correctly limits `playerCount` to human trainers. RULING: Implementation now matches rule.

3. **C1 scene page `budgetInfo` computation is PTU-correct.** The `averagePokemonLevel` is computed from non-archived Pokemon owned by scene characters, and `playerCount` is the number of scene characters. The formula `avgLevel * 2 * playerCount` is applied via `analyzeEncounterBudget()`. RULING: Implementation matches rule, with one MEDIUM observation (see issues).

4. **C1 GenerateEncounterModal manual inputs are PTU-correct.** The manual input fallback applies the same `calculateEncounterBudget()` function. The formula display `Lv.X x 2 x Y players = Z levels` accurately represents the PTU guideline. RULING: Implementation matches rule.

## Issues

### MEDIUM-1: Scene page `budgetInfo` counts all scene characters as players (including NPCs)

**File:** `app/pages/gm/scenes/[id].vue:222`
**Rule:** "multiply the Experience drop by your number of Trainers" (Core p.473) -- in context, "Trainers" means PCs (player characters), not NPCs.
**Code:**
```typescript
const sceneCharIds = scene.value.characters.map(c => c.characterId)
const playerCount = sceneCharIds.length
```
**Problem:** Scene characters include all `HumanCharacter` records added to the scene, regardless of `characterType` (`'player'`, `'npc'`, or `'trainer'`). If the GM adds NPC characters to a scene alongside player characters, the `playerCount` will be inflated. For example, a scene with 3 players and 2 NPCs would yield `playerCount = 5`, producing a budget of `avgLevel * 2 * 5` instead of the correct `avgLevel * 2 * 3`.

**Nuance:** The `allCharacters` array already has `characterType` available (fetched at line 273). The fix would be to cross-reference scene character IDs with `allCharacters` to filter only those with `characterType === 'player'`. However, this edge case only manifests when a GM deliberately adds NPC characters to a scene AND uses the budget display to design the encounter. Most scenes will only contain player characters for budget purposes.

**Additionally:** The `ownedPokemonLevels` computation would also include NPC-owned Pokemon in the average, which could skew the average level if NPC Pokemon have significantly different levels than player Pokemon.

**Suggested fix:** Filter scene characters to only count player-type characters:
```typescript
const playerCharIds = scene.value.characters
  .map(c => c.characterId)
  .filter(id => allCharacters.value.find(ac => ac.id === id)?.characterType === 'player')
const playerCount = playerCharIds.length
```

**Severity:** MEDIUM (edge case requiring NPCs in scene, budget is advisory not mechanical)

## Verdict

**APPROVED** -- All 5 issues from code-review-124 have been properly resolved. The core PTU budget formula, player count definition, trainer double-XP rule, and XP calculation all remain correctly implemented. The one new MEDIUM issue (NPC characters inflating scene player count) is an edge case that does not affect the typical workflow and the budget display is advisory guidance, not a mechanical enforcement. This should be addressed in P1/P2 but does not block P0 approval.

## Required Changes

**Before P1/P2 (not blocking P0):**

1. **Filter scene characters by `characterType === 'player'` for budget calculation** -- cross-reference `scene.value.characters` with `allCharacters` to exclude NPC characters from `playerCount` and from the average Pokemon level computation in `pages/gm/scenes/[id].vue`. This prevents inflated budgets when NPCs are present in a scene.
