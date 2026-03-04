---
review_id: code-review-273
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat+vtt-grid
commits_reviewed:
  - a264318f
  - c26b81c9
  - f938c5ac
  - b7bdf700
  - c5dcbb11
  - 0eee0c38
  - 96754870
  - 1cb2f713
  - 9c12315f
files_reviewed:
  - app/server/services/out-of-turn.service.ts
  - app/utils/lineOfAttack.ts
  - app/components/encounter/InterceptPrompt.vue
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/disengage.post.ts
  - app/constants/combatManeuvers.ts
  - app/stores/encounter.ts
  - app/composables/useGridMovement.ts
  - app/types/combat.ts
  - app/types/character.ts
  - app/types/encounter.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-03-02T11:30:00Z
follows_up: code-review-264
---

## Review Scope

P2 implementation of feature-016: Intercept Melee, Intercept Ranged, and Disengage maneuver. 9 commits implementing Sections A-C/E/F of design-priority-interrupt-001 spec-p2.md. Covers detection, eligibility, resolution, API endpoints, store actions, and GM UI component.

Decrees checked: decree-003 (passability), decree-006 (dynamic initiative). No violations found.

## Issues

### CRITICAL

#### CRIT-001: `canIntercept` Full Action check uses `&&` instead of `||` -- allows Intercept when one action already consumed

**File:** `app/server/services/out-of-turn.service.ts` lines 724-728

