---
review_id: code-review-123
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-058
domain: encounter-xp
commits_reviewed:
  - ee1a0bd
  - 353f342
  - de4339e
  - 478b91e
  - ece9de3
  - 0dcafb3
  - 7c51539
  - 645e8e4
  - 9c1ddad
  - 391eeb4
  - 34299b1
files_reviewed:
  - app/prisma/schema.prisma
  - app/types/encounter.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/significance.put.ts
  - app/server/api/encounters/[id].put.ts
  - app/server/api/encounters/index.get.ts
  - app/stores/encounter.ts
  - app/components/encounter/SignificancePanel.vue
  - app/assets/scss/components/_significance-panel.scss
  - app/components/encounter/XpDistributionModal.vue
  - app/pages/gm/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-21T18:45:00Z
follows_up: null
---

## Review Scope

Code review of ptu-rule-058 P1 implementation: significanceMultiplier persistence, SignificancePanel component, significance PUT endpoint, store action, and XpDistributionModal integration. 11 commits, 11 files, +769/-9 lines.

## Issues

### CRITICAL

#### C1: Potential NaN propagation through `v-model.number` on custom multiplier, player count, and difficulty adjustment

**File:** `app/components/encounter/SignificancePanel.vue` (lines 37, 57, 83)

Vue's `v-model.number` modifier returns the original string when `parseFloat()` fails (e.g., user clears the input field completely). In Nuxt 3 with Vue 3.4+, clearing a number input bound with `v-model.number` sets the ref to an empty string `""`, which then propagates through `baseSignificance`, `finalSignificance`, and ultimately into the `persistSignificance()` call and the `recalculate()` API request.

The `customMultiplier` flows into `finalSignificance` -> `persistSignificance()` -> `setSignificance()` -> `PUT /api/encounters/:id/significance`. The server validates `typeof body.significanceMultiplier !== 'number'`, which will catch `""` (a string), but the error gets swallowed by the empty `catch` block in `persistSignificance()` (line 277). Meanwhile, `calculationResult` shows the previous value because the recalculate request also fails silently (NaN multiplier).

This creates a confusing UI state where the display shows stale XP values while the input appears empty.

**Same risk for `playerCount` (line 83):** if cleared to empty, `recalculate()` sends `playerCount: ""` to the server, potentially causing division-by-zero or API errors.

**Same risk for `difficultyAdjustment` (line 57):** if cleared, it becomes `""`, and `baseSignificance + ""` produces string concatenation, not addition.

**Fix:** Add NaN/empty guards before persisting or recalculating. For each `v-model.number` ref, validate before use:

```typescript
const safeFinalSignificance = computed(() => {
  const base = Number(baseSignificance.value) || 1.0
  const adj = Number(difficultyAdjustment.value) || 0
  return Math.max(0.5, Math.round((base + adj) * 10) / 10)
})
```

And guard `playerCount` with `Math.max(1, Number(playerCount.value) || 1)` before passing to API calls.

---

### HIGH

#### H1: `defeatedEnemies` watcher accesses `.length` without null guard (potential runtime crash)

**File:** `app/components/encounter/SignificancePanel.vue` (line 314)

```typescript
watch(() => props.encounter.defeatedEnemies.length, () => {
```

Line 217 correctly guards with `(props.encounter.defeatedEnemies ?? []).length > 0`, but line 314 accesses `.length` directly on `props.encounter.defeatedEnemies`. The type definition says `defeatedEnemies: { ... }[]` (non-optional), but `updateFromWebSocket` in the store only sets top-level fields it receives. If a WebSocket message arrives without `defeatedEnemies`, the encounter object could temporarily have `undefined` for this field, causing a crash.

**Fix:** Use the same guard pattern:

```typescript
watch(() => (props.encounter.defeatedEnemies ?? []).length, () => {
```

#### H2: `setSignificance` store action does not broadcast via WebSocket

**File:** `app/stores/encounter.ts` (lines 617-635)
**File:** `app/components/encounter/SignificancePanel.vue` (lines 271-280)

Every other encounter mutation in `gm/index.vue` (start, next turn, weather, serve/unserve) follows the pattern: call store action, await, then `send({ type: 'encounter_update', data: encounterStore.encounter })`. The `setSignificance` flow skips this entirely. It calls the store action from the component but never broadcasts.

While significance is GM-only and the Group view doesn't display it directly, the Group view's encounter state will be stale for `significanceMultiplier`. If the encounter is later synced via a different `encounter_update` broadcast (e.g., next turn), the old significance from the Group view's state could overwrite the new value -- though this is mitigated by the WebSocket handler's `undefined` check (`if (data.significanceMultiplier !== undefined)`).

The real risk: if the Group view ever displays XP information, or if undo/redo triggers a full state sync, the stale value could cause confusion.

**Fix:** Either broadcast `encounter_update` after `setSignificance`, or document as intentional. Given the pattern is consistent everywhere else, broadcasting is the correct choice.

---

### MEDIUM

#### M1: `app-surface.md` not updated with new endpoint and component

**File:** `.claude/skills/references/app-surface.md`

