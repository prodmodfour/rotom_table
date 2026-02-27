---
review_id: code-review-161
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-082, ptu-rule-083
domain: pokemon-lifecycle, vtt-grid
commits_reviewed:
  - eb4d6b2
  - f366514
  - 1151a18
  - f0b2f14
files_reviewed:
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/stores/measurement.ts
  - app/components/player/PlayerGridView.vue
  - app/components/vtt/VTTContainer.vue
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
  - app/utils/experienceCalculation.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-25T18:30:00Z
follows_up: null
---

## Review Scope

Two P4 PTU rule-correctness fixes:

1. **ptu-rule-082** (commit `eb4d6b2`): Pokemon `maxHp` not auto-updated when leveling up via XP endpoints. Fix adds `maxHp += levelsGained` to both `xp-distribute.post.ts` and `add-experience.post.ts`.

2. **ptu-rule-083** (commit `1151a18`): Measurement store, `PlayerGridView`, and `VTTContainer` used Chebyshev distance (`Math.max(dx, dy)`) instead of PTU alternating diagonal rule. Fix replaces with `diagonals + floor(diagonals / 2) + straights` in all 3 locations.

Commits `f366514` and `f0b2f14` are ticket status updates (chore commits).

## Issues

### MEDIUM

**M1: Duplicated diagonal formula inlined in 3 places (ptu-rule-083)**

The PTU alternating diagonal distance formula is now written identically in 5 separate locations:

1. `useGridMovement.ts:calculateMoveDistance` (lines 141-148)
2. `usePathfinding.ts:calculateMoveCost` (lines 158-166)
3. `stores/measurement.ts:distance` getter (lines 42-46)
4. `components/player/PlayerGridView.vue:handleCellClick` (lines 128-130)
5. `components/vtt/VTTContainer.vue:isometric3dDistance` (lines 313-315)

Locations 1 and 2 predate this fix and were already correct. The fix correctly changed 3, 4, and 5, but did so by inlining the formula rather than importing `calculateMoveDistance` from `useGridMovement`. If the formula ever needs adjustment, 5 locations must be updated in sync.

This is not blocking because:
- The formula is mathematically simple (3 lines)
- All 5 instances are now confirmed identical
- Locations 4 and 5 are in Vue components where importing a composable just for one utility function would add unnecessary coupling

However, a shared `ptuDiagonalDistance(dx, dy)` pure utility function (e.g. in `utils/gridDistance.ts`) would be the cleaner long-term approach. File as a refactoring ticket for future cleanup.

**M2: XP endpoints do not update `currentHp` alongside `maxHp` on level-up (ptu-rule-082)**

When `maxHp` increases by `levelsGained`, the Pokemon's `currentHp` is left unchanged. If a Pokemon was at full HP before leveling (e.g., `currentHp: 45, maxHp: 45`) and gains 3 levels, the result is `currentHp: 45, maxHp: 48`. The Pokemon now appears to be at 93.75% HP despite not having taken any damage.

PTU does not explicitly prescribe whether currentHp increases on level-up, and this is a common GM-table decision. The current behavior is defensible (GM can heal manually), and the ticket explicitly scopes only the maxHp update. But it creates a UX inconsistency where a freshly-leveled Pokemon looks damaged.

This is not blocking because it is a design decision outside the ticket scope. If addressed, the fix would be: when `pokemon.currentHp === pokemon.maxHp` (full HP before level-up), also increase `currentHp` by `maxHpIncrease`. File as a separate P4 UX ticket if desired.

## What Looks Good

**ptu-rule-082:**
- Both XP code paths (`xp-distribute` and `add-experience`) are updated consistently with identical logic.
- The conditional spread `...(maxHpIncrease > 0 ? { maxHp: pokemon.maxHp + maxHpIncrease } : {})` correctly avoids writing maxHp when no levels are gained. Immutability pattern is correct (spread into Prisma data object, no mutation).
- The `maxHp` field was correctly added to the Prisma `select` clause in both endpoints -- without this, `pokemon.maxHp` would be undefined and the increment would produce NaN. Good attention to detail.
- Comments accurately reference PTU Core p.198 and explain why only the level component (not HP stat) changes automatically.
- `levelsGained` is computed correctly in `calculateLevelUps()` as `newLevel - currentLevel` (verified in `experienceCalculation.ts:325`).
- Duplicate code path check is thorough: the only two automated level-up paths are these two endpoints. The manual PUT `/api/pokemon/:id` allows the GM to set maxHp directly, which is correct.

**ptu-rule-083:**
- The formula `diagonals + floor(diagonals / 2) + straights` correctly implements PTU's alternating 1m/2m diagonal rule. Verified against rulebook (p.425-428): "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again."
- All 3 Chebyshev distance-measurement locations were found and fixed.
- Remaining Chebyshev uses (AoE burst containment in `measurement.ts:getBurstCells`, `fogOfWar.ts`, `terrain.ts`, `useRangeParser.ts`) were correctly identified as "is cell within N squares" checks, not point-to-point distance measurements. These should remain Chebyshev. Verified by reading `getBurstCells` (line 196: `Math.max(Math.abs(dx), Math.abs(dy)) <= radius`).
- The existing `useGridMovement.calculateMoveDistance` and `usePathfinding.calculateMoveCost` already used the correct formula before this fix. The A* pathfinding diagonal parity tracking (odd diagonal = 1, even diagonal = 2) in `usePathfinding.ts:100-109` is also correct and consistent.
- No immutability violations. All changes are pure computations that produce new values.

**Commit granularity:**
- Each fix is a single commit (1 code commit + 1 ticket-status chore commit per fix). This is appropriate for the scope: ptu-rule-082 touches 2 files with identical changes, ptu-rule-083 touches 3 files with identical formula replacements. Both are well-scoped atomic changes.

**Error handling:**
- Both XP endpoints preserve existing error handling patterns (re-throw HTTP errors, wrap unknown errors with 500 status). No changes to error paths.

**Documentation:**
- JSDoc header in `xp-distribute.post.ts` was updated to reflect the new maxHp behavior (line 11). Good practice.

## Verdict

**APPROVED**

Both fixes are correct, minimal, and well-documented. The two MEDIUM observations (formula duplication and currentHp gap) are real but non-blocking for P4 bug fixes. They should be filed as separate tickets if the team wants to address them.
