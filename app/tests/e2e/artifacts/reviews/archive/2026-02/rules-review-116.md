---
review_id: rules-review-116
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-058
domain: encounter-tables
commits_reviewed:
  - 336cae9
  - 9cd5310
  - 0295c4b
  - bb87e47
  - 2b77cea
  - cceca7a
  - 4494e76
mechanics_verified:
  - significance-multiplier-ranges
  - xp-calculation-formula
  - significance-presets
  - difficulty-adjustment
  - boss-encounter-xp
  - xp-distribution-modal-defaults
  - significance-fallback-consistency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#Page-460-Significance-Multiplier
  - core/11-running-the-game.md#Page-460-Calculating-Pokemon-Experience
  - core/11-running-the-game.md#Page-489-Boss-Experience-and-Rewards
reviewed_at: 2026-02-21T22:30:00Z
follows_up: rules-review-113
---

## Review Context

This is a re-review of the ptu-rule-058 P1 fix commits that addressed code-review-123's CHANGES_REQUIRED verdict. The original rules-review-113 approved the P1 implementation with 0 critical/high issues and 2 medium issues (M1: inconsistent fallback defaults, M2: divergent preset labels between components). Code-review-123 then found 6 issues (1 critical, 2 high, 3 medium) focused on code quality/robustness. The developer produced 7 fix commits to address all 6 issues.

This review verifies that the fixes preserve PTU rule correctness and that no new game logic issues were introduced.

## Issue Resolution Verification

### C1: NaN/empty guards for v-model.number refs (commit 9cd5310)

**Fix applied:** Three NaN-safe computed accessors added to `SignificancePanel.vue`:
```typescript
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safeDifficultyAdjustment = computed(() => Number(difficultyAdjustment.value) || 0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))
```

These are used in `baseSignificance`, `finalSignificance`, the `recalculate()` call, and the template display.

**PTU correctness check:**
- `safeCustomMultiplier` defaults to `1.0` (insignificant) when cleared. This matches the Prisma schema default and is the lowest standard preset. CORRECT.
- `safeDifficultyAdjustment` defaults to `0` when cleared. Zero adjustment means "no change to base significance." CORRECT per PTU p.460 ("Lower or raise the significance a little, by x0.5 to x1.5").
- `safePlayerCount` defaults to `1` and is clamped to minimum 1. This prevents division by zero in the XP formula. `Math.max(1, ...)` ensures at least 1 player. CORRECT per PTU p.460 ("divide the Experience by the number of players").
- The display now uses `safeDifficultyAdjustment` for the adjustment label and `safePlayerCount` for the player count label, so the UI reflects the safe values that flow into calculations. CORRECT.

**Status:** RESOLVED. No PTU rule impact. The NaN guards produce sensible defaults that match PTU expectations.

### H1: Null guard on defeatedEnemies watcher (commit 0295c4b)

**Fix applied:** Changed `props.encounter.defeatedEnemies.length` to `(props.encounter.defeatedEnemies ?? []).length` in the watcher on line 322.

**PTU correctness check:** This is a defensive coding fix. An encounter with no defeated enemies should report 0 for base XP, which is correct. The `?? []` fallback produces an empty array, so `.length` returns 0, which means the watcher won't trigger recalculation when there are no defeated enemies. CORRECT.

**Status:** RESOLVED. No PTU rule impact.

### H2: WebSocket broadcast after setSignificance (commit bb87e47)

**Fix applied:** Added `useWebSocket()` import and WebSocket broadcast after `setSignificance`:
```typescript
if (encounterStore.encounter) {
  send({
    type: 'encounter_update',
    data: encounterStore.encounter
  })
}
```

**PTU correctness check:** The significance multiplier is now included in the broadcasted encounter state. The store's `updateFromWebSocket` already handles `significanceMultiplier` with the `undefined` check pattern (line 372-374 in encounter.ts):
```typescript
if (data.significanceMultiplier !== undefined) {
  this.encounter.significanceMultiplier = data.significanceMultiplier
}
```
This means the Group view will receive the updated significance value. While the Group view doesn't currently display XP information, this ensures consistency for future features and undo/redo scenarios. The broadcast pattern matches all other encounter mutations (start, next turn, weather, serve/unserve). CORRECT.

**Status:** RESOLVED. No PTU rule impact; infrastructure correctness.

### M1: app-surface.md updated (commit cceca7a)

**Fix applied:** Added `PUT /api/encounters/:id/significance` endpoint and a summary line for `SignificancePanel.vue` and `XpDistributionModal.vue` to `app-surface.md`.

**PTU correctness check:** Documentation-only change. No rule impact.

