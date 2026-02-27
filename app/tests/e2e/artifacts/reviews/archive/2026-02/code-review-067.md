---
review_id: code-review-067
commit: dc65a10
ticket: bug-027
domain: encounter-tables
status: APPROVED
date: 2026-02-20
reviewer: senior-reviewer
---

# Code Review 067: Clamp scaledMin in Spawn Range Calculations (bug-027)

## Commit

`dc65a10` -- `fix: clamp scaledMin to not exceed scaledMax in spawn range calculations`

## Files Reviewed

1. `app/server/api/encounter-tables/[id]/generate.post.ts`
2. `app/components/habitat/GenerateEncounterModal.vue`
3. `app/components/encounter-table/ModificationCard.vue`

---

## Issues

None.

---

## What Looks Good

1. **Clamping pattern is correct and consistent across all three files.** Each file applies the identical three-line pattern:

   ```typescript
   const rawMin = Math.max(1, Math.round(range.min * multiplier))
   const scaledMax = Math.min(MAX_SPAWN_COUNT, Math.round(range.max * multiplier))
   const scaledMin = Math.min(rawMin, scaledMax)
   ```

   This guarantees `scaledMin <= scaledMax` in all cases. When the multiplier is extreme enough to push `rawMin` above `MAX_SPAWN_COUNT`, `scaledMin` collapses to `scaledMax`, producing a fixed count rather than an inverted or overflowing range. The `Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin` formula then produces a value in `[scaledMax, scaledMax]` -- which is the correct degenerate case.

2. **All three code paths are patched.** Verified by searching for `DENSITY_RANGES` across the codebase. 18 files reference it, but only 3 apply a density multiplier to compute spawn ranges:
   - `app/server/api/encounter-tables/[id]/generate.post.ts` (server generation -- produces actual spawn counts)
   - `app/components/habitat/GenerateEncounterModal.vue` (client display -- `getSpawnRange()`)
   - `app/components/encounter-table/ModificationCard.vue` (client display -- `getEffectiveSpawnRange()`)

   The remaining files (`useTableEditor.ts`, `TableCard.vue`, `EncounterTableCard.vue`) only read base `DENSITY_RANGES` without multiplier application. The store files (`encounterTables.ts`) define types and API calls but do not compute ranges. Confirmed no other affected code paths.

3. **Variable renaming is clear.** Renaming the original `scaledMin` to `rawMin` makes the intent obvious: `rawMin` is the unclamped value, `scaledMin` is the final clamped result. This improves readability without changing any other logic.

4. **Edge case analysis is sound.** The ticket documents the triggering scenario: abundant tier (12-16) with 2.0x multiplier produces `rawMin=24`, `scaledMax=16`. Without the fix, `Math.floor(Math.random() * (16 - 24 + 1)) + 24` = `Math.floor(Math.random() * -7) + 24` which evaluates to values in range `[17, 24]` (since `Math.floor` of negative fractional values rounds toward negative infinity, the actual range depends on the random value). With the fix, `scaledMin=16`, so the formula produces exactly 16. Correct.

5. **Minimal, focused diff.** 3 files changed, 6 insertions, 3 deletions. Each change is a single-line rename + single-line addition. No unrelated changes. Ideal fix scope.

---

## Duplicate Code Observation

The three-line spawn range calculation pattern (`rawMin`, `scaledMax`, `scaledMin`) is now duplicated across three files. Two of these are display-only (client components) and one is the actual generation logic (server). While this is technically triplicated logic, the display functions exist in different component contexts and serve different purposes (modal preview vs. card preview vs. server generation). Extracting a shared utility is possible but not urgent given the simplicity of the pattern (3 lines).

If a fourth instance ever appears, extract to a shared utility. For now, the duplication is acceptable.

---

## Verdict

**APPROVED.** Clean, minimal fix applied consistently to all affected code paths. The clamping logic is mathematically correct and no edge cases are missed. No issues found.
