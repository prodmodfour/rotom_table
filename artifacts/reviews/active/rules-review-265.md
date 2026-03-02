---
review_id: rules-review-265
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - fa55ac84
  - 9007ce5d
  - c26d7a6e
  - f5ae1952
  - 82a06a0e
  - 9a09326e
  - 291fa57f
  - a90475ba
  - 909c9ebd
  - f78e8fd9
mechanics_verified:
  - mount-action-cost
  - mountable-capability-parsing
  - mounted-prowess-edge
  - expert-skill-free-mount
  - mount-movement-sharing
  - mount-movement-reset
  - dismount-threshold
  - auto-dismount-on-faint
  - dismount-position-placement
  - linked-movement
  - skip-check-gm-override
  - movement-remaining-local-sync
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Pokemon-as-Mounts
  - core/05-pokemon.md#Using-Mounts-in-Battle
  - core/10-indices-and-reference.md#Mountable-X
  - core/03-skills-edges-and-features.md#Mounted-Prowess
  - errata-2.md
reviewed_at: 2026-03-02T23:15:00Z
follows_up: rules-review-261
---

## Mechanics Verified

This re-review verifies that the 5 fix commits addressing code-review-285 issues (1 CRITICAL, 2 HIGH, 3 MEDIUM) did not regress any PTU mounting mechanics previously approved in rules-review-261, and that the fixes themselves are rule-correct.

### 1. Linked Movement -- Client-Side Position Sync (CRIT-001 fix)

- **Rule:** "When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities instead of your own." (`core/05-pokemon.md`, p.218). Rider and mount share position while mounted; when either moves, both move together.
- **Implementation:** `handleTokenMove` in `useEncounterActions.ts` (commit c26d7a6e) now:
  1. Calculates `distanceMoved` using `ptuDiagonalDistance` between old and new positions.
  2. Updates the moving combatant's `mountState.movementRemaining` by subtracting `distanceMoved` (clamped to 0).
  3. Finds the mount partner via `localCombatant.mountState.partnerId` and updates the partner's `position` to match.
  4. Syncs the partner's `mountState.movementRemaining` to the same decremented value.
  This mirrors the server-side logic in `position.post.ts:82-120` exactly.
- **Status:** CORRECT -- The fix ensures client-local state matches server state before the WebSocket broadcast, preventing visual desync of mounted tokens. The movement distance calculation uses the same `ptuDiagonalDistance` function as the server, ensuring consistent results.

### 2. Movement Remaining Local Decrement (HIGH-002 fix)

- **Rule:** Movement is a shared budget between rider and mount each round. The rider consumes movement on their trainer turn; the mount uses the remainder on its Pokemon turn. (`core/05-pokemon.md`, p.218: "your Mount may use any unused movement to Shift")
- **Implementation:** The same fix in commit c26d7a6e decrements `movementRemaining` on both the moving combatant and the partner locally. `useGridMovement.ts` reads `combatant.mountState.movementRemaining` for both `getSpeed` (line 238-239) and `getMaxPossibleSpeed` (line 191-193). After the fix, these functions now return the correctly decremented value, so movement range highlighting on the VTT grid accurately reflects remaining movement after partial moves.
- **Status:** CORRECT -- Shared movement budget is correctly modeled. The decrement happens BEFORE `broadcastUpdate()`, so both GM view and group view see the updated remaining movement.

### 3. skipCheck GM Override (HIGH-001 fix)

- **Rule:** "Mounting a Pokemon is a Standard Action with an Acrobatics or Athletics Check with a DC of 10." (`core/05-pokemon.md`, p.218). Mounted Prowess: "You automatically succeed at Acrobatics and Athletics Checks made to mount a Pokemon." (`core/03-skills-edges-and-features.md`, p.139/217). GM override is a system-level feature, not a PTU rule, but it must not break the check logic when NOT used.
- **Implementation:** Commit 9007ce5d:
  - `mount.post.ts` now reads `body.skipCheck` and passes it to `executeMount(combatants, body.riderId, body.mountId, body.skipCheck)`.
  - `dismount.post.ts` now reads `body.skipCheck` and passes it to `executeDismount(...)` as the `_skipCheck` parameter (prefixed underscore -- forward compatibility for P1 dismount checks).
  - `mounting.service.ts` `executeMount` now accepts `skipCheck?: boolean`. Logic: `const checkRequired = skipCheck ? false : !checkAutoSuccess`. When `skipCheck` is falsy, behavior is identical to pre-fix: `checkRequired = !checkAutoSuccess` (Mounted Prowess auto-succeeds, others require check). When `skipCheck` is true, `checkRequired = false` regardless of Mounted Prowess.
