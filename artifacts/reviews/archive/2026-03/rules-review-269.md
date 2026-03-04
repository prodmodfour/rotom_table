---
review_id: rules-review-269
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - aa177b62
  - 6fcf6570
  - 1d026c95
  - 80bc0b1e
  - 3aa28fc1
  - 345f2071
  - dcdc0148
  - eabcaa82
  - 61c2712d
  - 1e6dec2f
  - 323be9be
  - eb7aee5e
  - f7b11ab5
  - 594292c7
  - 11b21343
  - 629a5722
  - f58f4a08
mechanics_verified:
  - dismount-check-on-damage
  - dismount-check-threshold-formula
  - dismount-check-decree-004-compliance
  - mounted-prowess-remain-bonus
  - mounted-prowess-auto-succeed-mount
  - intercept-bonus-display
  - intercept-bonus-utility-function
  - rider-movement-uses-mount-capabilities
  - mount-movement-modifiers-source
  - linked-token-movement
  - mount-state-css-indicators
  - stacked-token-rendering
  - mount-controls-panel-mechanics
  - websocket-mount-change-event
  - faint-auto-dismount-in-damage
  - initiative-list-mount-indicator
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Using-Mounts-in-Battle
  - core/05-pokemon.md#Pokemon-as-Mounts
  - core/03-skills-edges-and-features.md#Mounted-Prowess
  - core/10-indices-and-reference.md#Mountable-X
  - core/07-combat.md#Intercept-Melee
  - core/07-combat.md#Intercept-Ranged
reviewed_at: 2026-03-03T12:30:00Z
follows_up: rules-review-265
---

## Mechanics Verified

### 1. Dismount Check on Damage (Section F)

- **Rule:** "If either you or your Pokemon who is being used as a Mount are hit by a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points... you must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." (`core/05-pokemon.md`, p.218)
- **Implementation:** `damage.post.ts:119-128` checks `combatant.mountState` on the damaged combatant, then calls `triggersDismountCheck(damageResult.hpDamage, entity.maxHp)`. When triggered, `buildDismountCheckInfo()` constructs the dismount check notification with correct DC, rider/mount identification, and Mounted Prowess bonus. The result is included in the API response as `dismountCheck` and the GM is alerted via `useEncounterActions.ts:64-76`.
- **Status:** CORRECT

### 2. Dismount Check Threshold Formula

- **Rule:** "damage equal or greater to 1/4th of the target's Max Hit Points" (`core/05-pokemon.md`, p.218)
- **Implementation:** `mountingRules.ts:151-153` -- `triggersDismountCheck(hpDamage, maxHp)` returns `hpDamage >= Math.floor(maxHp / 4)`. This correctly uses floor division per PTU rounding convention (round down). For a Pokemon with 80 max HP, the threshold is `Math.floor(80/4) = 20`, so 20+ damage triggers the check. For 79 max HP, threshold is `Math.floor(79/4) = 19`.
- **Status:** CORRECT

### 3. Dismount Check -- decree-004 Compliance

- **Rule:** Per decree-004: "only real HP lost (after temp HP absorption) counts toward the massive damage threshold." The ticket spec extends this to dismount thresholds.
- **Implementation:** `damage.post.ts:121-122` -- Comment explicitly cites decree-004. The parameter passed to `triggersDismountCheck` is `damageResult.hpDamage`, which is the real HP damage after temp HP absorption (computed by `calculateDamage` in `combatant.service.ts`). The raw incoming `body.damage` is NOT used for the threshold check.
- **Status:** CORRECT -- Per decree-004, temp HP shields from the dismount check.

### 4. Dismount Check Skipped on Faint

- **Rule:** If a combatant faints from the damage, there is no point triggering a dismount check -- auto-dismount on faint handles it instead.
- **Implementation:** `damage.post.ts:124` -- `if (combatant.mountState && !faintedFromAnySource)` gates the dismount check. When the combatant faints (from direct damage or heavily injured penalty), the code skips the dismount check and instead falls through to the faint-triggered auto-dismount at lines 130-141 via `clearMountOnFaint`.
- **Status:** CORRECT -- The two dismount paths (check vs auto) are mutually exclusive.

### 5. Mounted Prowess +3 Remain-Mounted Bonus (Section G)

- **Rule:** "you gain a +3 Bonus to all Acrobatics and Athletics Checks made to remain Mounted" (`core/03-skills-edges-and-features.md`, p.139/149/217)
- **Implementation:** `mountingRules.ts:28-29` -- `MOUNTED_PROWESS_REMAIN_BONUS = 3`. In `buildDismountCheckInfo()` (lines 178-201), the function finds the rider combatant and checks `hasMountedProwess(rider)`. If true, `prowessBonus = 3` is included in the `DismountCheckInfo`. The GM notification in `useEncounterActions.ts:67-69` displays the bonus: `"+3 Mounted Prowess"`.
- **Status:** CORRECT -- The +3 bonus is correctly identified and communicated to the GM. The bonus is applied to the RIDER (the one making the Acrobatics/Athletics check), not the mount.