**Status:** RESOLVED.

### M2: resolvePresetFromMultiplier extracted to experienceCalculation.ts (commit 336cae9)

**Fix applied:** Extracted `resolvePresetFromMultiplier()` from both components to `app/utils/experienceCalculation.ts`. Also added `SIGNIFICANCE_PRESET_LABELS` map with canonical friendly labels. Both components now import and use the shared utilities.

**PTU correctness check:** The extracted function performs exact equality matching against `SIGNIFICANCE_PRESETS` values:
```typescript
export function resolvePresetFromMultiplier(multiplier: number): SignificancePreset | 'custom' {
  for (const [key, value] of Object.entries(SIGNIFICANCE_PRESETS)) {
    if (value === multiplier) return key as SignificancePreset
  }
  return 'custom'
}
```
The preset values are:
- insignificant: 1 (PTU: x1 to x1.5)
- below_average: 1.5
- average: 2 (PTU: x2 or x3)
- above_average: 3
- significant: 4 (PTU: x4 to x5)
- major: 5

These match the PTU p.460 ranges. The canonical labels (`Insignificant`, `Minor`, `Everyday`, `Notable`, `Significant`, `Climactic`) are now consistent between both components, resolving rules-review-113 M2. CORRECT.

**Status:** RESOLVED. Also resolves rules-review-113 M2 (divergent preset labels).

### M3: Significance fallback fixed from ?? 2 to ?? 1.0 (commit 2b77cea)

**Fix applied:** Changed `XpDistributionModal.vue` line 327 from:
```typescript
const persistedSignificance = props.encounter.significanceMultiplier ?? 2
```
to:
```typescript
const persistedSignificance = props.encounter.significanceMultiplier ?? 1.0
```

**PTU correctness check:** The Prisma schema defaults `significanceMultiplier` to `1.0`. The SignificancePanel defaults to `1.0`. The encounter service serializes with `?? 1.0`. The `[id].put.ts` undo/redo path uses `?? 1.0`. Now the XpDistributionModal also defaults to `1.0`, making all paths consistent. A fallback of 1.0 means "insignificant" per PTU p.460 ("Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5"). This is the safest default -- it gives the minimum XP rather than silently inflating XP if the field is somehow missing. CORRECT.

This also resolves rules-review-113 M1 (inconsistent fallback defaults between SignificancePanel and XpDistributionModal).

**Status:** RESOLVED. Also resolves rules-review-113 M1.

## Mechanics Verified

### 1. Significance Multiplier Ranges (Re-verified)

- **Rule:** "The Significance Multiplier should range from x1 to about x5" (`core/11-running-the-game.md#Page-460`)
- **Implementation:** `SIGNIFICANCE_PRESETS` in `experienceCalculation.ts:59-66` remains unchanged. The fix commits did not alter the preset values. The new `SIGNIFICANCE_PRESET_LABELS` provides user-friendly names but does not change the numeric values.
- **Status:** CORRECT (unchanged from rules-review-113)

### 2. XP Calculation Formula (Re-verified post-NaN-guards)

- **Rule:** "Total the Level of the enemy combatants which were defeated. [...] treat their Level as doubled [...] consider the significance of the encounter [...] divide the Experience by the number of players" (`core/11-running-the-game.md#Page-460`)
- **Implementation:** `calculateEncounterXp()` in `experienceCalculation.ts:263-304` is unchanged. The NaN guards in SignificancePanel ensure that the values flowing into this function are always valid numbers:
  - `finalSignificance` is computed from `safeCustomMultiplier` + `safeDifficultyAdjustment`, clamped to >= 0.5
  - `safePlayerCount` is clamped to >= 1
  - Both flow into the `recalculate()` API call
- **Status:** CORRECT. NaN guards prevent invalid inputs from reaching the formula.

### 3. Difficulty Adjustment (Re-verified)

- **Rule:** "Lower or raise the significance a little, by x0.5 to x1.5" (`core/11-running-the-game.md#Page-460`)
- **Implementation:** The range slider (-1.5 to +1.5, step 0.5) is unchanged. The `safeDifficultyAdjustment` guard ensures that clearing the input defaults to 0 (no adjustment) rather than producing NaN. This is correct -- an empty difficulty adjustment means "no adjustment."
- **Status:** CORRECT

### 4. Boss Encounter XP (Re-verified)

- **Rule:** "When awarding Experience for a Boss encounter, do not divide the Experience from the Boss Enemy itself by the number of players." (`core/11-running-the-game.md#Page-489`)
- **Implementation:** Unchanged. The `isBossEncounter` boolean toggle skips the division step in both SignificancePanel and XpDistributionModal.
- **Status:** CORRECT (unchanged from rules-review-113)