The new `PUT /api/encounters/:id/significance` endpoint and `SignificancePanel` component are not registered in the app surface reference. This is required by the review checklist for new endpoints/components/routes/stores.

**Fix:** Add the new endpoint under the encounters API section and the component under encounter components.

#### M2: Duplicated `resolvePresetFromMultiplier` function

**File:** `app/components/encounter/SignificancePanel.vue` (lines 191-196)
**File:** `app/components/encounter/XpDistributionModal.vue` (lines 319-324)

The exact same function is defined in both components:

```typescript
const resolvePresetFromMultiplier = (multiplier: number): SignificancePreset | 'custom' => {
  for (const [key, value] of Object.entries(SIGNIFICANCE_PRESETS)) {
    if (value === multiplier) return key as SignificancePreset
  }
  return 'custom'
}
```

This should be extracted to `utils/experienceCalculation.ts` alongside `SIGNIFICANCE_PRESETS` and `SignificancePreset`.

**Fix:** Move to `experienceCalculation.ts`, export it, and import in both components.

#### M3: XpDistributionModal default significance fallback uses `?? 2` instead of `?? 1.0`

**File:** `app/components/encounter/XpDistributionModal.vue` (line 327)

```typescript
const persistedSignificance = props.encounter.significanceMultiplier ?? 2
```

The Prisma schema defaults `significanceMultiplier` to `1.0`, the encounter service defaults to `1.0`, and the SignificancePanel defaults to `1.0`. But the XpDistributionModal defaults to `2` when the field is nullish. This is inconsistent. If the encounter record has `significanceMultiplier: 1.0` (the default for insignificant encounters), the modal will correctly use `1.0`. But if somehow the field is missing (shouldn't happen with Prisma defaults, but defensive coding matters), the modal defaults to `2` while everything else defaults to `1.0`.

**Fix:** Change to `?? 1.0` for consistency with the rest of the codebase.

---

## What Looks Good

1. **Commit granularity is excellent.** 11 commits, each with a clear single purpose. Schema -> type -> service -> endpoint -> store -> SCSS -> component -> integration -> fixes. This is textbook incremental delivery.

2. **Store action follows immutability pattern.** `setSignificance` creates a new encounter object with spread (`{ ...this.encounter, significanceMultiplier }`) instead of mutating in place. This is correct per project coding standards.

3. **Stale response protection.** Both `SignificancePanel.recalculate()` and `XpDistributionModal.recalculate()` use the `requestVersion` pattern to discard stale API responses. Well done.

4. **Endpoint validation is solid.** The `significance.put.ts` validates type, min, and max range. The error re-throw pattern (`if ('statusCode' in error) throw error`) correctly propagates H3 errors.

5. **SCSS extraction pattern is correct.** Styles are in a separate SCSS partial (`_significance-panel.scss`) imported via `@import`, following the project's established pattern. All SCSS variables are from the project's design system.

6. **WebSocket sync in `updateFromWebSocket` is correct.** The `significanceMultiplier` is handled with the `undefined` check pattern, matching other optional fields like `isServed` and `gridConfig`.

7. **Undo/redo path includes significanceMultiplier.** The `[id].put.ts` endpoint includes `significanceMultiplier: body.significanceMultiplier ?? 1.0`, and the encounter list endpoint includes it too. Both are necessary for correct undo/redo and encounter library behavior.

8. **File sizes are all well within limits.** Largest file is `encounter.ts` store at 717 lines (under 800). The new SignificancePanel is 332 lines (Vue) + 301 lines (SCSS), appropriately separated.

9. **`initialized` guard pattern prevents double-firing.** Both components use `initialized` ref to suppress watcher-triggered recalculations during mount, avoiding unnecessary API calls.

## Verdict

**CHANGES_REQUIRED**

The critical NaN propagation issue (C1) must be fixed before approval. Users naturally clear input fields while typing, and the current code has no guards against the resulting NaN/empty-string values flowing into API calls and calculations. This is a correctness bug that will surface in normal usage.

The high-severity issues (H1, H2) should also be addressed in this pass since the developer is already working in these files.

## Required Changes

1. **[C1] Add NaN/empty guards** for all `v-model.number` refs in SignificancePanel. Validate `customMultiplier`, `playerCount`, and `difficultyAdjustment` before they flow into computed values, API calls, or persistence. Guard with `Number(x) || default` pattern.

2. **[H1] Add null guard** to the `defeatedEnemies` watcher on line 314. Use `(props.encounter.defeatedEnemies ?? []).length` to match the pattern on line 217.

3. **[H2] Add WebSocket broadcast** after `setSignificance` succeeds. Follow the established pattern in `gm/index.vue` (call `send({ type: 'encounter_update', data: encounterStore.encounter })` after the store action resolves).

4. **[M1] Update `app-surface.md`** to include the new `PUT /api/encounters/:id/significance` endpoint and `SignificancePanel` component.

5. **[M2] Extract `resolvePresetFromMultiplier`** to `utils/experienceCalculation.ts` and import in both components.

6. **[M3] Fix fallback value** in `XpDistributionModal.vue` line 327 from `?? 2` to `?? 1.0`.
