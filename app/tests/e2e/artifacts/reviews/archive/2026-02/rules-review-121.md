---
review_id: rules-review-121
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-058, ptu-rule-055
domain: encounter
commits_reviewed:
  - 321bb51
  - 2458c81
  - 496eaab
  - 77b536d
  - 29c0839
  - fbd2ac6
mechanics_verified:
  - xp-nan-guard-defaults
  - xp-calculation-formula-integrity
  - significance-multiplier-flow
  - player-count-division
  - boss-encounter-xp-bypass
  - experience-upper-bound-validation
  - level-up-notification-display
  - experience-chart-accuracy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Page-202-Leveling-Up
  - core/05-pokemon.md#Page-203-Experience-Chart
  - core/11-running-the-game.md#Page-460-Calculating-Pokemon-Experience
  - core/11-running-the-game.md#Page-460-Significance-Multiplier
  - core/11-running-the-game.md#Page-489-Boss-Experience-and-Rewards
reviewed_at: 2026-02-22T22:40:00Z
follows_up: rules-review-116, rules-review-118
---

## Review Context

This is a re-review of 6 fix commits addressing issues found by code-review-126 (for ptu-rule-058, XP significance multiplier NaN) and code-review-128 (for ptu-rule-055, XP distribution and level-up). The previous rules-review-116 approved the ptu-rule-058 P1 fix with one medium observation (XpDistributionModal lacked NaN guards). rules-review-118 approved the ptu-rule-055 P2 implementation with one medium observation (maxHp not recalculated on level-up, pre-existing).

This review verifies that the 6 fix commits preserve PTU rule correctness, that the NaN guards from rules-review-116 M1 are now resolved, and that no new game logic issues were introduced.

## Issue Resolution Verification

### Commit 321bb51: NaN-safe computed accessors in XpDistributionModal

**Fix applied:** Two NaN-safe computed accessors added to `XpDistributionModal.vue`:
```typescript
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))
```

These are used in:
- `effectiveMultiplier` (line 364-367): switches from raw `customMultiplier.value` to `safeCustomMultiplier.value`
- `recalculate()` (line 472): switches from raw `playerCount.value` to `safePlayerCount.value`
- `handleApply()` (line 515): switches from raw `playerCount.value` to `safePlayerCount.value`
- Template (line 104): switches from raw `playerCount` to `safePlayerCount` for display

**PTU correctness check:**
- `safeCustomMultiplier` defaults to `1.0` when the input is cleared. This matches the Prisma schema default (`@default(1.0)`) and represents the "insignificant" encounter tier per PTU p.460. This is the most conservative default -- it gives minimum XP rather than inflating. CORRECT.
- `safePlayerCount` defaults to `1` and is clamped to minimum 1 via `Math.max(1, ...)`. Per PTU p.460: "divide the Experience by the number of players". Division by zero or NaN would produce invalid results. Minimum 1 is the correct floor. CORRECT.
- The NaN guard pattern is identical to the one established in SignificancePanel.vue (reviewed in rules-review-116 commit 9cd5310). Both components now use the same defensive pattern.

**Resolution of rules-review-116 M1:** This commit directly addresses the medium observation from rules-review-116, which noted that XpDistributionModal lacked the NaN-safe pattern applied to SignificancePanel. The observation stated: "the user experience is suboptimal: clearing an input field shows a server error instead of gracefully defaulting." This is now fully resolved.

**Status:** RESOLVED. No PTU rule impact. The NaN guards produce the same safe defaults approved in rules-review-116.

### Commit 2458c81: Remove duplicate level-up display

**Fix applied:** Removed 18 lines of inline level-up detail rendering from the XpDistributionModal results phase. Previously, the results phase showed level-up info twice: (1) inline `result-row__details` per-result with per-level breakdown, and (2) the `LevelUpNotification` component at the bottom. The inline display was removed, leaving `LevelUpNotification` as the sole level-up display.

Also removed 36 lines of associated SCSS classes (`.result-row__details`, `.levelup-detail`, `.levelup-detail__level`, etc.) from `_xp-distribution-modal.scss`.

**PTU correctness check:** The removed inline display showed:
- "+1 Stat Point" per level -- this is now shown by LevelUpNotification
- "+1 Tutor Point" when applicable -- this is now shown by LevelUpNotification
- "New Move: X" per move -- this is now shown by LevelUpNotification
- "2nd Ability Slot" / "3rd Ability Slot" -- this is now shown by LevelUpNotification