### 6. Mounted Prowess Auto-Succeed Mounting Checks (Section G)

- **Rule:** "You automatically succeed at Acrobatics and Athletics Checks made to mount a Pokemon" (`core/03-skills-edges-and-features.md`, p.139)
- **Implementation:** `mountingRules.ts:106-112` -- `hasMountedProwess()` checks if the trainer's edges include "mounted prowess" (case-insensitive). In `mounting.service.ts:153-155`, `checkAutoSuccess = hasMountedProwess(rider)` and `checkRequired = skipCheck ? false : !checkAutoSuccess`. The mount response includes `checkAutoSuccess: true` and `checkRequired: false` when the edge is present. The MountControls panel displays "Mounted Prowess: Auto-success on mount check" (line 35).
- **Status:** CORRECT -- Auto-success only applies to MOUNTING checks (DC 10 to mount), not remain-mounted checks (+3 bonus instead). The code correctly distinguishes between these two effects.

### 7. Intercept Bonus Display (Section H)

- **Rule:** "It is very easy for you and your Pokemon to Intercept attacks for each other while you are Mounted due to the lack of distance." (`core/05-pokemon.md`, p.218)
- **Implementation:** Per the P1 design spec, this is a display/reference feature since the Intercept maneuver is not currently automated. The implementation provides:
  1. `VTTMountedToken.vue:55-58` -- An "Easy Intercept" shield badge on mounted token pairs with tooltip: "Easy Intercept: no distance requirement (PTU p.218)".
  2. `MountControls.vue:60-61` -- Note text: "Easy Intercept: Rider and mount may Intercept for each other without distance requirement (PTU p.218)".
- **Status:** CORRECT -- The visual reminder accurately reflects the PTU rule. No mechanical enforcement is needed at this tier since Intercept is GM-adjudicated.

### 8. Intercept Bonus Utility Function (Section H)

- **Rule:** PTU p.242: Intercept requires being within Movement Range of the ally. PTU p.218: distance requirement is waived for mounted pairs.
- **Implementation:** `mountingRules.ts:214-222` -- `isEasyIntercept(interceptorId, targetId, combatants)` checks if the interceptor has a `mountState` with `partnerId === targetId`. This function is prepared for future integration with the `intercept.service.ts` when automated Intercept is implemented. Currently, `intercept.service.ts` does not import or use this function, which is expected per the P1 spec: "If/when the Intercept maneuver is automated in a future feature, the mounting system will need to provide a check."
- **Status:** CORRECT -- Utility function is rule-accurate and ready for future integration.

### 9. Rider Movement Uses Mount's Capabilities

