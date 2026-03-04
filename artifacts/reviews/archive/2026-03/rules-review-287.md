---
review_id: rules-review-287
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - 84f00898
  - 85cd953a
  - ca017e72
  - 3befc4e0
  - 541e7552
  - e0db8f85
  - 49d51e8e
  - 0a604055
  - 99d5ab07
  - e3b725e0
  - 4c8532b8
  - 8130a410
  - c7e5fb77
  - 9f3bad46
mechanics_verified:
  - rider-class-feature-detection
  - agility-training-doubling
  - ramming-speed-run-up-bonus
  - conquerors-march-flag-tracking
  - ride-as-one-speed-evasion-sharing
  - ride-as-one-initiative-swap-tracking
  - lean-in-resist-step
  - lean-in-usage-tracking
  - cavaliers-reprisal-trigger-detection
  - cavaliers-reprisal-ap-cost
  - overrun-speed-damage-modifier
  - overrun-target-dr
  - overrun-combat-stages
  - distance-moved-tracking
  - feature-usage-scene-reset
  - mount-dismount-evasion-lifecycle
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/04-trainer-classes.md#Page 103
  - core/03-skills-edges-and-features.md#Agility Training
  - core/07-combat.md#Page 235-236
  - core/07-combat.md#Page 237 (Type Effectiveness)
reviewed_at: 2026-03-04T12:30:00Z
follows_up: rules-review-278
---

## Mechanics Verified

### 1. Rider Class Feature Detection
- **Rule:** Rider class and its 7 features (PTU pp.102-103) are gated behind the `trainerClasses` and `features` arrays on `HumanCharacter`.
- **Implementation:** `hasRiderClass()` checks `trainerClasses` for `'Rider'` or `'Rider:'` prefix (supporting branching notation). `hasRiderFeature()` does case-insensitive matching against `features` array. `RIDER_FEATURE_NAMES` constant list matches all 7 canonical names from PTU p.103.
- **Status:** CORRECT

### 2. Agility Training Doubling (Section J)
- **Rule:** "While you are Mounted on a Pokemon under the effects of Agility Training, the bonuses from Agility Training are doubled." (PTU p.103). Agility Training grants "+1 bonus to Movement Capabilities and +4 to Initiative" (PTU p.61, core/03).
- **Implementation:** Toggle adds `'Agile'` temp condition to the mount. UI displays doubled values: "+2 Movement, +8 Initiative". Constants match: `AGILITY_TRAINING_MOVEMENT_BONUS = 1`, `AGILITY_TRAINING_INITIATIVE_BONUS = 4`. The doubling is a reference display; actual stat application is manual per spec (Training effects not yet automated).
- **Verification:** Base values (+1 Movement, +4 Initiative) match PTU p.61. Doubled values (+2 Movement, +8 Initiative) are arithmetically correct.
- **Status:** CORRECT

### 3. Run Up Damage Bonus (Section K)
- **Rule:** "Run Up: Static. When this Pokemon Shifts, attacks made on the same turn with Dash or Pass range Moves gain a +1 bonus to their Damage Rolls for every 3 meters the Pokemon moved this turn." (PTU p.103, via Ramming Speed)
- **Implementation:** `calculateRunUpBonus(distanceMovedThisTurn)` returns `Math.floor(distanceMovedThisTurn / 3)`. `isDashOrPassRange()` checks for `'dash'` and `'pass'` prefixes. `hasRunUp()` checks the Pokemon's abilities array for 'Run Up'.
- **Verification:** `Math.floor(6 / 3) = 2`, `Math.floor(5 / 3) = 1`, `Math.floor(2 / 3) = 0`. The floor division correctly implements "+1 for every 3 meters." The bonus is displayed in MountControls but applied manually by the GM per the spec's automation level.
- **Status:** CORRECT