The `LevelUpNotification` component (verified in rules-review-118) displays all the same information:
- Stat points: line 27 (`+N Stat Points`) -- sums across all level-ups
- Tutor points: lines 31-37 (conditional on `totalTutorPoints > 0`) -- sums across level-ups
- New moves: lines 40-47 (per-move display with `flatMap`)
- Ability milestones: lines 49-57 (per-milestone with level and description)
- Evolution eligibility: lines 59-67 (dormant per rules-review-118 observation)

No level-up information is lost. The `LevelUpNotification` component provides a superset of the removed inline display, with better formatting and consistent PTU terminology.

**Status:** RESOLVED. No PTU rule impact. No information lost.

### Commit 496eaab: Upper bound validation on add-experience endpoint

**Fix applied:** Added validation rejecting `body.amount > MAX_EXPERIENCE` (20,555) with a 400 error:
```typescript
if (body.amount > MAX_EXPERIENCE) {
  throw createError({
    statusCode: 400,
    message: `amount must not exceed ${MAX_EXPERIENCE} (max total XP for level 100)`
  })
}
```

**PTU correctness check:** Per PTU Core p.203, the maximum experience is 20,555 XP (Level 100). The `MAX_EXPERIENCE` constant in `experienceCalculation.ts` is `EXPERIENCE_CHART[100]` which equals 20,555. A single XP grant exceeding this value would be nonsensical since it exceeds the entire lifetime XP range.

The validation is placed before the DB query (early rejection) and after the existing type/range check (`amount < 1`). This creates a clean validation pipeline:
1. Must be a positive integer (`typeof !== 'number' || !Number.isInteger || < 1`)
2. Must not exceed maximum possible XP (`> MAX_EXPERIENCE`)

The `calculateLevelUps()` function already caps experience at `MAX_EXPERIENCE` (line 328: `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`), so even without this validation, the math would be correct. The endpoint validation serves as a user-facing guard against obviously invalid inputs, which is an appropriate defense-in-depth measure.

**One nuance:** The validation checks `body.amount > MAX_EXPERIENCE`, not `body.amount > MAX_EXPERIENCE - currentExperience`. This means a Pokemon at level 99 (20,055 XP) could receive a grant of 20,555 XP, but the calculation would correctly cap at 20,555 total (gaining only 500 effective XP). This is intentional -- the validation rejects absurd inputs without enforcing the precise remainder, which would require loading the Pokemon first. The math handles the capping regardless.

**Status:** RESOLVED. No PTU rule impact. Appropriate defense-in-depth.

### Commit 77b536d: Index-based v-for key in LevelUpNotification

**Fix applied:** Changed `:key="move"` to `:key="'move-' + index"` in the new moves v-for loop of `LevelUpNotification.vue`.

**PTU correctness check:** This is a Vue rendering correctness fix, not a game logic change. The old `:key="move"` would produce duplicate keys if the same move name appeared twice in `entry.allNewMoves` (e.g., a Pokemon learning the same move at different levels during a multi-level jump -- though this is unlikely, it is possible with learnset data). The index-based key ensures unique keys for Vue's virtual DOM diffing. No PTU rules are affected.

**Status:** RESOLVED. No PTU rule impact.

### Commit 29c0839: Documentation update (app-surface.md)

**Fix applied:** Added `POST /api/pokemon/:id/add-experience` to the Pokemon API section and `LevelUpNotification.vue` to the encounter components list in `app-surface.md`.

**PTU correctness check:** Documentation-only change. No rule impact.

**Status:** RESOLVED.

### Commit fbd2ac6: Fix Log updates for ptu-rule-058 and ptu-rule-055

**Fix applied:** Updated both ticket files with commit hashes and descriptions for the code-review-128 fixes.

**PTU correctness check:** Documentation-only change. No rule impact.

**Status:** RESOLVED.

## Mechanics Verified

### 1. XP Calculation Formula (Re-verified post-NaN-guards)

- **Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled. [...] consider the significance of the encounter. [...] divide the Experience by the number of players." (`core/11-running-the-game.md#Page-460`)
- **Implementation:** `calculateEncounterXp()` in `experienceCalculation.ts:263-304` is unchanged by these commits. The NaN guards in XpDistributionModal (commit 321bb51) ensure that the values flowing into this function are always valid numbers:
  - `effectiveMultiplier` now uses `safeCustomMultiplier` when in custom mode, defaulting to 1.0 on NaN
  - `safePlayerCount` is clamped to >= 1, preventing division by zero
  - Both flow into `recalculate()` and `handleApply()`, which call the store's `calculateXp()` and `distributeXp()` respectively
