---
review_id: code-review-285
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - 4aeffa21
  - ac8f83de
  - f78e8fd9
  - 909c9ebd
  - a90475ba
  - 291fa57f
  - 65976f3e
  - 9a09326e
  - 831f596b
  - 5d6b62e4
  - deeed2be
  - c10b6c24
  - 05b1937b
  - 886cbb94
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/utils/mountingRules.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/position.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/combatants/[combatantId].delete.ts
  - app/composables/useGridMovement.ts
  - app/stores/encounter.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-02T22:00:00Z
follows_up: null
---

## Review Scope

Reviewing feature-004 P0: Pokemon Mounting System -- 14 commits implementing core mount relationship data model, Mountable capability parsing, mount/dismount API endpoints, mount state in combat turn system, linked movement, auto-dismount on faint, and WebSocket sync.

Design spec: `artifacts/designs/design-mounting-001/spec-p0.md`
Decrees verified: decree-001 (minimum damage), decree-003 (token blocking / shared position), decree-004 (massive damage temp HP for dismount checks)

## Issues

### CRITICAL

**CRIT-001: Client-side linked movement does not update mount partner position locally**

File: `app/composables/useEncounterActions.ts` (lines 241-253)

`handleTokenMove` calls `updateCombatantPosition` on the server (which correctly saves BOTH the mover and partner positions to the DB), then locally updates ONLY the moved combatant:

```typescript
const localCombatant = encounterStore.encounter.combatants.find(c => c.id === combatantId)
if (localCombatant) {
  localCombatant.position = position
}
```

The mount partner's position is NOT updated in local state. While `broadcastUpdate()` sends the encounter to the group view, the GM's local encounter store still has stale partner position until the next full refresh cycle. This means:

1. On the GM view, when a rider moves, the mount token visually stays at the old position until a round-trip refresh.
2. The `broadcastUpdate()` sends the stale local state to group view via WebSocket, so the group view also sees the partner at the wrong position.
3. Subsequent movement validation uses stale local positions, potentially causing incorrect adjacency/occupancy calculations.

Fix: After `updateCombatantPosition` succeeds, update the partner combatant's position locally too:

```typescript
const localCombatant = encounterStore.encounter.combatants.find(c => c.id === combatantId)
if (localCombatant) {
  localCombatant.position = position
  // Linked movement: update mount partner position locally (feature-004)
  if (localCombatant.mountState) {
    const partner = encounterStore.encounter.combatants.find(
      c => c.id === localCombatant.mountState!.partnerId
    )
    if (partner) {
      partner.position = { ...position }
    }
  }
}
```

Also decrement `movementRemaining` on both combatants' `mountState` locally, matching the server-side logic in `position.post.ts`.

### HIGH

**HIGH-001: `skipCheck` parameter accepted by store but ignored by server**

Files: `app/stores/encounter.ts` (lines 991, 1009, 1020, 1037), `app/server/api/encounters/[id]/mount.post.ts`, `app/server/api/encounters/[id]/dismount.post.ts`, `app/server/services/mounting.service.ts`

The store's `mountRider(riderId, mountId, skipCheck?)` and `dismountRider(riderId, forced?, skipCheck?)` methods send `skipCheck` in the request body. However, neither API endpoint nor the mounting service reads or uses this parameter. The spec (Section C) explicitly includes `skipCheck?: boolean  // GM override: skip the DC 10 check` in the request body.

This means the GM has no way to override the mounting check, which is important for GM flexibility (e.g., when the trainer already passed the check at the table and the GM just wants to record the result).

Fix: Read `body.skipCheck` in both endpoints and pass it through to the service. When `skipCheck` is true, set `checkRequired: false` in the mount result regardless of Mounted Prowess.

**HIGH-002: `movementRemaining` not decremented locally in `useGridMovement` speed function**

File: `app/composables/useGridMovement.ts` (lines 188-193, 236-239)

Both `getMaxPossibleSpeed` and `getSpeed` return `combatant.mountState.movementRemaining` for mounted combatants. This is correct for initial calculation. However, after the rider moves (consuming movement), the client-side `movementRemaining` is never decremented locally. The server decrements it in `position.post.ts` (line 90-98), but the local combatant's `mountState.movementRemaining` stays at the pre-move value until the next full state refresh.

This means the movement range highlight on the VTT grid will show the full remaining range even after partial movement, leading to incorrect movement previews. The rider could appear to have more movement available than they actually do.

Fix: Decrement `mountState.movementRemaining` on both rider and mount locally in `handleTokenMove` (same fix location as CRIT-001). This ensures the movement highlight accurately reflects remaining movement.

### MEDIUM

**MED-001: `app-surface.md` not updated with new endpoints and service**

File: `.claude/skills/references/app-surface.md`

Two new API endpoints (`mount.post.ts`, `dismount.post.ts`), one new service (`mounting.service.ts`), and one new utility (`mountingRules.ts`) were added but `app-surface.md` was not updated. The spec's file change table (Section "Summary of File Changes") lists these new files. Per project conventions, `app-surface.md` should document new endpoints, services, and utilities so other skills and agents can discover them.

Fix: Add a mounting section to `app-surface.md` documenting the new endpoints, service, and utility.

**MED-002: Duplicate movement speed logic in `getMovementSpeedForMount` vs `getOverlandSpeed`**

Files: `app/utils/mountingRules.ts` (lines 160-164), `app/utils/combatantCapabilities.ts` (lines 63-69)