### 4. Conqueror's March Flag Tracking (Section L)
- **Rule:** "This round, if being used as a Mount, the target may use Dash, Burst, Blast, Cone, or Line range Moves with a range of Pass instead of their usual range." (PTU p.103). It is an Order with [Orders] tag, costing a Standard Action.
- **Implementation:** Adds `'ConquerorsMarsh'` to mount's `tempConditions`. `isConquerorsMarchEligibleRange()` checks for dash/burst/blast/cone/line ranges. The UI correctly disables the button when the rider's Standard Action is used. The activation handler in `MountControls.vue` marks `standardActionUsed = true` on the rider.
- **Verification:** The flag is round-scoped (cleared when `tempConditions` resets at turn end). The Standard Action cost is correctly enforced. The 5 qualifying range types match PTU exactly.
- **Status:** CORRECT

### 5. Ride as One: Speed Evasion Sharing (Section M)
- **Rule:** "While you are Mounted, you and your Mount each use the highest of each other's Speed Evasion. If both you and your Mount have the same Speed Evasion, you instead each receive a +1 bonus to Speed Evasion." (PTU p.103)
- **Implementation:** `applyRideAsOneEvasion()` in `mounting.service.ts` compares `rider.speedEvasion` and `mount.speedEvasion`. If equal: both get +1. If different: both get the higher value. Original values stored in `mountState.originalSpeedEvasion` for restoration on dismount.
- **Verification:** Per decree-040, flanking -2 evasion applies after the evasion cap. Ride as One modifies the base `speedEvasion` value on the combatant, which is the correct level to modify -- the evasion cap and flanking penalty are applied later in `useMoveCalculation.ts`. The implementation correctly plugs into the existing evasion pipeline without conflicting with decree-040.
- **Evasion lifecycle verified:** Applied on mount (`executeMount`), restored on dismount (`executeDismount`), restored on faint (`clearMountOnFaint`). All three lifecycle transitions handle evasion correctly.
- **Status:** CORRECT

### 6. Ride as One: Initiative Swap Tracking (Section M)
- **Rule:** "Whenever one of you receives Initiative, either of you may take your turn. When the next person would receive initiative, the person that did not take their turn then takes it." (PTU p.103)
- **Implementation:** `rideAsOneSwapped` boolean on `MountState`. `setRideAsOneSwapped()` store action sets it on both pair members. Reset to `false` at round start in `resetCombatantsForNewRound()`. The UI shows a "Ride as One: Initiative sharing" indicator.
- **Verification:** The swap flag is correctly scoped to the round (reset at round start). The actual initiative swap is managed by the GM (UI choice, not automated), which matches the spec's "UI choice + tracking" automation level. The tracking mechanism is sound.
- **Status:** CORRECT

### 7. Lean In: Resist Step Calculation (Section N)
- **Rule:** "Both you and your Mount Resist the attack one step further." (PTU p.103). PTU damage rules (p.236): "A Super-Effective hit will deal x1.5 damage. A Doubly Super-Effective hit will deal x2 damage. Rare Triply-Effective Hits will deal x3 damage. A Resisted Hit deals 1/2 damage; a doubly Resisted hit deals 1/4th damage."
- **Implementation:** `applyResistStep(currentEffectiveness)` in `mountingRules.ts`:
  - `>= 2.0 -> 1.0` (Doubly SE -> Neutral)
  - `>= 1.5 -> 1.0` (SE -> Neutral)
  - `>= 1.0 -> 0.5` (Neutral -> Resisted)
  - `>= 0.5 -> 0.25` (Resisted -> Double Resisted)
- **Issue:** See **HIGH-1** below. The step from 2.0x should go to 1.5x, not 1.0x.
- **Status:** INCORRECT (HIGH-1)

### 8. Lean In: Usage Tracking (Section N)
- **Rule:** "Scene x2 -- Free Action" (PTU p.103). Limited to 2 uses per scene.
- **Implementation:** `LEAN_IN_MAX_PER_SCENE = 2`. `getFeatureUsesRemaining()` checks `combatant.featureUsage['Lean In']`. `useSceneFeature()` increments `usedThisScene`. `featureUsage` cleared on scene transition (`next-scene.post.ts`). `isAoERange()` correctly checks for Burst/Blast/Cone/Line (not Dash/Pass).
- **Verification:** The 4 qualifying AoE types (Burst, Blast, Cone, Line) match PTU p.103 exactly. The scene reset in `next-scene.post.ts` correctly clears all `featureUsage` records. The max of 2 is correct.
- **Status:** CORRECT