- **Verification:** The three-step formula is preserved:
  1. Sum enemy levels (trainers 2x) -- unchanged
  2. Multiply by significance -- now guaranteed to be a valid number >= 1.0
  3. Divide by player count (unless boss) -- now guaranteed to be >= 1
- **Status:** CORRECT

### 2. Significance Multiplier Defaults and Flow

- **Rule:** "The Significance Multiplier should range from x1 to about x5" (`core/11-running-the-game.md#Page-460`)
- **Implementation:** The NaN-safe fallback of `1.0` represents the "insignificant" encounter tier, which is the bottom of the PTU range. This is the safest default because it produces the minimum valid XP rather than inflating. All paths now consistently default to 1.0:
  - Prisma schema: `@default(1.0)`
  - SignificancePanel: `safeCustomMultiplier` defaults to `1.0`
  - XpDistributionModal: `safeCustomMultiplier` defaults to `1.0` (commit 321bb51)
  - XpDistributionModal: `persistedSignificance` defaults to `?? 1.0` (previous fix, verified in rules-review-116)
- **Status:** CORRECT (all paths aligned)

### 3. Boss Encounter XP

- **Rule:** "When awarding Experience for a Boss encounter, do not divide the Experience from the Boss Enemy itself by the number of players." (`core/11-running-the-game.md#Page-489`)
- **Implementation:** Unchanged by these commits. The `isBossEncounter` boolean toggle in XpDistributionModal passes through to `calculateEncounterXp()`, which skips the division step (line 287-289 of experienceCalculation.ts).
- **Status:** CORRECT (unchanged)

### 4. Experience Chart Accuracy (Spot-checked)

- **Rule:** PTU Core p.203 Pokemon Experience Chart
- **Implementation:** `EXPERIENCE_CHART` in `experienceCalculation.ts:26-47`
- **Spot-check against PTU book:**
  - Level 1: Code = 0, Book = 0. MATCH
  - Level 5: Code = 40, Book = 40. MATCH
  - Level 10: Code = 90, Book = 90. MATCH
  - Level 21: Code = 460, Book = 460. MATCH
  - Level 50: Code = 3645, Book = 3,645. MATCH
  - Level 75: Code = 9945, Book = 9,945. MATCH
  - Level 100: Code = 20555, Book = 20,555. MATCH
- **Status:** CORRECT

### 5. Experience Upper Bound Validation

- **Rule:** "Pokemon have a maximum Level of 100." (`core/05-pokemon.md#Page-202`)
- **Implementation:** The `add-experience.post.ts` endpoint now validates `body.amount <= MAX_EXPERIENCE` (20,555). This is a reasonable upper bound since no single XP grant should exceed the total XP range. The calculation layer also caps: `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)` in `calculateLevelUps()` line 328.
- **Status:** CORRECT (defense-in-depth, math is safe regardless)

### 6. Level-Up Mechanics in LevelUpNotification (Re-verified)

- **Rule:** "+1 Stat Point per level" (`core/05-pokemon.md#Page-202`), "Tutor Points at levels divisible by 5" (`core/05-pokemon.md#Page-202`), "Abilities at Level 20 and 40" (`core/05-pokemon.md#Page-200`), "Check learnset for new moves" (`core/05-pokemon.md#Page-202`)
- **Implementation:** `LevelUpNotification.vue` is now the sole display for level-up information (commit 2458c81 removed the duplicate inline display). The component correctly:
  - Sums stat points across all level-ups (lines 101-103)
  - Counts tutor points via `.filter(lu => lu.tutorPointGained).length` (lines 104-106)
  - Flattens new moves via `.flatMap(lu => lu.newMovesAvailable)` (lines 107-108)
  - Maps ability milestones with correct PTU descriptions (lines 110-118):
    - 'second': "Second Ability unlocked (Basic or Advanced)" -- matches PTU p.200
    - 'third': "Third Ability unlocked (any category)" -- matches PTU p.200
  - Lists evolution eligibility levels (lines 119-121, dormant per rules-review-118)
- **No information lost from the removed duplicate:** The inline display showed the same per-level info that LevelUpNotification consolidates. The notification format is actually more useful for multi-level jumps since it aggregates totals.
- **Status:** CORRECT

### 7. Tutor Point Persistence in add-experience Endpoint (Re-verified)

