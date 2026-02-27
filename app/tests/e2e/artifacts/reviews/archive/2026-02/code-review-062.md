---
review_id: code-review-062
ticket_id: bug-016
commits: [4ba0b8b]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

## Review: bug-016 — Spawn count hard-capped at 10, blocking Abundant density tier

### Commit Reviewed
- `4ba0b8b` — fix: remove hard-coded spawn cap of 10 blocking Abundant density tier

### Files Changed
- `app/types/habitat.ts` (6 lines added)
- `app/server/api/encounter-tables/[id]/generate.post.ts` (5 lines changed)
- `app/components/habitat/GenerateEncounterModal.vue` (3 lines changed)
- `app/components/encounter-table/ModificationCard.vue` (2 lines changed)

---

### Fix Analysis

**Root cause confirmed.** Five locations hard-coded `10` as the maximum spawn count. With `DENSITY_RANGES.abundant.max = 16`, the Abundant tier (12-16) was impossible to reach. All five locations were identified and replaced.

**Constant design is sound.** `MAX_SPAWN_COUNT` is derived dynamically via `Math.max(...Object.values(DENSITY_RANGES).map(r => r.max))`. This means if a new density tier is added or the abundant range is expanded, the cap automatically adjusts. Currently evaluates to `16`. This avoids both the original problem (cap too low) and unbounded spawning (no cap at all). The constant lives in `app/types/habitat.ts` alongside `DENSITY_RANGES`, which is the correct location since it is derived from that constant.

**Server-side changes verified (generate.post.ts).** Two replacements:
1. Line 105: Manual override path — `Math.min(Math.max(countOverride, 1), MAX_SPAWN_COUNT)`. Correctly clamps user input between 1 and 16.
2. Line 113: Density-based path — `Math.min(MAX_SPAWN_COUNT, Math.round(densityRange.max * densityMultiplier))`. Correctly caps the scaled maximum.

**Client-side changes verified (GenerateEncounterModal.vue).** Two replacements:
1. Line 46: HTML input `:max="MAX_SPAWN_COUNT"` — Dynamic binding replaces hard-coded `max="10"`. Users can now input up to 16 in the override field.
2. Line 354: `getSpawnRange()` display — `Math.min(MAX_SPAWN_COUNT, ...)` replaces `Math.min(10, ...)`. The spawn range label now correctly shows ranges up to 16.

**ModificationCard.vue verified.** Line 190: `getEffectiveSpawnRange()` display — same replacement for sub-habitat spawn range display. Consistent with the modal.

**No residual hard-coded `10` caps remain** in encounter generation paths. Searched the full `app/` tree for `Math.min(10` — only unrelated usages remain (terrain brush size, fog brush size, AoE size, CSV import preview, scene canvas clamping, health bar percentages).

**Import consistency verified.** All three consuming files import `MAX_SPAWN_COUNT` from `~/types`, which re-exports from `habitat.ts`. The import pattern is consistent with the existing `DENSITY_RANGES` import in each file.

---

### What Looks Good

1. **Single source of truth.** The constant is derived from `DENSITY_RANGES`, not a second hard-coded number. Future density tier changes propagate automatically.
2. **Complete coverage.** All five hard-coded locations were found and replaced — both server logic and client display/input.
3. **Minimal change footprint.** 16 lines added, 10 removed across 4 files. No structural changes, no new logic paths.
4. **Comments updated.** Both server-side cap sites now have comments explaining the cap ("cap at the highest density tier max").
5. **Well-documented fix log.** The ticket documents every affected location with file names and line numbers.

---

### Issues

#### MEDIUM: `scaledMin > scaledMax` inversion when density multiplier exceeds ~1.33x on higher tiers

**This is a pre-existing bug, not introduced by this commit.** When `densityMultiplier` causes `scaledMin` to exceed `MAX_SPAWN_COUNT` (or the old cap of 10), the random range formula produces incorrect results.

Example with abundant (min: 12, max: 16) and multiplier 2.0:
- `scaledMin = Math.max(1, Math.round(12 * 2.0))` = 24
- `scaledMax = Math.min(16, Math.round(16 * 2.0))` = 16
- `scaledMin (24) > scaledMax (16)` — the formula `Math.floor(Math.random() * (16 - 24 + 1)) + 24` produces values from 17 to 24, which exceeds the intended cap.

The UI presets only go up to 2.0x, but the server accepts up to 5.0x. This bug existed with the old cap of 10 as well (dense 8-12 with 2.0x: `scaledMin=16 > scaledMax=10`).

**Action:** File as a new ticket. The fix is to clamp `scaledMin` to not exceed `scaledMax`:
```typescript
const rawMin = Math.max(1, Math.round(densityRange.min * densityMultiplier))
const scaledMax = Math.min(MAX_SPAWN_COUNT, Math.round(densityRange.max * densityMultiplier))
const scaledMin = Math.min(rawMin, scaledMax)
```

This same pattern should be applied to the display functions in `GenerateEncounterModal.vue` and `ModificationCard.vue`.

---

### Verdict: APPROVED

The fix correctly addresses bug-016. All five hard-coded `10` caps are replaced with a dynamically derived constant. The constant design is clean and future-proof. The `scaledMin > scaledMax` inversion is a pre-existing issue that predates this change and does not block approval. It should be filed as a separate ticket.
