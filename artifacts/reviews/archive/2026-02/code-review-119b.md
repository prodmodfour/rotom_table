---
review_id: code-review-119b
target: ptu-rule-055 P1 follow-up
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
commits: 8422471, 9dba982, 2ce1868, e1674b7
---

# Code Review: ptu-rule-055 P1 Follow-up Fixes

## Summary

Four targeted fixes addressing HIGH and MEDIUM issues from code-review-119. All four fixes are correct, minimal, and introduce no regressions. The component is now 572 lines (down from 1053), well under the 800-line limit.

## Fix-by-Fix Analysis

### H1: Double API call on preset change (commit 8422471) -- PASS

**What changed:** Removed the `@change="handlePresetChange"` binding from the `<select>` element and deleted the `handlePresetChange()` function entirely (8 lines removed).

**Why it's correct:** When `selectedPreset` changes via `v-model`, the computed `effectiveMultiplier` updates, which triggers the `watch(effectiveMultiplier)` watcher. The watcher already calls `recalculate()`. The deleted handler was a redundant second call path. The `handlePresetChange` function had a `selectedPreset !== 'custom'` guard, but that guard is unnecessary because when switching TO custom, `effectiveMultiplier` changes to `customMultiplier.value` (which differs from the previous preset value), so the watcher fires correctly. When switching FROM custom to a preset, the watcher also fires correctly.

**Regressions:** None. Only two references existed (`@change` binding and function declaration), both removed.

### H2: Double API call on mount (commit 9dba982) -- PASS

**What changed:** Added `const initialized = ref(false)` guard flag. All four watchers now check `initialized.value` before calling `recalculate()`. The flag is set to `true` only AFTER `await recalculate()` completes in `onMounted`.

**Why it's correct:** The sequence is:
1. `onMounted` fires, sets `playerCount.value = detectedPlayerCount.value`
2. This triggers `watch(playerCount)` asynchronously (Vue batches watcher callbacks to the next microtask tick)
3. `onMounted` calls `await recalculate()` -- this is the intentional initial call
4. After `recalculate()` resolves, `initialized.value = true`
5. The watcher callback from step 2 now fires, but since `initialized` became `true` after the `await`, we need to verify timing...

**Timing verification:** Actually, Vue 3's `watch` callbacks are flushed in a microtask BEFORE the `await` continuation in `onMounted`. The `playerCount.value` assignment in `onMounted` queues a watcher flush. When `recalculate()` hits its first `await` (the API call), control yields to the microtask queue, and the watcher callback fires. At that point `initialized.value` is still `false`, so the guard blocks the redundant call. By the time `initialized` is set to `true`, the watcher has already been consumed. This is correct.

**Edge case:** If `detectedPlayerCount` is already 1 (the default for `playerCount`), the assignment `playerCount.value = 1` is a no-op, so the watcher doesn't fire at all. Also correct.

### H3: Stale response protection (commit 2ce1868) -- PASS

**What changed:** Added `let requestVersion = 0` counter outside the function. Inside `recalculate()`:
- Captures `const thisRequest = ++requestVersion` before the async call
- After the `await`, checks `if (thisRequest !== requestVersion) return` before applying results
- Same check in the `catch` block (prevents stale error from overwriting fresh success)
- `finally` block only clears `isCalculating` if `thisRequest === requestVersion`

**Why it's correct:** The version counter is a standard stale-closure pattern for async race conditions. Key observations:
- **Pre-increment (`++requestVersion`)** ensures each call gets a unique, monotonically increasing version.
- **`let` (not `ref`)** is correct here -- this is internal bookkeeping, not reactive state. Vue doesn't need to track it, and using a plain `let` avoids unnecessary reactivity overhead.
- **Three guard points** (success, error, finally) are comprehensive. No state is applied from a stale request.
- **`isCalculating` stays `true`** for stale requests that bail out, which is correct because the latest request will eventually clear it. If a stale request cleared it, the spinner would disappear while the latest request is still in flight.

**One subtlety worth noting:** If `recalculate()` is called very rapidly (e.g., typing fast in the player count input), all intermediate requests still fire network calls. The stale responses are correctly discarded, but the network calls still happen. A debounce would be more efficient, but that's an optimization concern, not a correctness bug, and was not part of the original issue scope.

### M1: SCSS extraction (commit e1674b7) -- PASS

**What changed:** Extracted 488 lines of SCSS from the `<style scoped>` block to `app/assets/scss/components/_xp-distribution-modal.scss`. The component now imports via `@import '~/assets/scss/components/xp-distribution-modal'`.

**Verification:**
- **Line count:** 572 lines (well under 800-line limit)
- **Style preservation:** Diff shows exact 1:1 content transfer (488 lines removed from SFC, 488 lines in new file). No styles were modified, reordered, or lost.
- **Import mechanism:** Uses the same `@import` pattern as `MoveTargetModal.vue` (line 316 in that file), which is an established project convention.
- **SCSS variable access:** The Nuxt config injects variables, mixins, and sheets via `additionalData` in `vite.css.preprocessorOptions.scss`, so the extracted partial has full access to `$spacing-*`, `$color-*`, `$font-size-*`, `$border-radius-*`, `$glass-border`, `$transition-fast`, and mixins like `modal-overlay-enhanced` / `modal-container-enhanced`.
- **Scoped styles:** The `<style lang="scss" scoped>` attribute is preserved on the component, so the `@import` is still processed within the scoped context. Styles remain component-scoped.
- **Index file:** The new partial is NOT added to `_index.scss`, which is correct. Component-specific partials imported via scoped `@import` should not be in the global index (consistent with `_move-target-modal.scss`).

## Regression Check

- **Configure/results phase logic:** Untouched. The `phase` ref, `handleApply`, `handleSkip`, `handleFinish`, and `handleClose` functions are identical before and after these commits.
- **XP allocation logic:** Untouched. `xpAllocations`, `getXpAllocation`, `handleXpInput`, `splitEvenly`, `getLevelUpPreview`, `getPlayerRemaining`, `canApply` are all unchanged.
- **Template bindings:** Only change is removal of `@change="handlePresetChange"` on the select element. All other template bindings are preserved.
- **Computed properties:** `effectiveMultiplier`, `xpPerPlayer`, `playerGroups`, `defeatedEnemies`, `xpAlreadyDistributed`, `detectedPlayerCount`, `hasOverAllocation`, `canApply` -- all unchanged.

## Issues Found

None. All four fixes are clean, minimal, and correctly targeted.

## Verdict: APPROVED

All four issues from code-review-119 are resolved:
- H1: Double API call on preset change -- eliminated by removing redundant handler
- H2: Double API call on mount -- blocked by initialized guard with correct timing
- H3: Stale response overwrite -- prevented by request version counter with three guard points
- M1: File over 800 lines -- resolved by SCSS extraction (1053 -> 572 lines)
