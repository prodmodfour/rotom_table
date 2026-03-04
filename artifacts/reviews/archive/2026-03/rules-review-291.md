---
review_id: rules-review-291
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - 61bce2ca
  - bac99570
  - fea659c1
  - da1adda2
  - 7344d9aa
  - 9e0c4d7a
  - 9083437b
mechanics_verified:
  - lean-in-resist-step-full-ladder
  - conquerors-march-condition-key
  - agility-training-persistence
  - ride-as-one-accuracy-wiring
  - run-up-bonus-integration
  - overrun-modifiers-integration
  - conquerors-march-range-eligibility-integration
  - lean-in-aoe-integration
  - cavaliers-reprisal-detection
  - conquerors-march-standard-action-cost
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/04-trainer-classes.md#Page 103
  - core/07-combat.md#Page 236-237 (Type Effectiveness)
  - core/03-skills-edges-and-features.md#Agility Training
reviewed_at: 2026-03-04T14:00:00Z
follows_up: rules-review-287
---

## Mechanics Verified

### 1. Lean In: Resist Step Full Ladder (rules-review-287 HIGH-1 fix)
- **Rule:** "Both you and your Mount Resist the attack one step further." (PTU p.103). The full effectiveness progression per PTU p.236-237: 3.0x -> 2.0x -> 1.5x -> 1.0x -> 0.5x -> 0.25x -> 0.125x.
- **Implementation:** `applyResistStep()` in `app/utils/mountingRules.ts:374-381` now handles the complete ladder:
  ```
  >= 3.0 -> 2.0  (Triply SE -> Doubly SE)
  >= 2.0 -> 1.5  (Doubly SE -> SE)
  >= 1.5 -> 1.0  (SE -> Neutral)
  >= 1.0 -> 0.5  (Neutral -> Resisted)
  >= 0.5 -> 0.25 (Resisted -> Doubly Resisted)
  >= 0.25 -> 0.125 (Doubly Resisted -> Triply Resisted)
  ```
- **Verification:** Previously, `>= 2.0` returned `1.0`, skipping the 1.5x step entirely. Now each step moves exactly one position down the PTU effectiveness ladder. The values 3.0, 2.0, 1.5, 1.0, 0.5, 0.25, 0.125 match PTU p.236-237 exactly ("x3 damage", "x2 damage", "x1.5 damage", neutral, "1/2 damage", "1/4th damage", "1/8th damage"). The `>= 0.25 -> 0.125` case also correctly handles the rare triply-resisted step. The floor-return for values below 0.25 (including immune/0.0) is correctly preserved.
- **Status:** CORRECT -- rules-review-287 HIGH-1 is resolved.

### 2. Conqueror's March Condition Key (rules-review-287 MED-1 fix)
- **Rule:** "Conqueror's March" is the canonical feature name (PTU p.103).
- **Implementation:** The temp condition key was renamed from `'ConquerorsMarsh'` to `'ConquerorsMarch'` across all locations. A named constant `CONQUERORS_MARCH_CONDITION = 'ConquerorsMarch'` was extracted to `app/constants/trainerClasses.ts:206`. The constant is imported and used in both `app/stores/encounter.ts` (line 6, 1187-1188) and `app/components/encounter/MountControls.vue` (line 218, 426). A global search for `ConquerorsMarsh` returns zero results, confirming complete elimination of the typo.
- **Status:** CORRECT -- rules-review-287 MED-1 is resolved.