### 5. XP Distribution Modal Default Significance (Re-verified)

- **Rule:** No specific PTU rule -- UX concern.
- **Implementation:** Now defaults to `1.0` (insignificant) via `?? 1.0`, consistent with all other serialization paths. This is the conservative default that prevents unintended XP inflation.
- **Status:** CORRECT (fixed from previous `?? 2`)

### 6. Significance Persistence and Serialization (Re-verified)

- **Rule:** No specific PTU rule -- infrastructure.
- **Implementation:** All paths now consistently use `?? 1.0`:
  - Prisma schema: `@default(1.0)`
  - Encounter service: `?? 1.0`
  - List endpoint: `?? 1.0`
  - Undo/redo PUT: `?? 1.0`
  - SignificancePanel: `?? 1.0`
  - XpDistributionModal: `?? 1.0` (fixed by commit 2b77cea)
  - WebSocket `updateFromWebSocket`: preserves existing if `undefined`
- **Status:** CORRECT (all paths now aligned)

## Summary

All 6 issues from code-review-123 have been properly resolved across 7 commits. The fixes are clean, targeted, and introduce no new PTU rule correctness problems. The two medium issues from the original rules-review-113 (M1: inconsistent fallback defaults, M2: divergent preset labels) are also resolved as a side effect of commits 2b77cea and 336cae9 respectively.

The core XP calculation formula remains untouched and correct:
1. **Base XP = sum of enemy levels (trainers 2x)** -- unchanged, correct
2. **Multiplied XP = Base XP * significance multiplier** -- unchanged, now protected by NaN guards
3. **Per-player XP = Multiplied XP / player count** -- unchanged, now protected by playerCount >= 1 guard
4. **Boss encounters skip the division step** -- unchanged, correct
5. **Significance presets (x1-x5)** -- unchanged, now with consistent labels
6. **Difficulty adjustment (+/- 0.5 to 1.5)** -- unchanged, now NaN-safe
7. **All fallback defaults aligned to 1.0** -- fixed, consistent across all paths

## Rulings

**RULING 1 (Informational): XpDistributionModal v-model.number inputs lack client-side NaN guards**

The NaN-safe computed pattern was applied to SignificancePanel (the primary significance editing interface), but XpDistributionModal still uses raw `playerCount.value` and `customMultiplier.value` / `effectiveMultiplier.value` in its `recalculate()` and `handleApply()` calls (lines 487, 529). If a user clears these inputs, the raw empty string would flow to the server. The server-side validation (`typeof body.playerCount !== 'number'` and `typeof body.significanceMultiplier !== 'number'`) WILL reject the request with a 400 error, and the `calculationError` ref will display the error to the user. This means the system fails safely -- no incorrect XP values will be calculated or applied.

However, the user experience is suboptimal: clearing an input field shows a server error instead of gracefully defaulting. This is a code quality concern rather than a PTU rules concern. The XP formula will never produce incorrect results because the server rejects invalid inputs before they reach `calculateEncounterXp()`.

**Severity: MEDIUM (code quality, not rule correctness). No PTU values at risk.**

## Medium Issues

### M1: XpDistributionModal lacks client-side NaN guards on v-model.number inputs

**File:** `app/components/encounter/XpDistributionModal.vue` (lines 59, 74, 379, 487, 529)

The `customMultiplier` and `playerCount` refs are used without the `safeX` computed pattern that was added to SignificancePanel. While the server validation prevents incorrect XP calculation, a user clearing these fields will see a server error rather than a graceful fallback.

**Recommendation:** Apply the same NaN-safe computed pattern from SignificancePanel:
```typescript
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))
```
And use these in `effectiveMultiplier`, `recalculate()`, and `handleApply()`.

This is not a PTU rule correctness issue -- server validation ensures no incorrect XP values are ever calculated. It is a UX/robustness improvement.

## Verdict

**APPROVED** -- All 6 issues from code-review-123 are properly resolved. No PTU rule correctness issues introduced by the fix commits. The core XP formula, significance ranges, boss encounter handling, and difficulty adjustment all remain faithful to PTU Core p.460/p.473/p.489. Both medium issues from rules-review-113 (M1 inconsistent fallbacks, M2 divergent labels) are also resolved. One new medium-severity UX note identified (XpDistributionModal NaN guards) but it has no impact on PTU rule correctness due to server-side validation.

## Required Changes

None required for PTU correctness. The MEDIUM issue (M1) is a UX/robustness recommendation that can be addressed in a future pass.
