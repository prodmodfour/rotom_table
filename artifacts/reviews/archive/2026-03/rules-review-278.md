---
review_id: rules-review-278
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - 5e78402b
  - e2576c85
  - 7994902b
  - bd519560
  - f1f8ba38
  - 0e68ce08
mechanics_verified:
  - dismount-check-threshold-with-heavily-injured
  - movement-modifier-application-order
  - mount-capacity-filtering
  - rider-movement-uses-mount-modified-speed
  - mount-controls-mountable-2-plus
  - decree-004-dismount-threshold-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Using-Mounts-in-Battle (p.218)
  - core/10-indices-and-reference.md#Mountable-X (pp.306-307)
  - core/03-skills-edges-and-features.md#Mounted-Prowess (p.139)
  - core/07-combat.md#Heavily-Injured (p.250)
reviewed_at: 2026-03-03T18:20:00Z
follows_up: rules-review-269
---

## Review Scope

Rules verification of the feature-004 P1 fix cycle (6 commits). rules-review-269 APPROVED the original P1 implementation with 0 issues. This review verifies that the 5 bug fixes do not introduce PTU rule regressions and that the corrected behaviors are themselves rule-accurate.

## Mechanics Verified

### 1. Movement Modifier Application Timing (HIGH-2 fix)

- **Rule:** "When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities instead of your own." (`core/05-pokemon.md`, p.218). Movement modifiers (Stuck, Slowed, Speed CS, Sprint) from the MOUNT's conditions affect mounted movement. These are defined in PTU 1.05 p.231 (Stuck), p.251 (Tripped), p.234 (Speed Combat Stages).
- **Implementation:** The fix restructures where movement modifiers are applied. Instead of re-applying modifiers on every `getSpeed()`/`getMaxPossibleSpeed()` query against a shrinking `movementRemaining` budget (which caused exponential speed loss), modifiers are now applied ONCE upfront:
  - `mounting.service.ts:161` -- `executeMount()` sets `movementRemaining = applyMovementModifiers(mount, getOverlandSpeed(mount))` at mount time.
  - `mounting.service.ts:346` -- `resetMountMovement()` sets `movementRemaining = applyMovementModifiers(c, getOverlandSpeed(c))` at round reset for mounts.
  - `mounting.service.ts:359` -- `resetMountMovement()` syncs rider's `movementRemaining` to the mount's modifier-adjusted speed.
  - `turn-helpers.ts:115-122` -- `resetCombatantsForNewRound()` mirrors the same logic for the server-side turn reset path.
  - `useGridMovement.ts:139-141` (getMaxPossibleSpeed) and `useGridMovement.ts:197-198` (getSpeed) -- Both now return `combatant.mountState.movementRemaining` directly without re-applying modifiers.
  - The `applyMovementModifiers` function was extracted to `utils/movementModifiers.ts` (shared utility) so both client composables and server services use the identical implementation. The composable re-exports it for backward compatibility.
- **Rules verification of `applyMovementModifiers`:** The extracted function in `utils/movementModifiers.ts` correctly implements:
  - Stuck: returns 0 (PTU 1.05 p.231)
  - Tripped: returns 0 (PTU 1.05 p.251) -- checks both `statusConditions` and `tempConditions`
  - Slowed: `Math.floor(speed / 2)` -- halves movement
  - Speed CS: `Math.trunc(clamped / 2)` additive bonus/penalty (PTU 1.05 p.234), with minimum floor of 2 for negative stages
  - Sprint: `Math.floor(speed * 1.5)` -- +50% movement
  - Minimum speed 1 (unless base was 0)
- **Modifiers sourced from mount:** In `mounting.service.ts:161`, the mount combatant is passed to `applyMovementModifiers(mount, ...)`. In `resetMountMovement` (line 346) and `resetCombatantsForNewRound` (turn-helpers.ts:115), the mount combatant (or mount partner for riders) is used. This ensures Slowed/Speed CS/Sprint on the MOUNT affects movement, not the rider's personal conditions.
- **Status:** CORRECT -- Modifiers applied once at budget creation, sourced from mount's conditions. Identical PTU rules logic, just restructured for correct application timing.

### 2. Dismount Check Threshold with Heavily Injured Penalty (MEDIUM-2 fix)

