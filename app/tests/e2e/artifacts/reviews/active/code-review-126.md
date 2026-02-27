---
review_id: code-review-126
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/utils/experienceCalculation.ts
  - app/components/encounter/SignificancePanel.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/stores/encounter.ts
  - app/pages/gm/index.vue
  - app/server/api/encounters/[id]/significance.put.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-02-21T22:30:00Z
follows_up: code-review-123
---

## Review Scope

Re-review of 7 fix commits (336cae9..4494e76) that address the 6 issues raised in code-review-123 (CHANGES_REQUIRED). The original review found 1 critical, 2 high, and 3 medium issues in the ptu-rule-058 P1 significance multiplier implementation. This review verifies whether each fix is complete, correct, and whether any new issues were introduced.

## Issue Resolution Verification

### C1: NaN/empty guards for v-model.number refs -- RESOLVED in SignificancePanel, NOT RESOLVED in XpDistributionModal

**SignificancePanel (commit 9cd5310): Properly fixed.**

Three NaN-safe computed properties were added at lines 217-219:

```typescript
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safeDifficultyAdjustment = computed(() => Number(difficultyAdjustment.value) || 0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))
```

These are correctly wired into:
- `baseSignificance` uses `safeCustomMultiplier` (line 223)
- `finalSignificance` uses `safeDifficultyAdjustment` (line 229)
- `recalculate()` passes `safePlayerCount` to the API (line 250)
- Template displays use `safeDifficultyAdjustment` (line 54) and `safePlayerCount` (line 120)

The fix is comprehensive for SignificancePanel. All three input paths are guarded.

**XpDistributionModal: NOT fixed.** See H1 below.

### H1: Null guard on defeatedEnemies watcher -- RESOLVED

Commit 0295c4b changed line 322 from:

```typescript
watch(() => props.encounter.defeatedEnemies.length, () => {
```

to:

```typescript
watch(() => (props.encounter.defeatedEnemies ?? []).length, () => {
```

This matches the guard pattern already used at line 213 for `hasDefeatedEnemies`. Correct fix.

### H2: WebSocket broadcast after setSignificance -- RESOLVED

Commit bb87e47 added the WebSocket broadcast directly inside `SignificancePanel.persistSignificance()` (lines 278-284):

```typescript
if (encounterStore.encounter) {
  send({
    type: 'encounter_update',
    data: encounterStore.encounter
  })
}
```

The component imports `useWebSocket()` (line 176). The broadcast happens after `setSignificance` resolves successfully. The guard `if (encounterStore.encounter)` prevents sending when the store is empty.

This deviates slightly from the pattern in `gm/index.vue` (where the page component handles broadcasting), but is functionally equivalent and arguably better since `SignificancePanel` already owns the persistence flow. There is no double-broadcast risk because no other code path broadcasts after `setSignificance`. Correct fix.

### M1: app-surface.md updated -- RESOLVED

Commit cceca7a added:
- `PUT /api/encounters/:id/significance` endpoint under the encounters API section
- A new paragraph listing `SignificancePanel.vue` and `XpDistributionModal.vue` as key encounter components

This satisfies the checklist requirement for new endpoints/components. Correct fix.

### M2: resolvePresetFromMultiplier extracted to experienceCalculation.ts -- RESOLVED

Commit 336cae9 extracted `resolvePresetFromMultiplier()` and `SIGNIFICANCE_PRESET_LABELS` from both components into `app/utils/experienceCalculation.ts` (lines 74-92). Both components now import these from the utility:

- SignificancePanel: lines 157-160
- XpDistributionModal: lines 280-283

The duplicated `formatPresetLabel()` function in XpDistributionModal was also removed and replaced with `SIGNIFICANCE_PRESET_LABELS[key]`. This also resolves refactoring-063 as noted in the commit log. Clean extraction with no behavior change.

### M3: Significance fallback fixed from ?? 2 to ?? 1.0 -- RESOLVED

Commit 2b77cea changed XpDistributionModal line 327 from:

```typescript
const persistedSignificance = props.encounter.significanceMultiplier ?? 2
```

to:

```typescript
const persistedSignificance = props.encounter.significanceMultiplier ?? 1.0
```

This is now consistent with the Prisma schema default (1.0), the encounter service default (1.0), and SignificancePanel's default (1.0). Correct fix.

## Issues

### HIGH

#### H1: XpDistributionModal has the same NaN/empty-string vulnerability that C1 fixed in SignificancePanel

**Files:** `app/components/encounter/XpDistributionModal.vue` (lines 59, 74, 378-381, 486-488, 528-529)