- **Rule:** "When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities instead of your own." (`core/05-pokemon.md`, p.218)
- **Implementation:** `useGridMovement.ts:192-202` (in `getMaxPossibleSpeed`) and `useGridMovement.ts:247-256` (in `getSpeed`) -- When a combatant has `mountState`, the speed is derived from `combatant.mountState.movementRemaining` (set from the mount's Overland speed at mount-time and round-reset), NOT from the rider's personal movement speed. The `movementRemaining` is set by `getOverlandSpeed(mount)` in `mounting.service.ts:157` (mount-time) and `mounting.service.ts:340,353` (round-reset).
- **Status:** CORRECT

### 10. Movement Modifiers Applied from Mount, Not Rider

- **Rule:** PTU p.218 implies the rider uses the mount's movement capabilities. Movement-modifying conditions (Slowed, Stuck, Speed CS) on the mount should affect mounted movement, not the rider's personal conditions.
- **Implementation:** `useGridMovement.ts:195-200` -- When calculating speed for a mounted combatant, the code looks up the MOUNT combatant via `findCombatant(combatant.mountState.partnerId)` (for riders) or uses `combatant` directly (for mounts), and passes the MOUNT to `applyMovementModifiers(mountCombatant, remaining)`. The rider's own status conditions are NOT used for movement modifier calculation.
- **Status:** CORRECT -- This is the correct interpretation. If the mount is Slowed, both rider and mount have halved movement. If only the rider is Slowed, movement is unaffected because the mount is doing the moving.

### 11. Linked Token Movement on VTT

- **Rule:** Rider and mount share position while mounted. ("When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities" -- `core/05-pokemon.md`, p.218). Per decree-003: mounted pairs share the mount's grid square.
- **Implementation:** `position.post.ts:82-113` -- When the moving combatant has `mountState`, the server updates BOTH the moving combatant and their partner to the same position, and decrements `movementRemaining` on both mount states by the distance moved. `useEncounterActions.ts:276-296` mirrors this locally before WebSocket broadcast.
- **Status:** CORRECT -- Per decree-003, mounted pairs share the mount's grid square(s).

### 12. Stacked Token Rendering

- **Rule:** No specific PTU rule governs token rendering, but the visual must accurately convey that rider and mount share a position.
- **Implementation:** `GridCanvas.vue` detects mounted pairs (`mountedPairs` computed), filters rider IDs from independent token rendering (`mountedRiderIds`), and renders `VTTMountedToken` components for each pair. The mount token renders at full size; the rider token renders at 60% scale in the lower-right quadrant. Both HP bars are visible.
- **Status:** CORRECT -- Accurately represents the PTU mechanic that rider and mount share a grid square.

### 13. Mount State CSS Indicators on VTTToken

- **Rule:** No PTU rule, but the indicators must correctly reflect mount state.
- **Implementation:** `VTTToken.vue` adds CSS classes `vtt-token--mounted-rider` (opacity 0.7 for riders rendered by VTTMountedToken) and `vtt-token--mounted-mount` (teal outline glow on mounts). A mount badge with `PhPersonSimpleRun` icon is shown on mount tokens carrying a rider.
- **Status:** CORRECT -- Visual indicators accurately reflect mount state.

### 14. MountControls Panel Mechanics

- **Rule:** Multiple PTU rules are referenced in the panel:
  - Standard Action to mount (PTU p.218)
  - Free Action during Shift if Expert Acrobatics/Athletics (PTU p.218)
  - Mounted Prowess auto-success (PTU p.139)
  - Mounted Prowess +3 remain bonus (PTU p.139)
  - Easy Intercept (PTU p.218)
- **Implementation:** `MountControls.vue`:
  - `actionCostLabel` computed correctly shows "Standard Action" or "Free Action during Shift" based on `hasExpertMountingSkill()`.
  - `canMountOptions` correctly filters adjacent, same-side, mountable Pokemon with capacity available.
  - Shows Mounted Prowess edge effects when applicable (auto-success for mounting, +3 for remaining).
  - Shows Easy Intercept note when rider is mounted.
  - Shows movement remaining and mount overland speed.
- **Status:** CORRECT -- All panel information accurately reflects PTU rules.

### 15. WebSocket mount_change Event

- **Rule:** No PTU rule; this is a synchronization concern. Mount state changes must propagate to all clients.
- **Implementation:** `ws.ts` handles `mount_change` events by broadcasting to the encounter room. `MountControls.vue` sends `mount_change` after successful mount/dismount. `useWebSocket.ts:222-226` receives the event (currently a no-op passthrough since `encounter_update` already carries the full state). The client relies on `encounter_update` for state sync; `mount_change` provides optional mount-specific context.
- **Status:** CORRECT -- State synchronization works through the existing `encounter_update` channel with `mount_change` as supplementary context.

### 16. Initiative List Mount Indicator

- **Rule:** No specific PTU rule, but mounted relationships should be visible in initiative tracking for GM awareness.
- **Implementation:** `CombatantCard.vue:394-407` -- `mountIndicatorText` computed resolves the mount partner name from the encounter store and shows "Mounted on [name]" (rider) or "Carrying [name]" (mount) with a horse icon. `GroupCombatantCard.vue:125-133` shows simplified "Mounted" / "Carrying rider" text. `PlayerCombatantCard.vue:129-134` shows the same simplified indicators.
- **Status:** CORRECT -- Mount relationships are visible across all three view types (GM, group, player).

## Decree Compliance

### decree-003: All tokens passable; enemy-occupied squares are rough terrain

Mounted pairs share the mount's grid square (decree-003 explicitly states this). Token rendering correctly overlays rider on mount at the same position. Dismount placement via `findDismountPosition` places the rider in an adjacent unoccupied cell, respecting the no-stacking rule. `MountControls.vue:207` allows same-position in the mount options adjacency check, which is correct for cases where rider and mount start co-located. **COMPLIANT.**

### decree-004: Massive damage check uses real HP lost after temp HP absorption

The dismount check threshold in `damage.post.ts:125` uses `damageResult.hpDamage` (real HP lost after temp HP), not the raw incoming damage. Comment at line 121-122 explicitly cites decree-004. This extends the decree-004 principle from massive damage to dismount checks, which is consistent: temp HP shields absorb the blow's effective impact on the combatant. **COMPLIANT.**

## P0 Mechanics Re-verification

All P0 mechanics approved in rules-review-265 were spot-checked against the current codebase to confirm no regressions from P1 changes:

- **Mount action cost** (`MOUNT_CHECK_DC = 10`, Standard Action / Free with Expert): Unchanged in `mountingRules.ts:23` and `mounting.service.ts:152-155`.
- **Mountable capability parsing**: Unchanged in `mountingRules.ts:48-63`.
- **Mount capacity validation**: Unchanged in `mounting.service.ts:88-96`.
- **Auto-dismount on faint**: `damage.post.ts:130-141` calls `clearMountOnFaint` when `faintedFromAnySource && combatant.mountState`. This is the same P0 logic with the P1 dismount check trigger added above it (gated by `!faintedFromAnySource`).
- **Round reset**: Not modified in P1 commits.
- **WebSocket surgical sync**: `encounter.ts:834` still syncs `existing.mountState = incomingCombatant.mountState`.

**No regressions detected.**

## Unimplemented Mechanics (Out of P1 Scope)

The following PTU mounting mechanics are NOT implemented in P1, noted here for completeness:

1. **Push-triggered dismount check** -- PTU p.218: "or are hit by a move with a Push Effect." The `DismountCheckReason` type includes `'push'` and `buildDismountCheckInfo` supports `reason: 'push'`, but no Push handler currently calls the dismount check. Push effects are not yet integrated in the move resolution system. This is tracked as a future scope item. The design spec (Section F) explicitly notes this requires a Push maneuver handler.

2. **Confusion self-damage dismount** -- PTU p.218: "If a rider's mount hurts itself in Confusion, the rider must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted." The `DismountCheckReason` type includes `'confusion'`, but Confusion self-damage application does not yet trigger dismount checks. This is expected: Confusion self-damage is not currently a distinct damage pathway in the system.

3. **Rider class features** -- PTU pp.102-103: Rider class features (Ramming Speed, Conqueror's March, Ride as One, Lean In, Cavalier's Reprisal, Overrun) are P2 scope per the design spec.

4. **Terrain-aware mount speed** -- PTU p.218 says "Mount's Movement Capabilities." The current implementation uses Overland speed only. Swim, Burrow, and Sky speeds for mounted movement are deferred (noted in rules-review-265).

These are all documented scope boundaries, not oversights. Per Game Logic Reviewer Lesson 3, I verify these against the rulebook: the rules exist in PTU and are correctly identified as future work rather than dismissed.

## Summary

P1 adds five sections of mounting mechanics (VTT tokens, dismount checks, Mounted Prowess integration, Intercept bonus display, UI indicators) across 17 commits. All implemented mechanics are rule-correct:

- The dismount check threshold formula (`hpDamage >= Math.floor(maxHp / 4)`) correctly implements PTU p.218 with decree-004 compliance (real HP after temp HP absorption).
- Mounted Prowess is correctly split into two effects: auto-succeed mounting checks (DC 10) and +3 to remain-mounted checks. Both are implemented and surfaced in the UI.
- The Intercept bonus is correctly presented as a visual reminder (badge + tooltip + panel note) since Intercept is manually adjudicated.
- Movement modifiers are correctly sourced from the mount, not the rider.
- Linked token movement correctly synchronizes position and movement budget between rider and mount.
- All three client views (GM, group, player) show mount relationship indicators.

## Rulings

- **Dismount check on both rider AND mount damage:** PTU p.218 says "If either you or your Pokemon who is being used as a Mount are hit by a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points." The implementation correctly triggers the check when EITHER rider or mount takes qualifying damage. In `buildDismountCheckInfo()`, if the damaged combatant is the rider (`isRider = true`), the rider is identified from `damagedCombatant.id`. If the damaged combatant is the mount, the rider is identified from `damagedCombatant.mountState.partnerId`. The DC 10 check is always made by the RIDER.

- **Mounted Prowess bonus applies to rider only:** The +3 remain-mounted bonus is checked on the rider (`hasMountedProwess(rider)`) because the rider is the one making the Acrobatics/Athletics check to remain mounted. This is correct per PTU p.139.

- **decree-004 extension to dismount threshold:** Applying the decree-004 principle (use real HP after temp HP) to the dismount check threshold is consistent and reasonable. If temp HP shields absorb most of a blow, the combatant did not experience a "massive" enough impact to trigger dismount. The design spec explicitly calls for this, and the implementation complies.

## Verdict

**APPROVED**

No critical, high, or medium PTU rule issues found. All 16 mechanics verified are correctly implemented. Decree-003 and decree-004 compliance confirmed. No regressions to P0 mechanics. Deferred mechanics (Push dismount, Confusion dismount, Rider class features, terrain-aware mount speed) are correctly identified as future scope items with appropriate type system preparation.

## Required Changes

None.