### 3. Agility Training Persistence (code-review-314 HIGH-1 fix)
- **Rule:** "While you are Mounted on a Pokemon under the effects of Agility Training, the bonuses from Agility Training are doubled." (PTU p.103). Agility Training is a static Training effect (PTU p.61), not a temporary condition. It persists until the trainer gives a different Training order.
- **Implementation:** The flag was moved from `tempConditions` (which is cleared at turn end by `next-turn.post.ts:107`) to `mountState.agilityTrainingActive` -- a persistent boolean on `MountState` (defined in `app/types/combat.ts:54`). The store action `toggleAgilityTraining` (encounter.ts:1153-1170) now sets `mountState.agilityTrainingActive` on both mount and rider. The UI reads from `mount.mountState.agilityTrainingActive` (MountControls.vue:419).
- **Verification:** `tempConditions = []` at turn end (next-turn.post.ts:107) does NOT affect `mountState.agilityTrainingActive` because it lives on a separate field. The flag persists across turns as Training effects should. It is correctly cleared on dismount because `executeDismount()` sets `mountState: undefined` on both combatants (mounting.service.ts:399, 407), and similarly on faint-dismount (mounting.service.ts:516, 529, 548, 553). This lifecycle matches the PTU rule: active while mounted, inactive when not mounted.
- **Status:** CORRECT -- persistence behavior now matches Training semantics.

### 4. Ride as One Speed Evasion in Accuracy (code-review-314 CRIT-1 fix)
- **Rule:** "While you are Mounted, you and your Mount each use the highest of each other's Speed Evasion. If both you and your Mount have the same Speed Evasion, you instead each receive a +1 bonus to Speed Evasion." (PTU p.103)
- **Implementation:** In `calculate-damage.post.ts:336-341`, after the stat-derived speed evasion is computed from base stats and combat stages, the code checks if the target has an active Ride as One evasion:
  ```typescript
  if (target.mountState && target.mountState.originalSpeedEvasion !== undefined) {
    speedEvasion = Math.max(speedEvasion, target.speedEvasion)
  }
  ```
  The `originalSpeedEvasion` field is only set by `applyRideAsOneEvasion()` when the Ride as One feature is active, serving as a reliable detection condition. The `Math.max` ensures the target uses whichever is higher: the stat-derived evasion (which may change with combat stages) or the Ride as One shared value (set on mount).
- **Verification:** The `applyRideAsOneEvasion()` function in mounting.service.ts correctly implements the "highest of both / +1 if equal" mechanic. The shared evasion values are stored on `combatant.speedEvasion` at mount time. The `Math.max` approach in the accuracy calculation is correct because:
  1. If combat stages have improved the target's speed evasion since mounting, the stat-derived value may be higher -- the target should use it.
  2. If the Ride as One shared value is higher (the whole point of the feature), it takes precedence.
  3. Per decree-040, the flanking penalty applies AFTER the evasion cap (line 352-353), and this Ride as One override feeds into the evasion pipeline BEFORE the cap (line 348), which is the correct ordering. Ride as One modifies the base evasion, the cap limits it, and flanking reduces after cap.
- **Status:** CORRECT -- Ride as One now has mechanical effect on accuracy calculations.

### 5. Run Up Bonus Integration (code-review-314 HIGH-2 partial fix)
- **Rule:** "Run Up: Static. When this Pokemon Shifts, attacks made on the same turn with Dash or Pass range Moves gain a +1 bonus to their Damage Rolls for every 3 meters the Pokemon moved this turn." (PTU p.103, via Ramming Speed)
- **Implementation:** `calculateRunUpBonus()` from `mountingRules.ts` is now called in two places: (1) `calculate-damage.post.ts:390` computes the bonus and includes it in `riderModifiers.runUpBonus` for GM awareness; (2) `MountControls.vue:465` uses the imported function instead of inlining `Math.floor(distanceMovedThisTurn / 3)`.
- **Verification:** `calculateRunUpBonus(distanceMoved)` returns `Math.floor(distanceMoved / 3)`, which correctly implements "+1 for every 3 meters." The `hasRunUp(mount)` check at line 389 ensures the bonus only applies when the mount has the Run Up ability. The distance tracking uses `mount.turnState.distanceMovedThisTurn` which is incremented by `addDistanceMoved()` during grid movement.
- **Status:** CORRECT