- **PTU Rule Impact:** When `skipCheck` is NOT used (normal gameplay), the check logic is identical to the pre-fix version. Mounted Prowess still auto-succeeds (line 153: `const checkAutoSuccess = hasMountedProwess(rider)`). The DC 10 constant (`MOUNT_CHECK_DC = 10`) is still exported and available. The `MOUNTED_PROWESS_REMAIN_BONUS = 3` constant is still exported. No rule logic was altered for normal (non-GM-override) flow.
- **Status:** CORRECT -- No regression to PTU check mechanics.

### 4. Duplicate Movement Speed Function Removal (MED-002 fix)

- **Rule:** The mount's movement speed for the shared budget is the mount Pokemon's Overland capability. (`core/05-pokemon.md`, p.218: "Mount's Movement Capabilities")
- **Implementation:** Commit fa55ac84 removed `getMovementSpeedForMount()` from `mountingRules.ts` and replaced its usage in `mounting.service.ts:executeMount` (line 157) with `getOverlandSpeed(mount)` from `combatantCapabilities.ts`. The `getOverlandSpeed` function returns `pokemon.capabilities?.overland ?? 5` for Pokemon and `5` for humans -- identical logic to the removed function. Now both mount-time and round-reset use the same `getOverlandSpeed` function:
  - Mount-time: `mounting.service.ts:157` -- `const mountMovement = getOverlandSpeed(mount)`
  - Round-reset (service): `mounting.service.ts:340,353` -- `const mountSpeed = getOverlandSpeed(c)` / `const mountSpeed = getOverlandSpeed(mountPartner)`
  - Round-reset (next-turn): `next-turn.post.ts:636,642` -- `const mountSpeed = getOverlandSpeed(c)` / `const mountSpeed = getOverlandSpeed(mountPartner)`
- **Status:** CORRECT -- Single source of truth for mount movement speed. No change to the actual value returned; only eliminated the duplicate code path.

### 5. Immutable Array Reassignment for Mount-on-Faint (MED-003 fix)

- **Rule:** When a mount faints, the rider is automatically dismounted. (`core/05-pokemon.md`, p.218 -- implicit: a fainted Pokemon cannot support a rider)
- **Implementation:** Commit f5ae1952 changed `damage.post.ts` from `const` to `let combatants` and replaced the splice-push pattern (`combatants.length = 0; mountResult.combatants.forEach(push)`) with clean reassignment (`combatants = mountResult.combatants`). Same change in `next-turn.post.ts`. The `clearMountOnFaint` function was NOT modified -- it still returns a new array via `.map()`. The downstream `saveEncounterCombatants(id, combatants)` call now receives the `clearMountOnFaint` output array directly.
- **PTU Rule Impact:** The auto-dismount logic is unchanged. The same `clearMountOnFaint` function handles:
  - Mount faints: rider placed adjacent via `findDismountPosition`, both mount states cleared.
  - Rider faints: both mount states cleared, no position change.
  Both cases are still triggered from both damage paths (`damage.post.ts:117-128`) and tick damage paths (`next-turn.post.ts:209-217`).
- **Status:** CORRECT -- No functional change to auto-dismount behavior.

### 6. Re-verification of Original P0 Mechanics

All mechanics verified in rules-review-261 were re-checked against the post-fix code to confirm no regressions:

#### Mount Action Cost
- `mountingRules.ts:MOUNT_CHECK_DC = 10` -- unchanged.
- `getMountActionCost()` returns `'standard'` or `'free_with_shift'` -- unchanged.
- `executeMount` sets `standardActionUsed: true` when `actionCost === 'standard'` -- unchanged (lines 170-172).
- **No regression.**

#### Mountable Capability Parsing
- `parseMountableCapacity()` regex and capacity logic -- unchanged.
- `isMountable()`, `getMountCapacity()`, `countCurrentRiders()` -- unchanged.
- `validateMountPreconditions()` capacity check -- unchanged (lines 88-96).
- **No regression.**

#### Mounted Prowess Edge
- `hasMountedProwess()` checks trainer edges -- unchanged.
- `MOUNTED_PROWESS_REMAIN_BONUS = 3` -- unchanged.
- `checkAutoSuccess = hasMountedProwess(rider)` -- unchanged (line 153). The only change is that `skipCheck` can now ALSO set `checkRequired = false`, but it does NOT affect `checkAutoSuccess` (the response still accurately reports whether auto-success came from Mounted Prowess or GM override).
- **No regression.**

