---
review_id: rules-review-261
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - 886cbb94
  - 05b1937b
  - c10b6c24
  - deeed2be
  - 5d6b62e4
  - 831f596b
  - 9a09326e
  - 65976f3e
  - 291fa57f
  - a90475ba
  - 909c9ebd
  - f78e8fd9
  - ac8f83de
  - 4aeffa21
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
  - combatant-removal-mount-clear
  - websocket-mount-sync
  - decree-003-shared-position
  - decree-004-temp-hp-dismount
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/05-pokemon.md#Pokemon-as-Mounts
  - core/05-pokemon.md#Using-Mounts-in-Battle
  - core/10-indices-and-reference.md#Mountable-X
  - core/03-skills-edges-and-features.md#Mounted-Prowess
  - errata-2.md
reviewed_at: 2026-03-02T22:45:00Z
follows_up: null
---

## Mechanics Verified

### 1. Mount Action Cost (Standard Action, DC 10)

- **Rule:** "Mounting a Pokemon is a Standard Action with an Acrobatics or Athletics Check with a DC of 10." (`core/05-pokemon.md`, p.218)
- **Implementation:** `getMountActionCost()` in `mountingRules.ts:137-144` returns `'standard'` by default. `MOUNT_CHECK_DC = 10` at line 23. The mount endpoint (`mount.post.ts`) calls `executeMount()` which calls `getMountActionCost()` and sets `turnState.standardActionUsed = true` when `actionCost === 'standard'` (`mounting.service.ts:170-172`).
- **Status:** CORRECT

### 2. Expert Skill Free Mount During Shift

- **Rule:** "If your Acrobatics or Athletics is at least Expert, then you may Mount your Pokemon as part of your Shift as a Free Action, so long as you can move at least 2 meters before getting onto your Pokemon." (`core/05-pokemon.md`, p.218)
- **Implementation:** `hasExpertMountingSkill()` in `mountingRules.ts:119-128` checks both Acrobatics and Athletics for `Expert` or `Master` rank. `FREE_MOUNT_MIN_SHIFT = 2` exported at line 32. `getMountActionCost()` returns `'free_with_shift'` when expert skill detected. The mount service does NOT consume `standardActionUsed` when `actionCost !== 'standard'` (`mounting.service.ts:170-172`).
- **Note:** The 2m minimum movement prerequisite is exposed as a constant but the P0 server-side validation does not enforce it at mount time. The design spec scopes this enforcement to P1 (UI integration with movement tracking). This is acceptable for P0 -- the constant exists for future use and the action cost response correctly reports `'free_with_shift'` so the client can enforce the 2m rule.
- **Status:** CORRECT

### 3. Mountable X Capability Parsing

- **Rule:** "Mountable X: This Pokemon may serve as a mount for X average Trainers regardless of Power Capability and ignoring penalties for weight carried." (`core/10-indices-and-reference.md`, p.306-307)
- **Implementation:** `parseMountableCapacity()` in `mountingRules.ts:48-63` parses "Mountable N" with regex `^mountable\s+(\d+)$/i` and handles bare "Mountable" as capacity 1. `countCurrentRiders()` at line 92 counts active riders. `validateMountPreconditions()` at `mounting.service.ts:90-97` compares current riders against capacity.
- **Status:** CORRECT

### 4. Mounted Prowess Edge

- **Rule:** "Mounted Prowess -- Prerequisites: Novice Acrobatics or Athletics -- Effect: You automatically succeed at Acrobatics and Athletics Checks made to mount a Pokemon, and you gain a +3 Bonus to all Acrobatics and Athletics Checks made to remain Mounted." (`core/03-skills-edges-and-features.md`, p.139)
- **Implementation:** `hasMountedProwess()` in `mountingRules.ts:106-112` checks trainer edges for "mounted prowess" (case-insensitive). `MOUNTED_PROWESS_REMAIN_BONUS = 3` exported at line 29. Mount endpoint returns `checkAutoSuccess: true` when Mounted Prowess detected (`mounting.service.ts:153-154`), and `checkRequired: false` to signal the client that no roll is needed.
- **Status:** CORRECT

### 5. Rider Uses Mount's Movement Capabilities

- **Rule:** "When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities instead of your own." (`core/05-pokemon.md`, p.218)
- **Implementation:** `getMovementSpeedForMount()` in `mountingRules.ts:160-164` returns `pokemon.capabilities.overland` for the mount Pokemon. The `mountState.movementRemaining` field on both rider and mount combatants is initialized to this value at mount time (`mounting.service.ts:156-166`). The position endpoint (`position.post.ts:82-120`) links movement of mounted pairs -- when either partner moves, both positions update and `movementRemaining` is decremented on both.
- **Status:** CORRECT

### 6. Mount Keeps Unused Movement + Standard Action

