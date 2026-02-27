---
review_id: rules-review-152
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003
domain: player-view
commits_reviewed:
  - 1151a18
  - 6e48b8a
  - 849c211
  - aed853a
  - adb6ecb
  - 9b89809
  - ce8e6a4
  - 279f4d7
  - c3ba9c9
mechanics_verified:
  - ptu-alternating-diagonal-movement
  - movement-distance-display
  - fog-of-war-token-visibility
  - hp-information-asymmetry
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Movement-and-Positioning
  - errata-2.md
reviewed_at: 2026-02-26T03:30:00Z
follows_up: rules-review-149
---

## Mechanics Verified

### 1. PTU Alternating Diagonal Movement (R1/C1 re-verification)

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md#Movement-and-Positioning`, p.231)
- **Errata:** No errata corrections found for diagonal movement in `errata-2.md`.
- **Implementation (post-fix):** Commit 1151a18 replaced Chebyshev `Math.max(dx, dy)` with the correct PTU formula in three locations:
  1. `app/components/player/PlayerGridView.vue` lines 127-130: `diagonals + Math.floor(diagonals / 2) + straights`
  2. `app/stores/measurement.ts` lines 42-46: `diagonalCost = diagonals + Math.floor(diagonals / 2); return diagonalCost + straights`
  3. `app/components/vtt/VTTContainer.vue` lines 312-315: Same formula for isometric flat distance component
- **Verification:** The formula `diagonals + floor(diagonals/2) + straights` correctly produces the PTU alternating sequence:
  | Diagonals | Formula | Sequence | Correct? |
  |-----------|---------|----------|----------|
  | 1 | 1 + 0 = 1 | 1m | Yes |
  | 2 | 2 + 1 = 3 | 1m + 2m | Yes |
  | 3 | 3 + 1 = 4 | 1m + 2m + 1m | Yes |
  | 4 | 4 + 2 = 6 | 1m + 2m + 1m + 2m | Yes |
  | 5 | 5 + 2 = 7 | 1m + 2m + 1m + 2m + 1m | Yes |
  | 6 | 6 + 3 = 9 | 1m + 2m + 1m + 2m + 1m + 2m | Yes |
- **Consistency check:** The same formula already existed in `useGridMovement.ts` (lines 141-148) and `usePathfinding.ts`. All five code paths now use the identical `diagonals + floor(diagonals / 2) + straights` formula.
- **Remaining Chebyshev usages:** `Math.max(dx, dy)` still appears in `terrain.ts` (brush shape), `fogOfWar.ts` (reveal area), `measurement.ts` (burst cells), pathfinding (range cells), and grid rendering (range display). These are **correct** -- they define AoE area shapes (which cells are "within radius N" of a center point), not movement distance. PTU burst/blast shapes use square regions on the grid, consistent with Chebyshev distance.
- **Status:** CORRECT -- The CRITICAL R1 issue from rules-review-149 is fully resolved. All movement distance calculations now use the correct PTU alternating diagonal rule.

### 2. Movement Distance Display to Player and GM

- **Rule:** Same as above -- the distance shown on the player's move confirmation sheet and sent in the `player_move_request` payload must reflect accurate PTU movement cost.
- **Implementation:** `PlayerGridView.vue` `handleCellClick` (lines 125-130) computes distance using the correct formula, then passes it to `setMoveTarget(position, distance)`. The `confirmMove` function in `usePlayerGridView.ts` (line 192) includes this distance in the `PlayerMoveRequest` payload sent to the GM. The `PlayerMoveRequest.vue` component displays the distance value to the player on the confirmation sheet.
- **Status:** CORRECT -- Distance shown to the player and sent to the GM now accurately reflects PTU diagonal movement cost.

### 3. Fog of War Token Visibility (R3 follow-up)

- **Rule:** Design spec (section 3.5): "Fog: explored cells = Dimmed, terrain visible, no tokens." This is a design spec rule, not a PTU mechanic -- PTU 1.05 has no fog-of-war system.
- **Implementation:** `usePlayerGridView.ts` lines 80-83 now contain a TODO comment documenting the gap: "TODO (bug-031): Explored fog cells currently show tokens, which contradicts the design spec." The filter at lines 90-95 still shows tokens in both 'revealed' and 'explored' cells.
- **Status:** TRACKED -- The R3 MEDIUM issue from rules-review-149 is correctly deferred to bug-031 with a clear TODO. Since PTU has no fog-of-war mechanic, this is purely a design spec conformance question. The TODO accurately describes the gap and the correct behavior. Acceptable for this fix cycle.

### 4. HP Information Asymmetry (R2 follow-up)

- **Rule:** Design spec (section 3.5): "Enemy tokens (not in fog) = Name, HP bar (percentage), types."
- **Implementation:** `usePlayerGridView.ts` lines 123-134 define `getDisplayHp` with correct three-tier logic: own/allied returns exact HP, enemies return percentage only. However, VTTToken still renders HP bars from raw `entity.currentHp / entity.maxHp` for all combatants.
- **Status:** TRACKED -- The R2 MEDIUM issue from rules-review-149 was correctly deferred to ux-004. The utility function exists for future integration. Since VTTToken shows a proportional bar (not numeric values), the information leakage is minimal. No PTU rule mandates HP hiding. Acceptable for this fix cycle.

## Summary

All issues from rules-review-149 have been addressed:

| Original Issue | Severity | Resolution | Status |
|---------------|----------|------------|--------|
| R1: Chebyshev distance | CRITICAL | Fixed in commit 1151a18 -- correct PTU formula in all 3 locations | RESOLVED |
| R2: VTT HP bar exact fill | MEDIUM | Deferred to ux-004 -- utility function exists | TRACKED |
| R3: Explored fog shows tokens | MEDIUM | Deferred to bug-031 -- TODO added in commit 279f4d7 | TRACKED |

The CRITICAL R1 fix (ptu-rule-083) correctly replaces Chebyshev distance with PTU alternating diagonal movement across all three code paths that previously had the bug. The formula `diagonals + floor(diagonals / 2) + straights` is mathematically equivalent to the PTU rulebook description and produces correct values for all tested diagonal counts. This formula is now consistent with the two pre-existing correct implementations in `useGridMovement.ts` and `usePathfinding.ts`.

No new PTU rules violations were introduced by the non-mechanics fixes (H1 tab broadcast, H2 cooldown reactivity, H3 token click detection, M1-M3 infrastructure fixes). These changes affect WebSocket routing, UI reactivity, and interaction mechanics -- none involve PTU game calculations.

## Rulings

1. **R1 is fully resolved.** The PTU alternating diagonal formula is now consistent across all five code paths in the application. The fix is mathematically verified.

2. **Remaining Chebyshev usages are correct.** `Math.max(dx, dy)` in area-effect calculations (burst shapes, fog reveal, terrain brush, pathfinding range) correctly defines square regions on the grid, which is the standard interpretation for PTU AoE shapes. These are NOT movement distance calculations and should NOT use the alternating diagonal formula.

3. **R2 and R3 deferrals are acceptable.** Neither involves a PTU rules violation. R2 is a design spec UX question (PTU does not mandate HP hiding). R3 is a design spec conformance question (PTU has no fog-of-war mechanic). Both are tracked in their respective tickets with clear TODOs.

## Verdict

**APPROVED** -- The CRITICAL PTU rules violation (Chebyshev distance for diagonal movement) is fully resolved. The fix produces correct values matching the PTU 1.05 rulebook. All previously identified MEDIUM issues are properly tracked in their respective tickets. No new PTU rules violations detected.

## Required Changes

None.