The C1 fix added NaN-safe computed accessors to SignificancePanel, but XpDistributionModal has the same `v-model.number` inputs for `customMultiplier` (line 59) and `playerCount` (line 74) with no equivalent guards. The `effectiveMultiplier` computed (lines 378-381) returns `customMultiplier.value` directly:

```typescript
const effectiveMultiplier = computed(() => {
  if (selectedPreset.value === 'custom') return customMultiplier.value
  return SIGNIFICANCE_PRESETS[selectedPreset.value]
})
```

If the user clears the custom multiplier input, `customMultiplier.value` becomes `""` (empty string in Vue 3.4+ with `v-model.number`), and this flows directly into:
1. `recalculate()` at line 486: `significanceMultiplier: effectiveMultiplier.value` -- sends `""` to the server
2. `handleApply()` at line 528: `significanceMultiplier: effectiveMultiplier.value` -- sends `""` to the actual XP distribution endpoint
3. Template display at line 100: `x{{ effectiveMultiplier }}` -- displays `x` with no number

Similarly, `playerCount.value` (line 74) is passed raw to `recalculate()` (line 487) and `handleApply()` (line 529) without a `Math.max(1, Number(x) || 1)` guard.

The server-side validation on `xp-calculate` and `xp-distribute` endpoints will catch type mismatches, but the error manifests as a confusing "Failed to calculate XP" message rather than the input fields showing sensible defaults.

**Fix:** Add the same NaN-safe accessor pattern from SignificancePanel:

```typescript
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))
```

Then use `safeCustomMultiplier` in `effectiveMultiplier`, and `safePlayerCount` in `recalculate()`, `handleApply()`, and the template display at line 104.

---

## What Looks Good

1. **SignificancePanel C1 fix is thorough.** All three input paths (`customMultiplier`, `difficultyAdjustment`, `playerCount`) are guarded with NaN-safe computed accessors. The `Number(x) || default` pattern is correct -- it handles both empty string and NaN cases. The `Math.max(1, ...)` on player count prevents division by zero. The safe accessors are used in both computed values and API call parameters.

2. **Extraction to experienceCalculation.ts is clean.** `resolvePresetFromMultiplier`, `SIGNIFICANCE_PRESET_LABELS`, and `SIGNIFICANCE_PRESETS` are all co-located in the same utility file. Both components import identically. The `formatPresetLabel` inline function was correctly replaced by the canonical label map. This is good SRP -- display labels and preset resolution belong with the preset data, not in UI components.

3. **WebSocket broadcast placement is correct.** Placing the broadcast inside `persistSignificance()` in SignificancePanel is actually better than the gm/index.vue pattern because it couples the broadcast to the persistence call. Every path that persists significance also broadcasts. The null guard on `encounterStore.encounter` prevents crashes if the encounter was cleared between the await and the send.

4. **Commit granularity is excellent.** 7 commits for 6 issues, each clearly scoped: one refactor extraction, three bug fixes, one docs update, one fallback fix, one ticket housekeeping. Each commit message directly references the issue it resolves.

5. **No regression in file sizes.** SignificancePanel is 340 lines (was ~332), XpDistributionModal is 583 lines (was ~590 -- net reduction from removing duplicated code), experienceCalculation.ts is 358 lines (was ~334). All well under the 800-line limit.

6. **The `defeatedEnemies` watcher guard is correctly placed.** The `?? []` guard in the watcher callback getter at line 322 matches the existing pattern at line 213. Both paths now handle `undefined` safely.

## Verdict

**CHANGES_REQUIRED**

Five of the six original issues are fully resolved. The remaining issue is that the C1 NaN/empty-string fix was only applied to SignificancePanel but not to XpDistributionModal, which has the same `v-model.number` inputs (`customMultiplier` at line 59, `playerCount` at line 74) flowing unguarded into API calls and the template display. This is the same class of bug as the original C1, downgraded from critical to high because the XpDistributionModal is a modal (less likely to be left with cleared inputs during normal use) and the server-side validation will prevent data corruption. But the UX degradation (confusing error messages, `x` displayed without a number) is real and should be fixed now since the developer is already in this code and the pattern is established.

## Required Changes

1. **[H1] Add NaN-safe guards to XpDistributionModal** for `customMultiplier` and `playerCount`. Follow the exact pattern from SignificancePanel:
   - Add `safeCustomMultiplier` and `safePlayerCount` computed properties
   - Use `safeCustomMultiplier` in `effectiveMultiplier` computed
   - Use `safePlayerCount` in `recalculate()` and `handleApply()` API call parameters
   - Use `safePlayerCount` in the template display at line 104