### 9. Cavalier's Reprisal: Trigger Detection (Section O)
- **Rule:** "Trigger: An adjacent foe hits your Mount with an attack" (PTU p.103). "1 AP -- Free Action. Effect: You may make a Struggle Attack against the triggering foe."
- **Implementation:** In `damage.post.ts`, when the damaged combatant is the mount (`!combatant.mountState.isMounted`), the code finds the rider via `partnerId`, checks for the feature with `hasRiderFeature(rider, "Cavalier's Reprisal")`, verifies AP (`riderEntity.currentAp >= CAVALIERS_REPRISAL_AP_COST`), and checks adjacency via `areAdjacent()`.
- **Verification:** `CAVALIERS_REPRISAL_AP_COST = 1` matches PTU "1 AP". The adjacency check uses the mount's position, which is shared with the rider while mounted. The `body.attackerId` requirement means the trigger only fires when the GM includes the attacker in the damage request, which is appropriate for GM-controlled resolution. The reprisal opportunity is returned in the response for the GM to act on.
- **Status:** CORRECT

### 10. Cavalier's Reprisal: AP Cost (Section O)
- **Rule:** "1 AP -- Free Action" (PTU p.103)
- **Implementation:** `CAVALIERS_REPRISAL_AP_COST = 1`. The opportunity includes `apCost: CAVALIERS_REPRISAL_AP_COST` and `attackType: 'Struggle Attack (DB 1, Physical, Melee)'`.
- **Verification:** The AP cost is correct. The Struggle Attack description matches PTU (DB 1, Physical class, Melee range). AP deduction is handled by the GM (manual resolution per spec).
- **Status:** CORRECT

### 11. Overrun: Speed Damage Modifier (Section P)
- **Rule:** "Your Pokemon adds their Speed Stat in addition to their normal attacking Stat to their Damage Roll." (PTU p.103)
- **Implementation:** `calculateOverrunModifiers()` takes the mount's Speed stat and stage, applies CS multiplier via `STAGE_MULTS` table, returns `bonusDamage = effectiveMountSpeed`.
- **Verification:** CS multiplier table is correct: -6 = 0.4, -5 = 0.5, ..., +6 = 2.2. These match PTU p.235 ("For every Combat Stage above 0, a Stat is raised by 20%, rounded down. For every Combat Stage below 0, a Stat is lowered by 10%, rounded down."). The `Math.floor()` application matches PTU's "rounded down." The Speed Stat is the calculated stat with CS applied, matching PTU's "Speed Stat" terminology.
- **Status:** CORRECT

### 12. Overrun: Target DR (Section P)
- **Rule:** "The target gains Damage Reduction against this attack equal to their own Speed Stat." (PTU p.103)
- **Implementation:** `calculateOverrunModifiers()` also computes `targetDR = effectiveTargetSpeed` using the same CS multiplier table applied to the target's Speed stat.
- **Verification:** The DR is correctly calculated using the target's CS-modified Speed stat. The function returns both `bonusDamage` and `targetDR` for the damage pipeline to consume.
- **Status:** CORRECT

### 13. Overrun: Usage Tracking (Section P)
- **Rule:** "Scene x2 -- Free Action" (PTU p.103)
- **Implementation:** `OVERRUN_MAX_PER_SCENE = 2`. Uses same `featureUsage` tracking as Lean In. Cleared on scene transition.
- **Status:** CORRECT

