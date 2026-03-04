---
review_id: code-review-289
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - c26d7a6e
  - 9007ce5d
  - fa55ac84
  - f5ae1952
  - 82a06a0e
  - f78e8fd9
  - 909c9ebd
  - a90475ba
  - 291fa57f
  - 9a09326e
files_reviewed:
  - app/composables/useEncounterActions.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - app/utils/mountingRules.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/position.post.ts
  - app/composables/useGridMovement.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/stores/encounter.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T23:30:00Z
follows_up: code-review-285
---

## Review Scope

Re-review of feature-004 P0 fix cycle (Pokemon Mounting / Rider System). Verifying that all 6 issues from code-review-285 (1 CRITICAL + 2 HIGH + 3 MEDIUM) were correctly addressed in 5 fix commits, and that the fixes did not introduce regressions to the 14-commit original P0 implementation.

Decrees checked: decree-001 (minimum damage floor -- unaffected), decree-003 (token blocking / position sharing -- mount pairs share position correctly), decree-004 (massive damage uses real HP after temp HP -- `triggersDismountCheck` uses `hpDamage` parameter, citing decree-004 in comment on line 149 of `mountingRules.ts`). No new decree ambiguities discovered.

## Fix Verification

### CRIT-001: Client-side linked movement does not update mount partner position locally

**Status: FIXED CORRECTLY (c26d7a6e)**

The fix in `useEncounterActions.ts` (lines 250-283) now:
1. Reads `oldPosition` before overwriting `localCombatant.position`
2. Calculates `distanceMoved` using `ptuDiagonalDistance` -- the same function used by `position.post.ts` (line 76), ensuring client and server compute identical distances
3. Updates `localCombatant.position` to the new position
4. If `localCombatant.mountState` exists, finds the partner combatant and updates both:
   - Partner position set to `{ ...position }` (spread creates a new object, avoiding shared reference)
   - `movementRemaining` decremented on both rider and mount via `Math.max(0, ...)` clamp

The fix correctly mirrors the server-side logic in `position.post.ts` (lines 85-113). The `broadcastUpdate()` on line 286 now sends accurate local state to the group view.

### HIGH-001: `skipCheck` parameter accepted by store but ignored by server

**Status: FIXED CORRECTLY (9007ce5d)**

Three files updated:
- `mount.post.ts` line 48: passes `body.skipCheck` to `executeMount()`
- `mounting.service.ts` line 148: `executeMount` accepts `skipCheck?: boolean` parameter
- `mounting.service.ts` line 155: `checkRequired = skipCheck ? false : !checkAutoSuccess` -- when `skipCheck` is truthy, mounting check is bypassed regardless of Mounted Prowess
- `dismount.post.ts` line 56: passes `body.skipCheck` to `executeDismount()` -- accepted as `_skipCheck` (prefixed underscore signals intentionally unused for now), with a clear comment "skipCheck accepted for forward compatibility (P1 dismount checks on damage/push)"
- `mounting.service.ts` line 269: `executeDismount` signature updated to accept `_skipCheck?: boolean`

The store already sent `skipCheck` in the request body (confirmed at lines 1018 and 1046 of `encounter.ts`). The full pipeline is now wired: store -> API endpoint -> service function.

### HIGH-002: `movementRemaining` not decremented locally

**Status: FIXED CORRECTLY (c26d7a6e)**

Combined with CRIT-001 fix. Lines 265-269 decrement `localCombatant.mountState.movementRemaining` and lines 276-280 sync the same value to the partner's `mountState.movementRemaining`. The `mountState` is reassigned as a new object (spread pattern), which is the correct approach for Vue reactivity -- direct mutation of nested properties on reactive objects can miss reactivity tracking, but replacing the entire `mountState` object triggers the setter.

`getSpeed` and `getMaxPossibleSpeed` in `useGridMovement.ts` (lines 191-192, 238-239) return `combatant.mountState.movementRemaining` directly, so the decremented value will immediately reflect in movement range highlighting after a partial move.

### MED-001: `app-surface.md` not updated

**Status: FIXED CORRECTLY (82a06a0e)**

Added:
- Two new endpoint entries (mount, dismount) in the Encounters API section with accurate descriptions
- A "Mounting system (feature-004)" paragraph documenting the service, utility, types, store getters/actions, linked movement, round reset, faint auto-dismount, and WebSocket sync
- A "Mounting utilities" paragraph in the VTT utilities section listing all exported functions and constants from `mountingRules.ts`
- `mounting.service.ts` entry in the Server Services table with function inventory

All additions are accurate and consistent with the actual code.

### MED-002: Duplicate movement speed logic

**Status: FIXED CORRECTLY (fa55ac84)**

- `getMovementSpeedForMount` removed from `mountingRules.ts` (10 lines deleted)
- Import removed from `mounting.service.ts` (line 21: `getMountActionCost` is now the last import from `mountingRules`)
- `getOverlandSpeed` from `combatantCapabilities.ts` is imported instead (line 25)
- `executeMount` line 157 now calls `getOverlandSpeed(mount)` instead of `getMovementSpeedForMount(mount)`
- `resetMountMovement` (lines 340, 353) and `resetCombatantsForNewRound` (lines 636, 641) already used `getOverlandSpeed` -- no change needed