### 6. Overrun Modifiers Integration (code-review-314 HIGH-2 partial fix)
- **Rule:** "Your Pokemon adds their Speed Stat in addition to their normal attacking Stat to their Damage Roll. The target gains Damage Reduction against this attack equal to their own Speed Stat." (PTU p.103)
- **Implementation:** `calculateOverrunModifiers()` from `mountingRules.ts` is now called in `calculate-damage.post.ts:397-404`. It computes both `bonusDamage` (mount's CS-modified Speed) and `targetDR` (target's CS-modified Speed) and includes them in `riderModifiers.overrun`. Also used in `MountControls.vue:468-475` to display the bonus damage preview.
- **Verification:** The CS multiplier table in `calculateOverrunModifiers()` is correct: negative stages use -10%/stage, positive stages use +20%/stage, with `Math.floor()` for rounding down. The function correctly applies the multiplier to both mount and target Speed stats.
- **Status:** CORRECT

### 7. Conqueror's March Eligibility Integration (code-review-314 HIGH-2 partial fix)
- **Rule:** "the target may use Dash, Burst, Blast, Cone, or Line range Moves with a range of Pass instead of their usual range." (PTU p.103)
- **Implementation:** `isConquerorsMarchEligibleRange()` from `mountingRules.ts` is now called in `calculate-damage.post.ts:408-410`, setting `riderModifiers.conquerorsMarchEligible = true` when the move's range qualifies.
- **Verification:** The function checks for `dash`, `burst`, `blast`, `cone`, and `line` prefixes (case-insensitive), matching the 5 range types from PTU p.103 exactly.
- **Status:** CORRECT

### 8. Lean In AoE Integration (code-review-314 HIGH-2 partial fix)
- **Rule:** "Trigger: You and your Mount both take Damage from a Burst, Blast, Cone, or Line. Effect: Both you and your Mount Resist the attack one step further." (PTU p.103). Scene x2, Free Action.
- **Implementation:** `isAoERange()` and `applyResistStep()` from `mountingRules.ts` are now called in `calculate-damage.post.ts:419-427`. When the target is mounted and the move is AoE, the code checks for the Lean In feature on the rider and computes the reduced effectiveness via `applyResistStep(result.effectiveness ?? 1.0)`, returning it in `riderModifiers.leanInReducedEffectiveness`.
- **Verification:** `isAoERange()` checks for `burst`, `blast`, `cone`, and `line` -- the 4 AoE types from PTU p.103 (correctly excludes `dash` which is NOT in the Lean In trigger). The `applyResistStep()` call now correctly implements the full ladder per mechanic #1 above.
- **Status:** CORRECT

### 9. Cavalier's Reprisal Detection (already correct, verified still intact)
- **Rule:** "Trigger: An adjacent foe hits your Mount with an attack. 1 AP -- Free Action. Effect: You may make a Struggle Attack against the triggering foe." (PTU p.103)
- **Implementation:** In `damage.post.ts:160-189`, when the mount is hit (`!combatant.mountState.isMounted`), the code finds the rider, checks for the feature, verifies AP >= 1, checks attacker adjacency, and returns `reprisalOpportunity` with the correct AP cost and Struggle Attack description.
- **Verification:** `CAVALIERS_REPRISAL_AP_COST = 1` matches PTU "1 AP". The Struggle Attack is correctly described as "DB 1, Physical, Melee". The adjacency check uses the mount's position (shared with rider while mounted). The detection correctly only fires when `body.attackerId` is provided, leaving the GM in control.
- **Status:** CORRECT

### 10. Conqueror's March Standard Action Cost (code-review-314 MED-3 fix)
- **Rule:** "At-Will -- Standard Action" (PTU p.103). Conqueror's March is an Order that costs a Standard Action.
- **Implementation:** The standard action cost was moved from a direct mutation in `MountControls.vue` into the store action `activateConquerorsMarch(riderId, mountId)` (encounter.ts:1181-1198). The store action now takes both riderId and mountId, sets the tempCondition on the mount, and sets `standardActionUsed: true` on the rider's turnState via a spread mutation.
- **Verification:** The action cost is correctly applied to the rider (who is giving the Order), not the mount. The store mutation pattern (`rider.turnState = { ...rider.turnState, standardActionUsed: true }`) is consistent with how other actions mark standard action usage in the encounter store.
- **Status:** CORRECT

## Decree Compliance

### decree-003 (Token Passability)
Not directly relevant to P2 Rider fix cycle. Movement tracking uses the existing system which respects decree-003. **Compliant.**