### 14. Distance Moved Tracking
- **Rule:** Run Up requires tracking "every 3 meters the Pokemon moved this turn" (PTU p.103).
- **Implementation:** `distanceMovedThisTurn` field on `TurnState` (combat.ts). Initialized to `0` at turn start (turn-helpers.ts line 42, 99). Incremented via `encounterStore.addDistanceMoved()` which accumulates distance. `handleTokenMove()` in `useEncounterActions.ts` calculates movement distance via `ptuDiagonalDistance()` and calls `addDistanceMoved()`.
- **Verification:** The PTU diagonal distance function correctly implements the alternating diagonal rule. Distance is accumulated per movement (not per turn), so multiple shift actions within a turn correctly sum. The reset at turn/round start ensures the counter doesn't carry over.
- **Status:** CORRECT

### 15. Feature Usage Scene Reset
- **Rule:** Scene-frequency features reset at scene boundaries (PTU general rule).
- **Implementation:** `next-scene.post.ts` clears `featureUsage` on all combatants: `featureUsage: undefined`.
- **Verification:** This correctly resets both Lean In and Overrun scene counters. The reset uses `undefined` rather than an empty object, which matches the initialization pattern (featureUsage is optional on Combatant).
- **Status:** CORRECT

### 16. Mount/Dismount Evasion Lifecycle
- **Rule:** Ride as One evasion sharing is a "Static" effect -- active while mounted, inactive while dismounted (PTU p.103).
- **Implementation:** Evasion applied in `executeMount()` (after mount state is set), restored in `executeDismount()` (before mount state is cleared), and restored in `clearMountOnFaint()` (both rider-faint and mount-faint paths).
- **Verification:** All three lifecycle transitions (mount, dismount, faint-dismount) correctly handle evasion. The `originalSpeedEvasion` storage on `MountState` allows clean restoration. Immutable combatant array updates prevent mutation bugs.
- **Status:** CORRECT

## Decree Compliance

### decree-003 (Token Passability)
Not directly relevant to P2 Rider features. The movement tracking uses the existing movement system which already respects decree-003. **Compliant.**

### decree-004 (Massive Damage / Temp HP)
The dismount check in `damage.post.ts` uses `damageResult.hpDamage` (real HP damage after temp HP absorption), consistent with decree-004. The Cavalier's Reprisal trigger is based on the mount being hit (any damage), not on massive damage threshold, so decree-004 is not directly relevant to it but the surrounding damage code remains compliant. **Compliant.**

### decree-040 (Flanking After Evasion Cap)
Ride as One modifies `speedEvasion` on the combatant, which is the base value. The evasion cap (max 9) and flanking penalty (-2 after cap) are applied in `useMoveCalculation.ts`, downstream of this modification. Ride as One does not interfere with the penalty ordering. **Compliant.**

## Issues

### HIGH-1: Lean In `applyResistStep` Skips a Step for Doubly Super-Effective

**File:** `app/utils/mountingRules.ts:378-383`

**Rule:** PTU p.103: "Both you and your Mount Resist the attack one step further." PTU p.236 defines the effectiveness progression:
- 3.0x (Triply SE) -> 2.0x (Doubly SE) -> 1.5x (SE) -> 1.0x (Neutral) -> 0.5x (Resisted) -> 0.25x (Doubly Resisted) -> 0.125x (Triply Resisted)

"Resist one step further" means moving one step down in this progression.

**Code:**
```typescript
export function applyResistStep(currentEffectiveness: number): number {
  if (currentEffectiveness >= 2.0) return 1.0  // BUG: should be 1.5
  if (currentEffectiveness >= 1.5) return 1.0  // Correct: SE -> Neutral
  if (currentEffectiveness >= 1.0) return 0.5  // Correct: Neutral -> Resisted
  if (currentEffectiveness >= 0.5) return 0.25 // Correct: Resisted -> Double Resisted
  return currentEffectiveness
}
```

**Problem:** When `currentEffectiveness >= 2.0`, the function returns `1.0` (skipping the 1.5x step). A Doubly Super-Effective attack (2.0x) should become Super-Effective (1.5x) after one resistance step, not Neutral (1.0x). Similarly, a Triply Super-Effective attack (3.0x) should become 2.0x, not 1.0x.