Grep confirms zero remaining references to `getMovementSpeedForMount` in the codebase. Single source of truth for Overland speed.

### MED-003: Array mutation pattern in damage/next-turn

**Status: FIXED CORRECTLY (f5ae1952)**

- `damage.post.ts` line 37: `const { record, combatants }` changed to destructure into `const { record }` + `let combatants = loaded.combatants`. Lines 125-127 now simply assign `combatants = mountResult.combatants` instead of the splice-push pattern.
- `next-turn.post.ts` line 58: `const combatants` changed to `let combatants`. Lines 214-215 now assign `combatants = mountFaintResult.combatants` instead of splice-push.

Both files now use clean immutable reassignment. The `combatants` variable is passed to `saveEncounterCombatants` later, which correctly receives the new array.

## Original P0 Implementation -- Additional Review

Reviewed all original implementation files for issues missed by code-review-285:

**Architecture:** The three-layer design (utility -> service -> endpoint) is clean. `mountingRules.ts` (154 lines) contains pure parsing and rule logic. `mounting.service.ts` (456 lines) contains business logic with immutable array operations. API endpoints are thin handlers that load, delegate, and persist.

**Validation completeness:** `validateMountPreconditions` checks all 10 rules from the spec. Error messages are descriptive with appropriate HTTP status codes (404 for not found, 400 for validation failures).

**Immutability:** All service functions (`executeMount`, `executeDismount`, `resetMountMovement`, `clearMountOnRemoval`, `clearMountOnFaint`) return new arrays via `.map()`. No input mutation.

**Dismount position finding:** `findDismountPosition` correctly handles multi-tile mounts by iterating over the full footprint perimeter. Grid bounds checking prevents out-of-bounds placement. The candidate ordering (right, left, below, above, diagonals) is deterministic and sensible.

**Faint coverage:** Both damage paths call `clearMountOnFaint`:
- `damage.post.ts` line 120: checks `faintedFromAnySource` (direct damage OR heavily injured penalty)
- `next-turn.post.ts` line 210: checks `currentHp === 0` after tick damage and heavily injured penalty

**Round reset:** `resetCombatantsForNewRound` in `next-turn.post.ts` (lines 631-646) recalculates `movementRemaining` from the mount's Overland speed. Mounts use their own speed; riders look up the mount partner's speed. This correctly handles cases where a mount evolved or had speed changes between rounds.

**WebSocket sync:** `updateFromWebSocket` in the encounter store (line 802) syncs `mountState` via direct assignment from incoming data, consistent with the surgical update pattern for other combatant fields.

**Store getters:** Four clean getter functions (`mountedRiders`, `isMountedRider`, `isBeingRidden`, `getMountPartner`) provide ergonomic access to mount relationships. These are consistent with existing getter patterns in the store.

**Combatant removal:** `[combatantId].delete.ts` correctly calls `clearMountOnRemoval` to clean up the partner's mount state when a combatant is removed from the encounter.

**No regressions detected.** The fix cycle touched only the specific locations identified in code-review-285 without modifying any surrounding logic. All existing paths (damage, tick damage, round reset, combatant removal, WebSocket sync) continue to work as verified in the original review.

## What Looks Good

1. **Fix precision.** Each fix commit addresses exactly the issue identified, with no unnecessary scope creep. c26d7a6e combines CRIT-001 and HIGH-002 sensibly since they share the same code location.

2. **Client-server distance parity.** Both `useEncounterActions.ts` and `position.post.ts` use `ptuDiagonalDistance` with the same delta calculation pattern, ensuring movement remaining is decremented identically on client and server.

3. **Immutable pattern consistency.** The `mountState` updates in the CRIT-001 fix use spread operators (`{ ...localCombatant.mountState, movementRemaining: newMovementRemaining }`) rather than direct property mutation, matching the project's reactive state conventions.

4. **Forward compatibility for dismount skipCheck.** The underscore-prefixed `_skipCheck` parameter in `executeDismount` is a clean signal that the parameter is accepted but intentionally unused until P1 implements dismount checks on damage/push.

5. **Complete duplicate removal.** The MED-002 fix removes the function AND its import AND verifies no other callers exist. Single source of truth for Overland speed.

6. **Thorough app-surface.md update.** The MED-001 fix adds documentation in four separate locations (endpoints, system paragraph, utility paragraph, services table), all accurate and following the existing document structure.

7. **Decree compliance maintained.** All decree-relevant mechanics verified:
   - decree-003: mounted pairs share the mount's grid position (confirmed in `executeMount` line 169, `position.post.ts` line 105)
   - decree-004: `triggersDismountCheck` accepts `hpDamage` (real HP after temp HP), confirmed in comment on line 149 of `mountingRules.ts`

## Verdict

**APPROVED**

All 6 issues from code-review-285 have been correctly and completely resolved. No new issues found. No regressions to previously approved PTU mechanics. The fix commits are well-scoped, the immutable patterns are correct, and the client-server synchronization logic is sound. Feature-004 P0 is ready to proceed.