- **Rule:** "During Pokemon turns, your Mount may use any unused movement to Shift, and may take a Standard Action as normal if you use your Pokemon turn on it." (`core/05-pokemon.md`, p.218)
- **Implementation:** The shared `movementRemaining` field tracks remaining movement across both the rider's trainer turn and the mount's Pokemon turn. The mount's `turnState` is independent -- mounting does NOT consume the mount's `standardActionUsed` (only the rider's, `mounting.service.ts:170-172`). The mount can use whatever `movementRemaining` is left on its Pokemon turn.
- **Status:** CORRECT

### 7. Mount Movement Reset on New Round

- **Rule:** Movement is per-round, reset at round boundaries. (Implicit in PTU movement rules -- each combatant gets fresh movement each round.)
- **Implementation:** `resetCombatantsForNewRound()` in `next-turn.post.ts:594-609` resets `movementRemaining` on both mount and rider. The mount's value is recalculated from `getOverlandSpeed(mount)`, and the rider's is synced to the same value. `resetMountMovement()` in `mounting.service.ts:332-363` implements the same logic as a pure function (used by the store). Both implementations are functionally equivalent.
- **Status:** CORRECT

### 8. Dismount Check Threshold (1/4 Max HP Damage)

- **Rule:** "If either you or your Pokemon who is being used as a Mount are hit by a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points, or are hit by a move with a Push Effect, you must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." (`core/05-pokemon.md`, p.218)
- **Implementation:** `triggersDismountCheck()` in `mountingRules.ts:151-153` checks `hpDamage >= Math.floor(maxHp / 4)`. The function takes `hpDamage` (real HP lost after temp HP absorption) per decree-004. `DISMOUNT_CHECK_DC = 10` at line 26.
- **Note:** The function uses `Math.floor(maxHp / 4)` which means for a 100 HP Pokemon, the threshold is 25 damage. For 101 HP, the threshold is 25. This is the standard PTU convention (round down). The `>=` operator correctly implements "equal or greater to."
- **Decree compliance:** Per decree-004, "only real HP lost (after temp HP absorption) counts toward the massive damage threshold." The same principle is explicitly applied here via the parameter name `hpDamage` and the comment citing decree-004.
- **Status:** CORRECT

### 9. Auto-Dismount on Faint

- **Rule:** When a mount faints, the rider cannot remain mounted (implicit -- a fainted Pokemon cannot support a rider).
- **Implementation:** `clearMountOnFaint()` in `mounting.service.ts:392-454` handles both cases:
  - **Mount faints:** Rider is auto-dismounted with position placement via `findDismountPosition()`. Mount state cleared on both.
  - **Rider faints:** Mount state cleared on both (no position change needed since rider stays in place).
  - Called from `damage.post.ts:115-128` after faint detection.
  - Called from `next-turn.post.ts:209-219` after tick damage faint detection.
- **Status:** CORRECT

### 10. Linked Movement (Rider + Mount Move Together)

- **Rule:** Rider and mount share position while mounted. When either moves, both move. (Implicit in PTU p.218 -- the rider is "on" the mount, they occupy the same space.)
- **Implementation:** `position.post.ts:82-120` checks `movingCombatant.mountState` and if present, updates BOTH the moving combatant and their partner to the same position, decrementing `movementRemaining` on both mount states to the same new value. Per decree-003, mounted pairs occupy the mount's position (rider and mount share the same grid square).
- **Status:** CORRECT

### 11. Dismount Position Placement

- **Rule:** When dismounting, rider must be placed adjacent (cannot share square per decree-003 no-stacking rule).
- **Implementation:** `findDismountPosition()` in `mounting.service.ts:225-256` generates candidate positions around the mount's footprint (right, left, below, above, then diagonals) accounting for multi-tile mounts. Returns `null` if all adjacent cells occupied (GM must manually place). `buildOccupiedCellSet()` at line 205 excludes the rider from occupied cells since they are moving off the mount.
- **Status:** CORRECT

### 12. Combatant Removal Clears Mount State

- **Rule:** Mount relationship must be cleaned up when a combatant is removed from the encounter.
- **Implementation:** `clearMountOnRemoval()` in `mounting.service.ts:371-384` clears mount state on any partner whose `partnerId` matches the removed combatant. Called from `combatants/[combatantId].delete.ts:47` after the combatant is spliced from the array.
- **Status:** CORRECT

### 13. WebSocket Surgical Update Sync

- **Rule:** Mount state must sync to Group View via WebSocket to maintain consistency.
- **Implementation:** `encounter.ts` store `updateFromWebSocket()` at line 793: `existing.mountState = incomingCombatant.mountState` -- the mount state is included in the surgical combatant property sync. Both mount and dismount endpoints broadcast `encounter_update` events.
- **Status:** CORRECT

### 14. Mount Blocking Conditions

- **Rule:** "If a rider's mount hurts itself in Confusion, the rider must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." (`core/05-pokemon.md`, p.218). Additionally, certain conditions prevent mounting.
- **Implementation:** `MOUNT_BLOCKING_CONDITIONS` in `mounting.service.ts:54` blocks mounting while `Fainted`, `Stuck`, or `Frozen`. These are reasonable blocking conditions since a Fainted trainer can't mount, a Stuck trainer can't move to mount, and a Frozen trainer can't move.
- **Note:** The Confusion dismount trigger is acknowledged as P1 scope (it requires integration with the Confusion self-damage resolution system, which is separate from the dismount check threshold). The P0 auto-dismount covers the faint case; the Confusion and Push dismount CHECKS (not auto-dismount, but "roll to remain") are P1 features.
- **Status:** CORRECT (for P0 scope)

## Decree Compliance

### decree-003: Token Blocking and Shared Position
Per decree-003, "Mounted pairs occupy the mount's position -- rider and mount share the same grid square(s)." The implementation correctly places the rider at the mount's position on mount (`mounting.service.ts:168`) and moves both to the same destination during linked movement (`position.post.ts:91-112`). On dismount, the rider is placed adjacent per the no-stacking rule (`findDismountPosition`). **COMPLIANT.**

### decree-004: Massive Damage Temp HP
Per decree-004, "only real HP lost (after temp HP absorption) counts toward the massive damage threshold." The `triggersDismountCheck()` function takes `hpDamage` (real HP lost after temp HP) and the comment explicitly cites decree-004. The spec also maps this to the dismount threshold per p.218. **COMPLIANT.**

### decree-001: Minimum Damage Floor
decree-001 concerns damage calculation, not mounting. Not directly applicable but not violated.

## Medium Issues

### M1: Push Effect Dismount Trigger Not Implemented (P1 Scope)

- **Rule:** "...or are hit by a move with a Push Effect, you must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." (`core/05-pokemon.md`, p.218)
- **Severity:** MEDIUM
- **Status:** DEFERRED TO P1
- **Details:** Push effects triggering dismount checks are not implemented in P0. The design spec explicitly places Push and Confusion dismount triggers in P1 scope. This is acceptable because: (a) the `triggersDismountCheck` function and `DISMOUNT_CHECK_DC` constant exist and are ready for P1 integration, (b) auto-dismount on faint (the catastrophic case) IS implemented in P0. The non-faint dismount checks (damage threshold, Push, Confusion) are interactive (require a roll from the player) and need UI integration that is P1 scope.
- **Action:** Verify P1 spec covers Push and Confusion dismount triggers.

### M2: Confusion Self-Damage Dismount Trigger Not Implemented (P1 Scope)

- **Rule:** "If a rider's mount hurts itself in Confusion, the rider must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." (`core/05-pokemon.md`, p.218)
- **Severity:** MEDIUM
- **Status:** DEFERRED TO P1
- **Details:** Same rationale as M1. The Confusion self-damage pathway in `status-automation.service.ts` does not currently check for mount state. This needs P1 integration alongside the dismount check UI.
- **Action:** Verify P1 spec covers Confusion self-damage dismount trigger.

## Errata Check

Searched `books/markdown/errata-2.md` for "mount" -- no errata found for mounting rules. The word "mount" only appears incidentally in the errata text (in "amount"). No errata modifications to the mounting system.

## Summary

The P0 implementation of the Pokemon Mounting System correctly implements the core mechanics from PTU p.218 and related rules. All 14 mechanics verified against the rulebook text are CORRECT for P0 scope.

Key findings:
1. **Mount/dismount action economy is correct.** Standard Action for mount, Free Action with Expert skill, Standard Action consumed only on the rider, mount retains its own Standard Action.
2. **Movement sharing is correct.** `movementRemaining` tracked on both combatants, decremented together on linked movement, reset from mount's Overland speed each round.
3. **Mountable capability parsing is correct.** Handles "Mountable N" pattern and bare "Mountable", capacity enforcement works.
4. **Faint auto-dismount is correct.** Both damage and tick damage paths call `clearMountOnFaint`, which handles mount-faint (rider placed adjacent) and rider-faint (state cleared) cases.
5. **Decree compliance is verified.** decree-003 (shared position, no stacking) and decree-004 (temp HP dismount threshold) are properly implemented.
6. **Two P1-deferred mechanics** (Push dismount trigger, Confusion dismount trigger) are not implemented but are explicitly scoped to P1 and do not affect P0 correctness.

## Rulings

- **Mounting as Standard Action / Free Action with Expert skill:** Implementation matches PTU p.218 exactly.
- **Mounted Prowess auto-success and +3 bonus:** Constants and detection are correct per PTU p.139.
- **Dismount threshold at 1/4 max HP using `Math.floor`:** Correct. PTU convention rounds down.
- **Movement sharing via `movementRemaining`:** Novel implementation choice that correctly models the PTU rule of shared movement budget between rider's trainer turn and mount's Pokemon turn.
- **The 2m minimum movement for Expert free mount is not server-enforced in P0.** This is acceptable -- the constant `FREE_MOUNT_MIN_SHIFT = 2` exists, and P1 will integrate it with the movement tracking system.

## Verdict

**APPROVED**

No critical or high issues found. Two medium issues are properly deferred to P1 scope per the design spec. All core PTU mounting mechanics are correctly implemented. Decree compliance verified.

## Required Changes

None. The two MEDIUM issues are already tracked in the P1 design spec.