#### Expert Skill Free Mount
- `hasExpertMountingSkill()` checks Acrobatics/Athletics for Expert/Master -- unchanged.
- `FREE_MOUNT_MIN_SHIFT = 2` -- unchanged.
- **No regression.**

#### Dismount Check Threshold
- `triggersDismountCheck()` -- unchanged. Still uses `hpDamage >= Math.floor(maxHp / 4)`.
- `DISMOUNT_CHECK_DC = 10` -- unchanged.
- decree-004 compliance: parameter name `hpDamage` with decree-004 citation -- unchanged.
- **No regression.**

#### Dismount Position Placement
- `findDismountPosition()` -- unchanged. Multi-tile mount footprint candidates, bounds check, occupied check.
- `buildOccupiedCellSet()` -- unchanged.
- **No regression.**

#### Combatant Removal Clears Mount
- `clearMountOnRemoval()` -- unchanged.
- **No regression.**

#### Mount Movement Reset on New Round
- `resetCombatantsForNewRound()` in `next-turn.post.ts:589-648` -- mount reset block unchanged (lines 631-646). Still recalculates from `getOverlandSpeed`.
- `resetMountMovement()` in `mounting.service.ts:334-365` -- unchanged.
- **No regression.**

#### WebSocket Surgical Sync
- `encounter.ts:802` -- `existing.mountState = incomingCombatant.mountState` -- unchanged.
- **No regression.**

## Decree Compliance

### decree-001: Minimum 1 damage at both post-defense and final steps
Not directly relevant to mounting. No mounting code touches damage calculation. **COMPLIANT.**

### decree-003: All tokens passable; enemy-occupied squares are rough terrain
Mounted pairs still share the mount's grid position (rider moved to mount's position on mount, `mounting.service.ts:169`). Dismount places rider adjacent via `findDismountPosition`. The no-stacking rule is respected. Linked movement updates both positions to the same destination. **COMPLIANT.**

### decree-004: Massive damage check uses real HP lost after temp HP absorption
`triggersDismountCheck()` still takes `hpDamage` (real HP lost after temp HP absorption) with decree-004 citation in the comment. **COMPLIANT.**

## Summary

All 5 fix commits correctly address the issues identified in code-review-285 without introducing any regressions to the PTU mounting mechanics previously verified in rules-review-261.

**Fix verification:**
1. **CRIT-001 (c26d7a6e):** Client-side linked movement now updates both partner position and movementRemaining locally before broadcast. Movement distance uses `ptuDiagonalDistance` matching the server-side calculation.
2. **HIGH-001 (9007ce5d):** `skipCheck` parameter is wired through endpoints to service. Normal (non-override) flow is unchanged -- `checkRequired` still defaults to `!checkAutoSuccess`.
3. **HIGH-002 (c26d7a6e):** `movementRemaining` is decremented locally on both rider and mount, so `useGridMovement`'s speed functions return correct remaining movement for VTT range highlighting.
4. **MED-002 (fa55ac84):** Duplicate function removed. Single `getOverlandSpeed` used everywhere for consistent mount speed calculation.
5. **MED-003 (f5ae1952):** Array mutation replaced with clean reassignment. No change to auto-dismount logic.

**Original P0 mechanics:** All 14 mechanics verified in rules-review-261 remain intact. No formula changes, no constant changes, no validation logic changes, no faint handling changes.

**P1-deferred mechanics** (Push dismount trigger, Confusion dismount trigger) remain unimplemented as expected for P0 scope. The `_skipCheck` parameter on `executeDismount` is correctly prepared for P1 forward compatibility.

## Rulings

- **Shared movementRemaining budget:** The client-side decrement mirrors server-side logic exactly. Both use `Math.max(0, movementRemaining - distanceMoved)` with `ptuDiagonalDistance`. This correctly models PTU p.218's shared movement: rider uses mount's movement on trainer turn, mount uses remainder on Pokemon turn.
- **GM skipCheck override:** Does not affect any PTU rule when disabled (default). When enabled, it bypasses only the DC 10 check, not the validation preconditions (adjacency, capacity, Mountable capability, etc.). This is a reasonable GM tool that does not violate PTU rules.
- **getOverlandSpeed as mount speed source:** PTU p.218 says "Mount's Movement Capabilities." Using Overland speed as the primary mount speed is correct for ground movement. Swim, Burrow, and Sky speeds for mounted movement are P1/P2 scope.

## Verdict

**APPROVED**

No critical, high, or medium PTU rule issues found. All fix commits are rule-correct and introduce no regressions to previously approved mechanics. Decree compliance verified for decree-001, decree-003, and decree-004.

## Required Changes

None.