**Fix:**
```typescript
export function applyResistStep(currentEffectiveness: number): number {
  if (currentEffectiveness >= 3.0) return 2.0   // Triply SE -> Doubly SE
  if (currentEffectiveness >= 2.0) return 1.5   // Doubly SE -> SE
  if (currentEffectiveness >= 1.5) return 1.0   // SE -> Neutral
  if (currentEffectiveness >= 1.0) return 0.5   // Neutral -> Resisted
  if (currentEffectiveness >= 0.5) return 0.25  // Resisted -> Double Resisted
  if (currentEffectiveness >= 0.25) return 0.125 // Double Resisted -> Triple Resisted
  return currentEffectiveness                    // Already at floor or immune
}
```

**Impact:** Overestimates resistance benefit by one step when a Doubly Super-Effective AoE hits a mounted pair. A 2.0x attack would be reduced to 1.0x instead of 1.5x, cutting damage by an extra 33%.

### MED-1: `ConquerorsMarsh` Temp Condition Key Contains Typo

**File:** `app/stores/encounter.ts:1175`, `app/components/encounter/MountControls.vue:425`

**Issue:** The temp condition key for Conqueror's March is spelled `'ConquerorsMarsh'` (Marsh) instead of `'ConquerorsMarch'` (March). While this is used consistently across all 4 occurrences and does not cause functional bugs, it could confuse future developers or cause breakage if someone adds new code checking for `'ConquerorsMarch'` (correct spelling).

**Affected locations:**
- `encounter.ts:1166` (comment)
- `encounter.ts:1175` (condition check)
- `encounter.ts:1176` (condition set)
- `MountControls.vue:425` (condition check)

**Fix:** Rename to `'ConquerorsMarch'` in all 4 locations.

## Summary

The P2 implementation covers all 7 Rider class features with appropriate automation levels matching the spec. 16 mechanics were verified against PTU 1.05 text. The core logic is sound: Ride as One evasion sharing is fully automated with correct lifecycle management, distance tracking for Run Up/Overrun uses the proper PTU diagonal formula, Cavalier's Reprisal trigger detection correctly identifies mount-hit-by-adjacent-foe, and all scene-limited features (Lean In, Overrun) have proper usage tracking with scene reset.

One HIGH issue was found: the `applyResistStep` function for Lean In skips a resistance step when effectiveness is 2.0x (Doubly Super-Effective), going directly to Neutral (1.0x) instead of Super-Effective (1.5x). This overestimates the resistance benefit by 33% for that case. One MEDIUM issue: the `ConquerorsMarsh` temp condition key contains a typo (Marsh instead of March).

All three applicable decrees (decree-003, decree-004, decree-040) are respected by the implementation.

## Rulings

1. **Ride as One evasion modification is correctly placed in the evasion pipeline.** It modifies the base `speedEvasion` value on the combatant, which feeds into the downstream evasion cap and flanking penalty (decree-040). The modification does not bypass the cap.

2. **Overrun "Speed Stat" correctly includes Combat Stage modification.** PTU p.103 says "Speed Stat" which is the calculated stat value. The code applies the CS multiplier table to get the effective stat, matching PTU p.235 CS rules.

3. **Lean In resistance step must follow PTU's full effectiveness progression.** "Resist one step further" means moving exactly one position down in the 3.0/2.0/1.5/1.0/0.5/0.25/0.125 effectiveness ladder, not halving the multiplier.

## Verdict

**CHANGES_REQUIRED** -- 1 HIGH issue (incorrect resist step calculation) must be fixed before approval.

## Required Changes

1. **HIGH-1:** Fix `applyResistStep()` in `app/utils/mountingRules.ts` to correctly handle the full PTU effectiveness progression: 3.0 -> 2.0 -> 1.5 -> 1.0 -> 0.5 -> 0.25 -> 0.125. Each step moves exactly one position down the ladder.

2. **MED-1:** Rename `'ConquerorsMarsh'` to `'ConquerorsMarch'` in all 4 occurrences across `encounter.ts` and `MountControls.vue`.