```typescript
// Must have Full Action available (Standard + Shift)
const ts = combatant.turnState
if (ts.standardActionUsed && ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

A Full Action consumes BOTH Standard and Shift actions. The combatant needs BOTH actions available. The current `&&` check only blocks when BOTH are already used. If only the Standard Action is used (e.g., the combatant attacked on their turn but hasn't shifted), the check passes and the Intercept is allowed -- consuming a Standard Action the combatant already spent.

**Fix:** Change `&&` to `||`:
```typescript
if (ts.standardActionUsed || ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

This also affects `detectInterceptMelee` and `detectInterceptRanged` since they call `canIntercept()` -- false-positive Intercept opportunities will be offered to the GM for combatants who have already spent one of their actions.

### HIGH

#### HIGH-001: Step-by-step movement in failure cases ignores PTU diagonal cost

**File:** `app/server/services/out-of-turn.service.ts` lines 1151-1163 (Intercept Melee failure) and lines 1251-1258 (Intercept Ranged failure)

Both failure-case movement loops count every step as 1 meter, including diagonal steps. PTU uses alternating diagonal cost: first diagonal = 1m, second = 2m, third = 1m, etc. (per decree-002). When moving diagonally, the code over-moves because it treats a 2m diagonal step as 1m.

Example: Intercept Melee failure with skillCheck=6, distance=4 (DC=12). `shiftDistance = floor(6/3) = 2`. If the direction is purely diagonal, the code moves 2 cells diagonally, but the actual PTU cost is 1+2=3m. The interceptor should only move 1 cell diagonally (1m cost).

**Fix:** Apply PTU alternating diagonal cost tracking in the step loop:
```typescript
let moved = 0
let cx = interceptor.position.x
let cy = interceptor.position.y
let diagCount = 0
while (moved < shiftDistance) {
  const nextX = cx + dirX
  const nextY = cy + dirY
  const isDiag = dirX !== 0 && dirY !== 0
  const stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1
  if (moved + stepCost > shiftDistance) break
  if (nextX === target.position.x && nextY === target.position.y) break
  cx = nextX
  cy = nextY
  moved += stepCost
  if (isDiag) diagCount++
}
```

Same fix needed in `resolveInterceptRanged`.

#### HIGH-002: Distance calculations for detection and DC use raw position deltas, ignoring multi-tile token footprints

**File:** `app/server/services/out-of-turn.service.ts` lines 855-858 (detectInterceptMelee) and lines 1085-1088 (resolveInterceptMelee DC)

```typescript
const distance = ptuDiagonalDistance(
  target.position.x - interceptor.position.x,
  target.position.y - interceptor.position.y
)
```

For multi-tile tokens (Large/Huge/Gigantic Pokemon), `position` is the top-left cell. Raw delta between top-left corners overestimates the distance. A utility `ptuDistanceTokensBBox` exists in `app/utils/gridDistance.ts` that correctly measures minimum distance between bounding boxes. This matters for both detection (wrongly excluding valid interceptors) and DC calculation (inflated DC = unfair difficulty).

**Fix:** Use `ptuDistanceTokensBBox` with token sizes:
```typescript
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'
const distance = ptuDistanceTokensBBox(
  { position: interceptor.position, size: interceptor.tokenSize },
  { position: target.position, size: target.tokenSize }
)
```

Same fix needed in: detectInterceptMelee (line 855), resolveInterceptMelee (line 1085), canReachLineOfAttack (lineOfAttack.ts uses point distance), and the InterceptPrompt.vue `calculateDistance` function (line 162).

#### HIGH-003: `out-of-turn.service.ts` is 1361 lines (exceeds 800-line max)

**File:** `app/server/services/out-of-turn.service.ts`

Pre-P2: 728 lines. Post-P2: 1361 lines. The P2 additions (detection, resolution, push calculation, helpers) added 633 lines. The file is now nearly double the 800-line limit.

**Fix:** Extract P2 Intercept logic into a separate service file, e.g., `app/server/services/intercept.service.ts`. Move:
- `InterceptMeleeDetectionParams`, `InterceptRangedDetectionParams`
- `canIntercept`, `checkInterceptLoyalty`, `canInterceptMove`
- `detectInterceptMelee`, `detectInterceptRanged`
- `calculatePushDirection`
- `resolveInterceptMelee`, `resolveInterceptRanged`
- `getCombatantSpeed`, `isAllyCombatant`, `getDisplayName` (shared helpers)

The out-of-turn service retains P0 (AoO) and P1 (Hold/Priority/Interrupt framework) logic. The intercept service imports shared types and helpers.

### MEDIUM

#### MED-001: `intercept-ranged.post.ts` loyalty check and line-of-attack validation silently skipped when `actionId` is missing

**File:** `app/server/api/encounters/[id]/intercept-ranged.post.ts` lines 106-132

The loyalty check (line 112) and line-of-attack validation (line 123) both depend on finding the `originalTarget` from the pending action context, which requires `actionId`. If `actionId` is not provided:
1. `pendingAction` is null
2. `originalTargetId` is undefined
3. `originalTarget` is null
4. Both the `if (originalTarget)` loyalty check and `if (attacker.position && originalTarget?.position)` line validation are skipped

The validation on line 54 does not require `actionId`. This means a malformed request could bypass both checks.

**Fix:** Either:
- Add `actionId` to the required fields validation on line 54, OR
- Accept `originalTargetId` as a required body parameter (parallel to intercept-melee which takes `targetId` directly)

#### MED-002: `lineOfAttack.ts` Bresenham algorithm does not account for multi-tile token origin points

**File:** `app/utils/lineOfAttack.ts` line 24

`getLineOfAttackCells(from, to)` takes raw `GridPosition` arguments. For multi-tile tokens, the "position" is the top-left corner of the footprint. The line of attack should be drawn from the CENTER of the attacker's footprint to the CENTER of the target's footprint (or from nearest-cell-to-nearest-cell), not from top-left to top-left.

For a 2x2 attacker at (0,0) and 1x1 target at (5,5), the line is drawn from (0,0) to (5,5). But the attack conceptually originates from somewhere in the 2x2 footprint. This could exclude valid interception squares or include invalid ones.

**Fix:** Either draw from center-of-footprint (`from.x + Math.floor(size/2)`) or draw from the nearest cell of each footprint to the other. Consistent with the existing `ptuDistanceTokensBBox` approach.

#### MED-003: `InterceptPrompt.vue` imports from `~/types/encounter` but emits typed tuples without `originalTargetId` for ranged intercepts

**File:** `app/components/encounter/InterceptPrompt.vue` lines 113-115

The `interceptRanged` emit signature is:
```typescript
interceptRanged: [actionId: string, interceptorId: string, attackerId: string, skillCheck: number]
```

But the store action `interceptRanged` and the API endpoint expect a `targetSquare: GridPosition`. The component emits `interceptRanged` without any target square -- the parent component would need to supply it, but no mechanism exists in the InterceptPrompt for the GM to select a target square on the line of attack.

The design spec Section B5 says: "The GM can click a cell on the line to select the target square for interception." This UI flow is not implemented in InterceptPrompt.vue -- it only has a skill check input, not a target square selector. This is a missing feature from the spec, and the emit signature is incompatible with the store action.

**Fix:** Either add target square selection to InterceptPrompt (per spec B5), or have the parent component auto-select the best square from the pending action context and pass it alongside the emit. The emit signature must include `targetSquare: GridPosition`.

## What Looks Good

1. **Immutability discipline is excellent.** All resolution functions (`resolveInterceptMelee`, `resolveInterceptRanged`, disengage endpoint) use `combatants.map(c => { return { ...c, ... } })` spread pattern. No direct mutation of input arrays or objects.

2. **Bresenham's algorithm is textbook-correct.** The line-of-attack implementation in `lineOfAttack.ts` is clean, well-documented, and handles all octants correctly via the error-term approach. The three exported functions have clear single responsibilities.

3. **Type safety is strong.** New interfaces (`InterceptMeleeDetectionParams`, `InterceptRangedDetectionParams`) are well-typed. The `OutOfTurnAction.triggerContext` extension with `attackerId` and `originalTargetId` cleanly carries context through the detection-to-resolution pipeline.

4. **Disengage implementation is clean and minimal.** The endpoint correctly sets the flag and consumes Shift Action. The movement clamp in `useGridMovement.ts` (both `getMaxPossibleSpeed` and `getSpeed`) is properly integrated. The flag is cleared at both turn-end and round-start in `next-turn.post.ts`.

5. **Error handling is thorough.** All three endpoints validate required fields, check encounter is active, find combatants with proper 404 handling, validate eligibility before resolution, and re-throw HTTP errors while wrapping unexpected errors in 500s.

6. **Loyalty check is well-structured.** The `checkInterceptLoyalty` function correctly implements the PTU tiered loyalty system (3+ for trainer, 6 for any ally) and uses `pokemon.ownerId` / `target.entityId` comparison.

7. **Move log entries follow the established pattern** with all required fields (id, timestamp, round, actorId, actorName, moveName, damageClass, actionType, targets, notes).

8. **WebSocket broadcasts are present** for all three new actions, ensuring Group view stays synchronized.

9. **InterceptPrompt.vue** has clean BEM SCSS, good reactivity patterns, and a thoughtful HP display with color-coded severity tiers.

10. **Commit granularity is appropriate.** 9 focused commits covering: type extension, utility, service logic, each endpoint, store actions, UI component, and design/ticket updates.

## Verdict

**CHANGES_REQUIRED**

CRIT-001 (Full Action `&&` vs `||` check) is a correctness bug that allows Intercept when only one action remains -- the interceptor would double-spend an action they already used. This MUST be fixed.

HIGH-001 (diagonal movement cost) produces incorrect movement distances in failure cases and violates decree-002 (PTU alternating diagonal). Must be fixed in both resolution functions.

HIGH-002 (multi-tile distance) affects DC accuracy and detection eligibility for Large/Huge/Gigantic tokens. Must be fixed for correctness.

HIGH-003 (file size 1361 lines) requires extraction into a separate service file. File a refactoring ticket if not addressed in this cycle.

MED-001, MED-002, MED-003 must be addressed now -- the developer is already in this code, and all three are straightforward fixes.

## Required Changes

1. **CRIT-001:** Change `ts.standardActionUsed && ts.shiftActionUsed` to `ts.standardActionUsed || ts.shiftActionUsed` in `canIntercept()`.
2. **HIGH-001:** Apply PTU alternating diagonal cost in both `resolveInterceptMelee` (failure loop) and `resolveInterceptRanged` (failure loop).
3. **HIGH-002:** Use `ptuDistanceTokensBBox` for all distance calculations involving combatant positions (detection, DC, InterceptPrompt).
4. **HIGH-003:** Extract intercept logic into `app/server/services/intercept.service.ts`. If deferred, file a refactoring ticket immediately.
5. **MED-001:** Add `actionId` to required field validation in `intercept-ranged.post.ts`, or accept `originalTargetId` as a required body parameter.
6. **MED-002:** Adjust `getLineOfAttackCells` calls to use center-of-footprint for multi-tile tokens, or document that multi-tile line-of-attack is a known limitation with a follow-up ticket.
7. **MED-003:** Add target square selection to InterceptPrompt.vue emit, or wire the parent component to supply the target square. The emit signature must include `targetSquare`.