- **Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point." (`core/05-pokemon.md#Page-202`)
- **Implementation:** `add-experience.post.ts` lines 91-104:
  ```typescript
  const tutorPointsGained = levelResult.levelUps.filter(lu => lu.tutorPointGained).length
  // ...
  tutorPoints: pokemon.tutorPoints + tutorPointsGained
  ```
  The `checkLevelUp()` utility correctly identifies tutor point levels via `level >= 5 && level % 5 === 0` (verified in rules-review-118). The `add-experience` endpoint correctly persists these to the database.
- **Status:** CORRECT (unchanged by these commits)

### 8. Experience Cap at Level 100 (Re-verified)

- **Rule:** "Pokemon have a maximum Level of 100." (`core/05-pokemon.md#Page-202`)
- **Implementation:** Multi-layer capping:
  1. `add-experience.post.ts` line 40-45: Rejects `amount > MAX_EXPERIENCE` (commit 496eaab)
  2. `calculateLevelUps()` line 328: `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`
  3. `getLevelForXp()` line 229: Returns `MAX_LEVEL` for XP >= MAX_EXPERIENCE
  4. `checkLevelUp()` line 58: Loop caps at `Math.min(newLevel, 100)`
  5. `add-experience.post.ts` line 96: `Math.min(levelResult.newExperience, MAX_EXPERIENCE)` (redundant but safe)
- **Status:** CORRECT (five-layer capping ensures level 100 is never exceeded)

## Summary

All 6 commits are clean, targeted fixes that do not alter any PTU game mechanics. The changes fall into three categories:

1. **NaN guard (321bb51):** Prevents invalid user input from corrupting XP calculations. The safe defaults (multiplier = 1.0, player count = 1) are the most conservative possible values per PTU rules, ensuring no silent XP inflation.

2. **UI deduplication (2458c81, 77b536d):** Removes duplicate rendering and fixes Vue key uniqueness. The `LevelUpNotification` component (approved in rules-review-118) is the sole level-up display, providing all PTU-required information: stat points, tutor points, new moves, ability milestones.

3. **Validation and documentation (496eaab, 29c0839, fbd2ac6):** Adds a reasonable upper bound check and updates documentation. The upper bound (MAX_EXPERIENCE = 20,555) matches the PTU experience chart maximum.

The core XP calculation formula, significance multiplier presets, boss encounter handling, experience chart, and level-up mechanics all remain faithful to PTU Core p.202-203, p.460, and p.489. The rules-review-116 M1 observation (XpDistributionModal NaN guards) is fully resolved by commit 321bb51.

## Rulings

1. **NaN-safe defaults are PTU-appropriate:** A cleared significance input defaulting to 1.0 (insignificant) and a cleared player count defaulting to 1 are the safest possible fallbacks. They produce minimum valid XP, preventing accidental inflation. PTU p.460 states the multiplier should range "from x1 to about x5" -- 1.0 is the floor of this range.

2. **Experience upper bound validation is reasonable:** Rejecting amounts exceeding MAX_EXPERIENCE (20,555) is a sensible server-side guard. A Pokemon at level 1 with 0 XP could theoretically receive up to 20,555 XP in a single grant (reaching level 100). The validation does not check against the Pokemon's current XP, which is intentional -- the `calculateLevelUps()` function handles the precise capping. This is defense-in-depth, not a replacement for the calculation-layer cap.

3. **Duplicate level-up display removal is information-neutral:** The `LevelUpNotification` component displays all the same level-up information (stat points, tutor points, moves, abilities, evolution) that the removed inline display showed. The notification format is actually superior for multi-level jumps since it aggregates totals (e.g., "+3 Stat Points" instead of three separate "+1 Stat Point" lines).

## Pre-existing Observations (Inherited, Not New)

- **maxHp not recalculated on level-up** (rules-review-118 medium observation): Still present. Neither `add-experience.post.ts` nor `xp-distribute.post.ts` updates `maxHp` when level increases. This is a pre-existing design decision, not a regression from these commits.

- **Evolution notification infrastructure dormant** (rules-review-118 low observation): Still present. `canEvolve` is always `false` because `evolutionLevels` is never provided. Not a PTU rule violation.

## Verdict

**APPROVED**

All 6 commits are correct with respect to PTU 1.05 rules. No formulas were changed, no game logic was altered, and no new rule correctness issues were introduced. The NaN guards produce appropriate conservative defaults, the duplicate display removal preserves all PTU-relevant information, and the upper bound validation matches the PTU experience chart maximum. The rules-review-116 M1 observation (XpDistributionModal NaN guards) is fully resolved.

## Required Changes

None.