`getMovementSpeedForMount` and `getOverlandSpeed` contain identical logic for Pokemon (`pokemon.capabilities?.overland ?? 5`). The mount service uses both: `getMovementSpeedForMount` for initial mount (line 156) and `getOverlandSpeed` for round reset (line 338, 351). While they currently produce identical results, having two code paths for the same value is fragile -- if one is updated and the other is not, movement will be inconsistent between mount-time and round-reset.

Fix: Remove `getMovementSpeedForMount` from `mountingRules.ts` and use `getOverlandSpeed` from `combatantCapabilities.ts` everywhere. Import it in the mounting service for initial mount as well.

**MED-003: `damage.post.ts` and `next-turn.post.ts` use array mutation pattern for mount-on-faint**

Files: `app/server/api/encounters/[id]/damage.post.ts` (lines 125-127), `app/server/api/encounters/[id]/next-turn.post.ts` (lines 216-218)

Both endpoints use this pattern to replace the combatants array:

```typescript
combatants.length = 0
mountResult.combatants.forEach((c: any) => combatants.push(c))
```

While the comment says "Acceptable mutation here because combatants are freshly parsed from JSON," the `clearMountOnFaint` function returns a new array (immutable pattern). The endpoint then destroys the old array contents and pushes the new ones in. This works but is unnecessarily fragile -- it mutates an array that was passed by reference through multiple functions.

A cleaner approach would be to reassign the local variable:

```typescript
let combatants = JSON.parse(encounter.combatants)
// ... later ...
if (mountResult.dismounted) {
  combatants = mountResult.combatants
}
```

In `damage.post.ts`, `combatants` is already declared with `const` from `loadEncounter`, so the array-splice pattern was used to work around that. Changing to `let` would be cleaner. In `next-turn.post.ts`, `combatants` is `const` from `JSON.parse`, same situation.

Fix: Change `const combatants` to `let combatants` in both files and use simple reassignment instead of the splice-push pattern.

## What Looks Good

1. **Clean architecture separation.** The three-layer design (utility `mountingRules.ts` -> service `mounting.service.ts` -> API endpoints) follows the project's established patterns. Pure validation and rule logic in the utility, business logic in the service, thin API handlers.

2. **Immutable combatant updates in the service.** `executeMount`, `executeDismount`, `resetMountMovement`, `clearMountOnRemoval`, and `clearMountOnFaint` all return new arrays via `.map()` without mutating inputs. This matches the project's immutability requirements.

3. **Comprehensive validation in `validateMountPreconditions`.** All 10 validation rules from the spec are implemented: human rider, Pokemon mount, Mountable capability, capacity check, already-mounted check, same-side check, adjacency check, rider status conditions, mount not fainted.

4. **Decree compliance is solid.**
   - Decree-003: Rider moves to mount's position on mount (shared grid square). Dismount places rider adjacent. Correct per "Mounted pairs occupy the mount's position."
   - Decree-004: `triggersDismountCheck` uses `hpDamage` (real HP after temp HP absorption), correctly citing decree-004 in the comment.
   - Decree-001: Not directly relevant to mounting, but the minimum damage floor is unaffected by these changes.

5. **Dismount position placement.** The `findDismountPosition` function handles multi-tile mounts correctly, generating candidates around the full footprint (right, left, below, above, diagonals). Grid bounds checking prevents out-of-bounds placement. Returns null when all adjacent cells are occupied, requiring GM manual placement.

6. **Faint auto-dismount covers all damage paths.** Both `damage.post.ts` (direct damage) and `next-turn.post.ts` (tick damage, heavily injured penalty) call `clearMountOnFaint`, ensuring mount state is always cleared when a mounted combatant faints regardless of damage source.

7. **WebSocket surgical update.** The fix in commit 886cbb94 correctly adds `mountState` to the per-property surgical sync in `updateFromWebSocket`, ensuring mount state changes propagate to group view without full encounter reload.

8. **New round reset logic.** The `resetCombatantsForNewRound` function in `next-turn.post.ts` correctly recalculates `movementRemaining` from the mount's Overland speed at round start, and the `resetMountMovement` service function provides an immutable alternative for other callers.

9. **Commit granularity is excellent.** 14 small, focused commits each addressing a single concern: types, utility, service, endpoint, store, composable change, each individually reviewable and independently working.

10. **PTU rules accurately implemented.** Mounting as Standard Action, Expert skill free mount, Mounted Prowess auto-success, 1/4 HP dismount check threshold, shared movement between rider and mount turns -- all match PTU p.218 and p.306-307.

## Verdict

**CHANGES_REQUIRED**

The critical issue (CRIT-001) is a real bug that will cause visual desync of mounted pair tokens on both GM and group views during movement. The two high issues (skipCheck dead parameter, local movementRemaining not decremented) are functional gaps that will cause user confusion. These three must be fixed before P0 can be approved.

The medium issues (app-surface update, duplicate speed function, mutation pattern) should be fixed in the same pass since the developer is already in these files.

## Required Changes

1. **CRIT-001:** Update `handleTokenMove` in `useEncounterActions.ts` to locally update the mount partner's position and decrement `movementRemaining` on both combatants after position update succeeds.
2. **HIGH-001:** Wire `skipCheck` parameter through mount/dismount endpoints to the mounting service.
3. **HIGH-002:** Decrement `mountState.movementRemaining` locally on both rider and mount in `handleTokenMove` (same location as CRIT-001 fix).
4. **MED-001:** Update `app-surface.md` with new mounting endpoints, service, and utility.
5. **MED-002:** Remove `getMovementSpeedForMount` and use `getOverlandSpeed` everywhere.
6. **MED-003:** Change `const combatants` to `let combatants` in `damage.post.ts` and `next-turn.post.ts` and use reassignment instead of splice-push.
