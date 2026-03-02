---
review_id: code-review-279
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat+vtt-grid
commits_reviewed:
  - cf8d511f
  - a97ca619
  - ed381d37
  - 5fd80952
  - 260ca189
  - 0ab897c2
  - fc1b0dc2
  - 2a2e6476
  - 8cbc7e7f
files_reviewed:
  - app/server/services/intercept.service.ts
  - app/server/services/out-of-turn.service.ts
  - app/utils/lineOfAttack.ts
  - app/components/encounter/InterceptPrompt.vue
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/disengage.post.ts
  - app/types/combat.ts
  - app/utils/gridDistance.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T13:15:00Z
follows_up: code-review-273
---

## Review Scope

Re-review of feature-016 P2 fix cycle: 9 commits (cf8d511f through 8cbc7e7f) addressing all 7 issues from code-review-273 (1C/3H/3M). Verified each fix against the original issue description by reading the actual source files.

Decrees checked: decree-002 (PTU alternating diagonal), decree-003 (passability), decree-040 (flanking penalty ordering). No violations found.

## Verification of code-review-273 Issues

### CRIT-001: canIntercept Full Action check `&&` changed to `||` -- RESOLVED

**File:** `app/server/services/intercept.service.ts` line 94

```typescript
if (ts.standardActionUsed || ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

Verified: The `||` operator correctly blocks Intercept when EITHER action has been consumed. The comment on line 92 ("If EITHER action is already consumed, the Full Action is unavailable") documents the intent. This matches PTU p.227: "Full Actions take both your Standard Action and Shift Action." Commit cf8d511f.

### HIGH-001: Step-by-step movement now uses PTU alternating diagonal cost -- RESOLVED

**File:** `app/server/services/intercept.service.ts` lines 583-601 (melee failure) and lines 689-702 (ranged failure)

Both failure loops now track `diagCount` and compute `stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1`. The first diagonal costs 1m, the second costs 2m, alternating per decree-002. The loop correctly breaks if `moved + stepCost > shiftDistance`, preventing over-movement. Commit a97ca619.

### HIGH-002: Distance calculations now use `ptuDistanceTokensBBox` -- RESOLVED

**File:** `app/server/services/intercept.service.ts`

All distance measurements now use bounding-box distance:
- `detectInterceptMelee` line 284: `ptuDistanceTokensBBox` with interceptor and target token sizes
- `resolveInterceptMelee` line 517: DC calculation uses bbox distance
- `resolveInterceptRanged` line 670: distance to target square uses bbox distance

**File:** `app/utils/lineOfAttack.ts`

New `getLineOfAttackCellsMultiTile` function (line 41) draws Bresenham line from center-of-footprint to center-of-footprint via `tokenCenter()` helper. The `canReachLineOfAttack` function (line 129) uses `ptuDistanceTokensBBox` with `interceptorSize` parameter.

**File:** `app/components/encounter/InterceptPrompt.vue`

`calculateDistance` (line 164) uses `ptuDistanceTokensBBox` with `tokenSize` from both interceptor and target.

Commit ed381d37.

### HIGH-003: intercept.service.ts extracted from out-of-turn.service.ts -- RESOLVED

**File sizes verified:**
- `intercept.service.ts`: 732 lines (new file, all P2 Intercept logic)
- `out-of-turn.service.ts`: 752 lines (retains P0 AoO + P1 Hold/Priority/Interrupt)

Both are under the 800-line limit. `out-of-turn.service.ts` re-exports all intercept functions at lines 665-679 for backward compatibility. Existing API endpoints (`intercept-melee.post.ts`, `intercept-ranged.post.ts`) import from `out-of-turn.service.ts` and continue to work through re-exports.

Note: There is a circular dependency between the two service files (`intercept.service.ts` imports `getDefaultOutOfTurnUsage` from `out-of-turn.service.ts`, which re-exports from `intercept.service.ts`). This is safe in ES modules because `getDefaultOutOfTurnUsage` is a hoisted `function` declaration, but it is worth being aware of for future refactoring. Not blocking.

Commit fc1b0dc2. Also resolves refactoring-120.

### MED-001: `intercept-ranged.post.ts` now requires `actionId` -- RESOLVED

**File:** `app/server/api/encounters/[id]/intercept-ranged.post.ts` line 54

```typescript
if (!interceptorId || !targetSquare || !attackerId || !actionId || skillCheck === undefined) {
```

`actionId` is now included in the required field validation. Without it, the request is rejected with a 400 error. This prevents the loyalty check and line-of-attack validation from being silently skipped. Commit 0ab897c2.

### MED-002: `lineOfAttack.ts` Bresenham accounts for multi-tile origin -- RESOLVED

**File:** `app/utils/lineOfAttack.ts`

The new `getLineOfAttackCellsMultiTile` function (lines 41-51) computes center-of-footprint for both attacker and target using `tokenCenter()` (lines 22-26), then passes the centers to the Bresenham algorithm. The original `getLineOfAttackCells` remains unchanged for callers that provide raw positions.

The center formula `Math.floor((size - 1) / 2)` is correct: 1x1 returns position unchanged, 2x2 returns the top-left center (floor), 3x3 returns the true center. Commit ed381d37.

### MED-003: InterceptPrompt.vue emit includes `targetSquare` -- RESOLVED

**File:** `app/components/encounter/InterceptPrompt.vue` line 116

```typescript
interceptRanged: [actionId: string, interceptorId: string, attackerId: string, targetSquare: GridPosition, skillCheck: number]
```

The emit now includes `targetSquare: GridPosition`. The `confirmIntercept` function (line 218-222) calls `getBestTargetSquare(action)` which computes the optimal interception square using `getLineOfAttackCellsMultiTile` and `canReachLineOfAttack`. If no square is reachable, the emit is suppressed (line 221: `if (!targetSquare) return`). Commit 0ab897c2.

## What Looks Good

1. **Fix granularity is correct.** 9 focused commits, one per issue or logical group. Each commit message cites the specific review issue being addressed (e.g., "Fixes code-review-273 CRIT-001 and rules-review-249 CRIT-001").

2. **Immutability discipline maintained throughout.** All combatant updates use `combatants.map(c => { return { ...c, ... } })` spread patterns. No direct mutation in any of the fix commits.

3. **Extraction is clean and backward-compatible.** The re-export pattern in `out-of-turn.service.ts` (lines 665-679) means no other files needed import path changes. Both API endpoints still import from `out-of-turn.service.ts`.

4. **`getCombatantSpeed` mirrors the composable faithfully.** Stuck (return 0), Tripped (return 0), Slowed (half), Speed CS (truncated half-stage additive), Sprint (+50%), minimum floor (1 if base > 0) -- all match `applyMovementModifiers` in `useGridMovement.ts` exactly.

5. **Bad Sleep rationale comments are well-written.** Both `AOO_BLOCKING_CONDITIONS` and `INTERCEPT_BLOCKING_CONDITIONS` now have JSDoc comments citing PTU p.249 and explaining why Bad Sleep is a variant of Asleep.

6. **`app-surface.md` updated comprehensively.** Both the endpoint section (3 new entries) and the system description section (new "Intercept/Disengage system" paragraph) are accurate and detailed.

7. **Multi-tile token support is thorough.** Center-of-footprint for line-of-attack, bbox distance for detection/DC/reachability, `tokenSize` parameter threaded through all functions. The approach is consistent with the existing `ptuDistanceTokensBBox` utility.

8. **InterceptPrompt auto-selects best target square.** The `getBestTargetSquare` function uses a generous speed (20) to find the closest reachable square, delegating actual enforcement to the server. This is a pragmatic approach that avoids duplicating speed calculation on the client.

## Verdict

**APPROVED**

All 7 issues from code-review-273 have been resolved correctly:
- CRIT-001: `&&` to `||` fix is correct
- HIGH-001: Alternating diagonal cost applied in both failure loops
- HIGH-002: Bbox distance used throughout
- HIGH-003: File extracted, both under 800 lines
- MED-001: `actionId` required in validation
- MED-002: Multi-tile Bresenham uses center-of-footprint
- MED-003: `targetSquare` in emit with auto-selection

No new issues introduced. Code quality, immutability, and project patterns are maintained.