### decree-004 (Massive Damage / Temp HP)
Dismount check in `damage.post.ts` continues to use `damageResult.hpDamage` (real HP damage after temp HP absorption). Cavalier's Reprisal trigger is based on any hit, not a damage threshold. **Compliant.**

### decree-040 (Flanking After Evasion Cap)
The Ride as One evasion override feeds into the `speedEvasion` variable BEFORE the evasion cap is applied (line 348: `Math.min(9, applicableEvasion)`) and before the flanking penalty (line 353: `effectiveEvasion - flankingPenalty`). This means:
1. Ride as One sets the base speed evasion value
2. The evasion cap of 9 is applied
3. The flanking -2 penalty is applied after the cap

This ordering is fully consistent with decree-040. **Compliant.**

## Verification of All Previous Review Issues

| Issue | Status | Evidence |
|-------|--------|----------|
| rules-review-287 HIGH-1: applyResistStep skips step for Doubly SE | RESOLVED | Full ladder implemented: 3.0->2.0->1.5->1.0->0.5->0.25->0.125 |
| rules-review-287 MED-1: ConquerorsMarsh typo | RESOLVED | Renamed to ConquerorsMarch with constant extraction, zero remaining occurrences |
| code-review-314 CRIT-1: Ride as One evasion not in accuracy calc | RESOLVED | `Math.max(speedEvasion, target.speedEvasion)` wired into calculate-damage.post.ts |
| code-review-314 HIGH-1: Agility Training cleared at turn end | RESOLVED | Moved to mountState.agilityTrainingActive, survives tempConditions clearing |
| code-review-314 HIGH-2: 5 dead utility functions | RESOLVED | All 5 functions now imported and called in calculate-damage.post.ts; calculateRunUpBonus and calculateOverrunModifiers also used in MountControls.vue |
| code-review-314 MED-1: ConquerorsMarsh typo | RESOLVED | Same as rules-review-287 MED-1 |
| code-review-314 MED-2: app-surface.md not updated | RESOLVED | Mounting system entry expanded with P2 additions; mounting utilities entry expanded with all new functions |
| code-review-314 MED-3: Standard action via direct mutation | RESOLVED | Moved into activateConquerorsMarch(riderId, mountId) store action |

## Rulings

1. **Ride as One evasion override correctly uses `Math.max`.** The `Math.max(statDerivedEvasion, rideAsOneSharedValue)` approach correctly implements PTU's "use the highest of each other's Speed Evasion" because combat stage changes after mounting could increase the stat-derived evasion beyond the shared value. Taking the maximum at calculation time ensures the defender always benefits from the better value.

2. **Lean In `applyResistStep` correctly follows the full PTU effectiveness progression.** Per ruling #3 from rules-review-287: "Resist one step further" means moving exactly one position down in the 3.0/2.0/1.5/1.0/0.5/0.25/0.125 effectiveness ladder. The fix implements this correctly, including the previously missing 0.25->0.125 step.

3. **Agility Training as a persistent mountState flag is correct.** Agility Training is a "Static" effect that persists while mounted. Storing it on `mountState` ties its lifecycle to the mount relationship: active while mounted, cleared on dismount (mountState set to undefined). This matches PTU semantics better than tempConditions.

## Summary

All 7 fix commits properly address the issues identified in code-review-314 (1 CRITICAL, 2 HIGH, 3 MEDIUM) and rules-review-287 (1 HIGH, 1 MEDIUM). The `applyResistStep` function now handles the complete PTU type effectiveness ladder. The Ride as One speed evasion is mechanically effective in accuracy calculations. Agility Training persists across turns. All 5 utility functions are integrated. The ConquerorsMarsh typo is eliminated with a named constant. The standard action cost for Conqueror's March flows through the store. The app-surface.md is updated.

No new rules issues were identified during re-review. All three applicable decrees (decree-003, decree-004, decree-040) remain compliant.

## Verdict

**APPROVED** -- All issues from both previous reviews are resolved. No new rules issues found.

## Required Changes

None.
