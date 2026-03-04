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
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/disengage.post.ts
  - app/utils/lineOfAttack.ts
  - app/utils/gridDistance.ts
  - app/components/encounter/InterceptPrompt.vue
  - app/types/combat.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-02T13:15:00Z
follows_up: code-review-273
---

## Review Scope

Re-review of the feature-016 P2 fix cycle. 9 commits addressing all 7 issues from code-review-273 (1C/3H/3M). Verifying that each fix is correct, complete, and does not introduce regressions.

Decrees checked: decree-002 (alternating diagonal), decree-003 (passability), decree-006 (dynamic initiative). No violations.

## Previous Issues Resolution

### CRIT-001 (code-review-273): `canIntercept` `&&` vs `||` -- RESOLVED

**Fix commit:** cf8d511f

**Current code** (`intercept.service.ts` line 94):
```typescript
if (ts.standardActionUsed || ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

Changed from `&&` to `||`. Now correctly blocks Intercept when either action is consumed. Comment on line 92 documents the logic.

**Status:** RESOLVED

### HIGH-001 (code-review-273): Step-by-step movement ignores diagonal cost -- RESOLVED

**Fix commit:** a97ca619

Both failure-case movement loops in `intercept.service.ts` now implement alternating diagonal cost tracking:

`resolveInterceptMelee` (lines 585-601):
```typescript
let diagCount = 0
while (moved < shiftDistance) {
  const isDiag = dirX !== 0 && dirY !== 0
  const stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1
  if (moved + stepCost > shiftDistance) break
  cx = nextX; cy = nextY
  moved += stepCost
  if (isDiag) diagCount++
}
```

`resolveInterceptRanged` (lines 690-702): Identical pattern.

The implementation is clean and correct. The `diagCount` variable is properly scoped to each resolution call. Cardinal-only movement correctly costs 1 per step.

**Status:** RESOLVED

### HIGH-002 (code-review-273): Multi-tile distance uses raw deltas -- RESOLVED

**Fix commit:** ed381d37

All distance calculations now use `ptuDistanceTokensBBox` with token sizes. Verified at all five call sites:
1. `detectInterceptMelee` range check (line 284)
2. `resolveInterceptMelee` DC calculation (line 517)
3. `resolveInterceptRanged` distance to target square (line 670)
4. `canReachLineOfAttack` in `lineOfAttack.ts` (line 129)
5. `InterceptPrompt.vue` `calculateDistance` (line 164)

Additionally, `lineOfAttack.ts` now provides `getLineOfAttackCellsMultiTile` (lines 41-51) which computes center-of-footprint for multi-tile tokens via the `tokenCenter` helper (lines 22-26), resolving MED-002 as well.

**Status:** RESOLVED

### HIGH-003 (code-review-273): `out-of-turn.service.ts` exceeds 800-line limit -- RESOLVED

**Fix commit:** fc1b0dc2

`out-of-turn.service.ts` reduced from 1361 to 752 lines. `intercept.service.ts` created at 732 lines. Both under the 800-line threshold.

Extracted to `intercept.service.ts`:
- Types: `InterceptMeleeDetectionParams`, `InterceptRangedDetectionParams`
- Eligibility: `canIntercept`, `checkInterceptLoyalty`, `canInterceptMove`
- Detection: `detectInterceptMelee`, `detectInterceptRanged`
- Resolution: `resolveInterceptMelee`, `resolveInterceptRanged`
- Geometry: `calculatePushDirection`
- Helpers: `getCombatantSpeed`, `isAllyCombatant`, `getDisplayName`

`out-of-turn.service.ts` re-exports all symbols (lines 665-679) for backward compatibility. Existing import paths in endpoints still work via re-exports.

**Status:** RESOLVED

### MED-001 (code-review-273): `actionId` silently skipped in `intercept-ranged.post.ts` -- RESOLVED

**Fix commit:** 0ab897c2

`intercept-ranged.post.ts` line 54 now requires `actionId`:
```typescript
if (!interceptorId || !targetSquare || !attackerId || !actionId || skillCheck === undefined) {
```

Previously `actionId` was not in the required-fields check, allowing requests without it to bypass loyalty and line-of-attack validation. Now a 400 error is returned if `actionId` is missing.

**Status:** RESOLVED

### MED-002 (code-review-273): Bresenham ignores multi-tile origin -- RESOLVED

**Fix commit:** ed381d37

`lineOfAttack.ts` now exports `getLineOfAttackCellsMultiTile` (line 41) which uses `tokenCenter` to compute the center cell of each token's footprint before passing to Bresenham. Detection and endpoint validation both use this function.

The `tokenCenter` helper (line 22) correctly handles:
- 1x1 tokens: returns position unchanged
- Even-sized tokens (2x2): uses `Math.floor((size-1)/2)` = 0, returns top-left (consistent flooring)
- Odd-sized tokens (3x3): returns (1,1) offset = true center

`canReachLineOfAttack` now accepts `interceptorSize` parameter and uses `ptuDistanceTokensBBox` for edge-to-edge distance to each intermediate cell.

**Status:** RESOLVED

### MED-003 (code-review-273): InterceptPrompt.vue emit missing `targetSquare` -- RESOLVED

**Fix commit:** 0ab897c2

The `interceptRanged` emit signature now includes `targetSquare: GridPosition` (line 116):
```typescript
interceptRanged: [actionId: string, interceptorId: string, attackerId: string, targetSquare: GridPosition, skillCheck: number]
```

The `getBestTargetSquare` function (lines 178-199) auto-selects the closest reachable square on the line of attack using `getLineOfAttackCellsMultiTile` + `canReachLineOfAttack`. The `confirmIntercept` function (line 220) calls `getBestTargetSquare` and includes the result in the emit.

**Status:** RESOLVED

## New Issues

### MED-001: `distanceMoved` reports theoretical budget instead of actual meters in failure paths

**File:** `app/server/services/intercept.service.ts` lines 628 and 676

In `resolveInterceptMelee` failure path (line 628):
```typescript
distanceMoved: shiftDistance
```

The `shiftDistance` is `Math.floor(skillCheck / 3)` -- the theoretical movement budget. But the actual movement (`moved` variable in the step loop at line 599) may be less when:
- Diagonal cost eats the remaining budget (e.g., budget=2, diagonal costs 1+2=3, only 1 cell moved)
- Target position blocks further movement (line 596)

Similarly in `resolveInterceptRanged` failure path (line 676):
```typescript
distanceMoved: Math.min(maxShift, distanceToTarget)
```

The `maxShift` is `Math.floor(skillCheck / 2)`, but the actual `moved` from the step loop may be less.

**Impact:** Game-state positions are always correct (computed from cx/cy). Only the response/log `distanceMoved` field is potentially inflated. The move log message uses this value ("shifted Xm toward target") so it could display an incorrect number to the GM.

**Suggested fix:** Return `moved` instead of `shiftDistance`/`maxShift` in the failure path.

### MED-002: `getBestTargetSquare` in InterceptPrompt.vue uses hardcoded speed=20 for square selection

**File:** `app/components/encounter/InterceptPrompt.vue` lines 193-196

```typescript
// Use a generous speed estimate for finding the best square
// (actual speed enforcement happens server-side)
const speed = 20
const result = canReachLineOfAttack(
  interceptor.position, speed, attackLine, interceptor.tokenSize || 1
)
```

The hardcoded `speed=20` means `canReachLineOfAttack` always finds the closest intermediate cell regardless of the interceptor's actual movement range. The comment explains this is intentional ("actual speed enforcement happens server-side"), but the "best square" determination should ideally use the actual speed so the client selects a square the interceptor can actually reach within their movement.

In practice this is harmless -- the server validates the target square is on the line of attack and the resolution function handles the actual movement. But if the interceptor has speed 3 and the nearest reachable square is 5m away, the client sends a square it cannot reach, and the resolution correctly handles the movement (interceptor shifts as far as they can toward it).

**Impact:** Low -- server handles correctly regardless. UI feedback is potentially misleading for edge cases.

## What Looks Good

1. **Immutability discipline is maintained.** All `intercept.service.ts` functions use spread patterns. No mutation of input arrays or combatant objects.

2. **File extraction is clean.** Clear separation: `out-of-turn.service.ts` handles AoO/Hold/Priority/Interrupt framework (752 lines), `intercept.service.ts` handles Intercept detection and resolution (732 lines). Re-exports maintain backward compatibility.

3. **Server-side `getCombatantSpeed` mirrors client-side `applyMovementModifiers`.** Same modifier order, same formulas, same edge case handling (min floor, negative CS min 2).

4. **`tokenCenter` helper is mathematically correct** for line-of-attack computation with multi-tile tokens.

5. **Error handling is thorough** in both API endpoints with appropriate HTTP status codes.

6. **Type safety is strong.** `getLineOfAttackCellsMultiTile` has clear parameter types. `InterceptPrompt.vue` emit signature is properly typed with named tuple elements.

7. **JSDoc comments on blocking condition arrays** provide clear PTU rule citations.

8. **Commit granularity is excellent.** Each commit addresses exactly one review issue with clear references to the issue codes.

9. **Move log entries** follow the established pattern with all required fields.

10. **WebSocket broadcasts** are present for all three actions, maintaining Group view synchronization.

## Summary

All 7 issues from code-review-273 have been resolved:
- CRIT-001: `&&` to `||` (cf8d511f)
- HIGH-001: Alternating diagonal in step loops (a97ca619)
- HIGH-002: `ptuDistanceTokensBBox` for multi-tile (ed381d37)
- HIGH-003: Service extraction to 752+732 lines (fc1b0dc2)
- MED-001: `actionId` required in intercept-ranged (0ab897c2)
- MED-002: Multi-tile line-of-attack via `tokenCenter` (ed381d37)
- MED-003: `targetSquare` in InterceptPrompt emit (0ab897c2)

Two new MEDIUM issues found:
1. `distanceMoved` reports theoretical budget instead of actual movement
2. `getBestTargetSquare` uses hardcoded speed=20

Neither blocks approval. Both are cosmetic/UI-level concerns that do not affect game state correctness.

## Verdict

**APPROVED**

All CRITICAL and HIGH issues from code-review-273 are resolved. The fix cycle is clean, well-structured, and does not introduce regressions. The two new MEDIUM issues are acceptable follow-ups.