- **Rule:** PTU p.218: "If either you or your Pokemon who is being used as a Mount are hit by a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points." PTU p.250: "Whenever a Heavily Injured Trainer or Pokemon... takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."
- **Implementation:** `damage.post.ts:127` now computes `totalDamageEvent = damageResult.hpDamage + heavilyInjuredHpLoss` and passes this to `triggersDismountCheck(totalDamageEvent, entity.maxHp)` at line 128. The heavily injured penalty (`heavilyInjuredHpLoss`) is calculated at lines 66-78 before the dismount check runs, so the value is available.
- **Rules analysis:** The heavily injured penalty is triggered by "takes Damage from an attack" -- it is additional HP loss that occurs as a direct consequence of the same attack. PTU p.218's dismount threshold refers to "a damaging attack that deals damage." The heavily injured HP loss is part of the total damage event from that attack. Including it in the threshold evaluation is the correct interpretation: the rider/mount experienced a total HP loss of `hpDamage + heavilyInjuredHpLoss` from a single attack event.
- **Decree-004 compliance:** The base `damageResult.hpDamage` already reflects real HP lost after temp HP absorption (per decree-004). Adding `heavilyInjuredHpLoss` (which is also real HP lost, not temp HP) maintains decree-004 compliance.
- **Edge case verification:** If the heavily injured penalty causes fainting, `faintedFromAnySource` is true (line 114), and the dismount check is correctly skipped (line 126 gates on `!faintedFromAnySource`). The auto-dismount on faint at lines 136-144 handles that case instead.
- **Status:** CORRECT -- The total damage event from an attack correctly includes both direct HP damage and heavily injured penalty HP loss for dismount threshold evaluation.

### 3. Mount Capacity Filtering in MountControls (MEDIUM-1 fix)

- **Rule:** PTU pp.306-307: "Mountable X: This Pokemon may serve as a mount for X average Trainers regardless of Power Capability and ignoring penalties for weight carried."
- **Implementation:** `MountControls.vue:210-213` now uses `getMountCapacity(c)` and `countCurrentRiders(c.id, encounter.combatants)` to check if a mount is at capacity, rather than blanket-skipping any Pokemon with a mount state. This correctly allows Mountable 2+ Pokemon to appear as mount options when they have capacity remaining.
- **Function verification:**
  - `getMountCapacity()` in `mountingRules.ts:80-86` calls `parseMountableCapacity()` which correctly parses "Mountable 1", "Mountable 2", etc. from `otherCapabilities`, case-insensitive.
  - `countCurrentRiders()` in `mountingRules.ts:92-96` counts combatants where `mountState.isMounted === true` and `mountState.partnerId === mountId` -- correctly identifying riders pointing to this mount.
  - The server-side `validateMountPreconditions()` in `mounting.service.ts:89-97` uses the same functions for validation, so client and server are consistent.
- **Status:** CORRECT -- Mountable X capacity is properly respected. A Mountable 2 Pokemon carrying 1 rider will still appear as an option (1 < 2). A Mountable 1 Pokemon carrying 1 rider will be filtered out (1 >= 1).

### 4. Mount Partner Name Resolution in Group/Player Cards (MEDIUM-3 fix)

- **Rule:** No specific PTU rule -- this is a UI accuracy concern. Mount relationships should display the partner's identity for tactical awareness.
- **Implementation:** Both `GroupCombatantCard.vue:126-137` and `PlayerCombatantCard.vue:130-141` now call `encounterStore.getMountPartner(props.combatant.id)` and display "Mounted on [partnerName]" for riders or "Carrying [partnerName]" for mounts, matching the CombatantCard (GM view) pattern.
- **Status:** CORRECT -- All three views now consistently show partner names in mount indicators.

### 5. VTT Token Badge Offset (HIGH-1 fix)

- **Rule:** No PTU rule -- visual display fix only. Both mount badge and elevation badge must be simultaneously visible.
- **Implementation:** Mount badge offset from `right: 2px` to `right: 18px`. No game logic impact.
- **Status:** CORRECT -- Visual fix only.

## Regression Check Against rules-review-269

All 16 mechanics approved in rules-review-269 (APPROVED, 0 issues) were re-verified against the fix cycle changes:

### Dismount Check Formula
- `triggersDismountCheck(hpDamage, maxHp)` at `mountingRules.ts:151-153` is UNCHANGED: `hpDamage >= Math.floor(maxHp / 4)`. The fix changes what is passed as the first argument (now includes heavily injured penalty), not the formula itself.
- **No regression.**

### Dismount Check DC and Mounted Prowess
- `DISMOUNT_CHECK_DC = 10` at `mountingRules.ts:26` -- unchanged.
- `MOUNTED_PROWESS_REMAIN_BONUS = 3` at `mountingRules.ts:29` -- unchanged.
- `buildDismountCheckInfo()` at `mountingRules.ts:178-201` -- unchanged.
- `hasMountedProwess()` at `mountingRules.ts:106-112` -- unchanged.
- **No regression.**

### Decree-004 Compliance
- The dismount check still operates on real HP damage after temp HP absorption. The base value `damageResult.hpDamage` is decree-004 compliant. The addition of `heavilyInjuredHpLoss` is also real HP lost (not temp HP), maintaining compliance.
- **No regression.**

### Linked Token Movement
- `position.post.ts` and `useEncounterActions.ts` -- not modified in fix cycle commits.
- **No regression.**

### Mount/Dismount Execution
- `executeMount()` at `mounting.service.ts:145-201` -- the only change is how `mountMovement` is calculated (now applies modifiers upfront). The mount state structure, action cost, check logic, and position sharing are all unchanged.
- `executeDismount()` at `mounting.service.ts:267-326` -- unchanged.
- **No regression.**

### Faint Auto-Dismount
- `clearMountOnFaint()` at `mounting.service.ts:400-462` -- unchanged.
- `damage.post.ts:136-144` faint auto-dismount logic -- unchanged (only the dismount check trigger block was modified).
- **No regression.**

### Intercept Bonus
- `isEasyIntercept()` at `mountingRules.ts:214-222` -- unchanged.
- VTTMountedToken intercept badge -- not modified in fix cycle.
- **No regression.**

### WebSocket mount_change
- `ws.ts` -- not modified in fix cycle.
- **No regression.**

### Mounted Prowess Auto-Succeed
- `mounting.service.ts:153-156` -- `checkAutoSuccess = hasMountedProwess(rider)` logic unchanged. Only the `mountMovement` calculation below it changed.
- **No regression.**

## Decree Compliance

### decree-003: All tokens passable; enemy-occupied squares are rough terrain
Mounted pairs sharing grid squares is unaffected by the fix cycle. The `findDismountPosition()` placement logic is unchanged. **COMPLIANT.**

### decree-004: Massive damage check uses real HP lost after temp HP absorption
The dismount check in `damage.post.ts` continues to use `damageResult.hpDamage` (real HP after temp HP) as the base value. The heavily injured penalty is additive real HP loss, not raw damage. Comment at lines 121-123 explicitly cites decree-004. **COMPLIANT.**

## Rulings

- **Heavily injured HP loss counts toward dismount threshold:** PTU p.250 describes the heavily injured penalty as HP loss that occurs "when a Heavily Injured Trainer or Pokemon takes Damage from an attack." PTU p.218 triggers the dismount check when "a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points." The heavily injured penalty is damage from that same attack event -- it is a cascading consequence of the attack, not a separate damage source. Including it in the dismount threshold is the correct interpretation.

- **Movement modifiers applied once at budget creation, not per-query:** PTU p.218 says the rider uses the "Mount's Movement Capabilities." The mount's movement capabilities are modified by its conditions (Slowed halves, Stuck zeroes, Speed CS adjusts). These modifiers affect the mount's effective movement speed for the round, which becomes the shared movement budget. Applying modifiers once when the budget is set correctly reflects that the mount's movement capability for the round is a fixed quantity derived from its base speed and current conditions. Re-applying modifiers to a decreasing budget would incorrectly penalize movement mid-round.

## Summary

The 6-commit fix cycle resolves all 5 issues from code-review-296 (2H + 3M). No PTU rule regressions were introduced:

1. **HIGH-1 (badge overlap):** Visual fix only, no game logic impact.
2. **HIGH-2 (double movement modifiers):** Correctly restructured to apply modifiers once upfront. The shared `applyMovementModifiers` utility correctly implements all PTU movement rules (Stuck, Tripped, Slowed, Speed CS, Sprint). All three code paths where movement budget is set (executeMount, resetMountMovement, resetCombatantsForNewRound) now apply modifiers consistently.
3. **MEDIUM-1 (mount capacity):** Correctly uses `getMountCapacity`/`countCurrentRiders` to allow Mountable 2+ Pokemon with remaining capacity. Matches server-side validation.
4. **MEDIUM-2 (heavily injured + dismount):** Correctly includes heavily injured HP loss in the dismount threshold evaluation per PTU p.218 + p.250.
5. **MEDIUM-3 (partner names):** Group and Player cards now resolve partner names via encounter store, matching the GM CombatantCard pattern.

All 16 mechanics verified in rules-review-269 remain correct with no regressions. Decree-003 and decree-004 compliance maintained.

## Verdict

**APPROVED**

No critical, high, or medium PTU rule issues found. All fix cycle changes are rule-correct. No regressions to previously approved P0 or P1 mechanics.

## Required Changes

None.
