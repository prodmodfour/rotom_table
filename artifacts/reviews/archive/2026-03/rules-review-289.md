---
review_id: rules-review-289
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 0ae868a5
  - d2aacfef
  - f37032c7
  - ede47291
  - 507c467c
  - 685212ee
  - ab3e0247
  - 853a5344
  - 119be6b2
  - 8a88e844
  - 923e6445
mechanics_verified:
  - equipment-overlay
  - doublade-dual-wield-evasion
  - aegislash-shield-dr
  - fainted-penalty
  - weapon-move-injection
  - weapon-move-skill-gating
  - faint-state-sync
  - heal-state-sync
  - revive-state-sync
  - evasion-refresh-on-engage-disengage
  - damage-calc-integration
  - initiative-recalc-integration
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - 10-indices-and-reference.md#page-305
  - 10-indices-and-reference.md#page-306
  - 09-gear-and-items.md#page-287
  - 09-gear-and-items.md#page-288
  - 09-gear-and-items.md#page-289
  - 09-gear-and-items.md#page-290
  - 09-gear-and-items.md#page-294
  - 07-combat.md#evasion
  - 07-combat.md#damage-roll
reviewed_at: 2026-03-04T09:15:00Z
follows_up: rules-review-274
---

## Mechanics Verified

### 1. Equipment Overlay (Section E)

- **Rule:** "Honedge may be used as a Small Melee Weapon. Doublade may be used as two Small Melee Weapons... Aegislash may be used as a Small Melee Weapon and a Light Shield." (`10-indices-and-reference.md#page-305`)
- **Implementation:** `computeEffectiveEquipment()` in `app/utils/equipmentBonuses.ts` creates a new `EquipmentSlots` object that replaces mainHand (and optionally offHand) with Living Weapon items. Honedge occupies mainHand. Doublade occupies mainHand + offHand. Aegislash occupies mainHand (weapon) + offHand (shield). The overlay is immutable -- it does not modify the trainer's persisted equipment.
- **Status:** CORRECT. Equipment slot assignments match PTU RAW for all three species. The overlay pattern correctly replaces rather than merges, preventing stacking with the trainer's real mainHand/offHand equipment.

### 2. Doublade Dual-Wield Evasion (Section F)

- **Rule:** "Doublade may be used as two Small Melee Weapons; when one is held in each hand, the user gains +2 to Evasion." (`10-indices-and-reference.md#page-305`)
- **Implementation:** `LivingWeaponConfig` for Doublade has `dualWieldEvasionBonus: 2`. The `buildLivingWeaponEquippedItem()` function applies this as `evasionBonus` on the mainHand item only (to prevent double-counting). `computeEquipmentBonuses()` sums evasion bonuses from all slots, so +2 propagates correctly.
- **Status:** CORRECT. The +2 evasion is correctly applied when Doublade occupies both hand slots. The mainHand-only placement prevents double-counting. Verified: Honedge gets 0, Doublade gets +2, Aegislash gets 0 from dual-wield (shield handles its own evasion separately).

### 3. Aegislash Shield DR (Section G)

- **Rule:** "Aegislash may be used as a Small Melee Weapon and a Light Shield." (`10-indices-and-reference.md#page-305`). "Light Shields grant +2 Evasion. They may be readied as a Standard Action to instead grant +4 Evasion and 10 Damage Reduction until the end of your next turn, but also cause you to become Slowed for that duration." (`09-gear-and-items.md#page-294`)
- **Implementation:** `buildLivingWeaponShield()` creates a Light Shield item with `evasionBonus: 2`, `canReady: true`, `readiedBonuses: { evasionBonus: 4, damageReduction: 10, appliesSlowed: true }`. This matches the PTU Light Shield definition exactly.
- **Status:** CORRECT. The passive +2 evasion and readied bonuses (+4 evasion, 10 DR, Slowed) match PTU p.294 precisely. The `computeEquipmentBonuses()` pipeline picks up the evasion bonus automatically.

### 4. Fainted Living Weapon Penalty (Section H)

- **Rule:** "When Fainted, these Pokemon may still be used as inanimate pieces of equipment, but all rolls made with them take a -2 penalty." (`10-indices-and-reference.md#page-305`)
- **Implementation:** When `isFainted` is true: `buildLivingWeaponEquippedItem()` applies `Math.max(0, baseDualWieldBonus - 2)` to evasion. `buildLivingWeaponShield()` applies `Math.max(0, 2 - 2)` = 0 evasion, `canReady: false`, and strips `readiedBonuses`. The -2 penalty effectively zeroes out the Doublade +2 dual-wield evasion and the Aegislash +2 passive shield evasion when fainted.
- **Status:** CORRECT. The -2 penalty is correctly applied to all Living Weapon evasion bonuses. The `canReady: false` when fainted prevents readying the Aegislash shield, which is a reasonable interpretation (you can't actively ready a fainted Pokemon's shield). The `Math.max(0, ...)` floor prevents negative evasion bonuses from equipment, which is mechanically sound.

### 5. Weapon Move Injection (Section I)

- **Rule:** "While used as a Living Weapon, the Pokemon also adds these Moves to its own Move List, so long as their wielder qualifies to access them." (`10-indices-and-reference.md#page-306`)
- **Implementation:** `getEffectiveMoveList()` in `living-weapon.service.ts` checks if a Pokemon combatant is wielded, looks up the wielder's Combat skill rank, filters moves via `getGrantedWeaponMoves()` using `meetsSkillRequirement()`, and merges with the Pokemon's base moves. Duplicate avoidance by name prevents double-listing.
- **Status:** CORRECT. The runtime injection pattern correctly avoids DB persistence. Moves are only injected when actively wielded. The duplicate check prevents issues if a Pokemon somehow already has a weapon move in its natural list.

### 6. Weapon Move Skill Rank Gating (decree-043)

- **Rule:** Per decree-043: "Combat Skill Rank gates weapon move access only, not engagement. Any trainer can engage a Living Weapon regardless of Combat rank." The Combat skill rank determines which weapon moves become available: Adept for Simple weapon moves, Master for Fine weapon moves.
- **Implementation:** `meetsSkillRequirement()` compares the wielder's actual rank against each move's `requiredRank`. The rank order is `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`. This means: Untrained/Novice = no moves; Adept/Expert = Adept moves only; Master = Adept + Master moves. Engagement in `engageLivingWeapon()` has NO rank check (confirmed in P0, verified still absent).
- **Status:** CORRECT. Per decree-043, engagement is unrestricted and move access is gated by rank. The implementation faithfully separates these concerns. A Novice Combat wielder gets the equipment overlay (evasion bonuses) but no weapon moves.

### 7. Weapon Move Data Accuracy

- **Rule:** PTU pp.288-290 defines the weapon moves:
  - Wounding Strike: Normal, EOT, AC 2, DB 6, Physical, WR 1 Target, "The target loses a Tick of Hit Points." (`09-gear-and-items.md#page-289`)
  - Double Swipe: Normal, EOT, AC 2, DB 4, Physical, WR 2 Targets or WR 1 Target Double Strike, None. (`09-gear-and-items.md#page-288`)
  - Bleed!: Normal, Scene x2, AC 2, DB 9, Physical, WR 1 Target, "The target loses a Tick of Hit Points at the start of their next three turns." (`09-gear-and-items.md#page-290`)
- **Implementation:** `WOUNDING_STRIKE` in `app/constants/livingWeapon.ts`: DB 6, AC 2, EOT, Physical. `DOUBLE_SWIPE`: DB 4, AC 2, EOT, Physical. `BLEED`: DB 9, AC 2, Scene x2, Physical.
- **Status:** NEEDS REVIEW -- see HIGH-001 below. The raw move data matches the book's base values, but the Small Melee Weapon +1 DB modifier is not applied.

### 8. Species-Move Grant Assignments

- **Rule:** "A Honedge counts as a Simple Weapon and grants the Adept Move Wounding Strike. A Doublade counts as a Simple Weapon and Grants the Adept Move Double Swipe. An Aegislash counts as a Fine Weapon and grants the Adept Move Wounding Strike and the Master Move Bleed!." (`10-indices-and-reference.md#page-306`)
- **Implementation:** `LIVING_WEAPON_CONFIG` maps: Honedge -> `[WOUNDING_STRIKE]`, Doublade -> `[DOUBLE_SWIPE]`, Aegislash -> `[WOUNDING_STRIKE, BLEED]`.
- **Status:** CORRECT. All three species grant the correct moves per PTU RAW. Weapon quality assignments (Simple/Fine) match. The `requiredRank` on each move (Adept/Master) correctly gates access.

### 9. Faint State Sync

- **Rule:** "When Fainted, these Pokemon may still be used as inanimate pieces of equipment, but all rolls made with them take a -2 penalty." (`10-indices-and-reference.md#page-305`)
- **Implementation:** Three sync points implemented:
  1. `damage.post.ts` (lines 195-206): When a wielded Pokemon faints, reconstructs wield relationships and refreshes wielder evasion.
  2. `heal.post.ts` (lines 60-70): When a wielded Pokemon is healed from faint (`healResult.faintedRemoved`), refreshes wielder evasion to remove the -2 penalty.
  3. `use-item.post.ts` (lines 243-253): When a wielded Pokemon is revived by an item (`itemResult.effects?.revived`), refreshes wielder evasion.
- **Status:** CORRECT. All three state transition paths (faint, heal-from-faint, item-revive) correctly trigger evasion refresh. The reconstruction approach derives `isFainted` from current HP, which is reliable since the entity HP is already updated before the refresh call.

### 10. Evasion Refresh on Engage/Disengage

- **Rule:** Equipment overlay must take effect immediately when the wield relationship changes. The wielder's evasion should reflect the Living Weapon's bonuses (or lack thereof) in real time.
- **Implementation:** `engage.post.ts` (line 114) and `disengage.post.ts` (line 102) both call `refreshCombatantEquipmentBonuses()` on the wielder after the relationship change. The refresh function correctly includes the evasion CS modifier (`stages?.evasion || 0`) plus the equipment evasion bonus.
- **Status:** CORRECT. Both engage and disengage paths refresh evasion immediately. The `refreshCombatantEquipmentBonuses()` function correctly accounts for combat stage evasion modifiers, equipment evasion bonuses, and Focus stat bonuses.

### 11. Damage Calculation Integration

- **Rule:** Equipment DR and Focus bonuses must account for the Living Weapon overlay when computing damage against a trainer who is wielding one (or when the wielder is the attacker).
- **Implementation:** `calculate-damage.post.ts` (line 182) reconstructs wield relationships, then uses `getEffectiveEquipmentBonuses()` for both attacker Focus bonuses (line 245) and target DR/Focus defense (line 225). The `getEffectiveMoveList()` function is used to look up moves including weapon moves (line 187).
- **Status:** CORRECT. The server-side damage calculator correctly accounts for Living Weapon equipment overlay for both attackers and targets. The move lookup includes weapon moves, allowing the endpoint to calculate damage for weapon move attacks.

### 12. Initiative Recalculation Integration

- **Rule:** Speed Focus bonus affects initiative. If the Living Weapon overlay changes which Focus item is active (e.g., replacing a mainHand Focus weapon with the Living Weapon), the initiative should be recalculated.
- **Implementation:** `calculateCurrentInitiative()` in `combatant.service.ts` (line 673) accepts optional `wieldRelationships` parameter and uses `getEffectiveEquipmentBonuses()` when provided, falling back to direct `computeEquipmentBonuses()` otherwise.
- **Status:** CORRECT. The initiative function correctly accounts for Living Weapon overlay when wield relationships are available. Note: `refreshCombatantEquipmentBonuses()` does NOT recalculate initiative (as documented), which is acceptable since initiative reordering is a separate explicit operation.

### 13. Client-Side Evasion Integration

- **Rule:** The client-side move calculation composable must account for Living Weapon equipment overlay when computing target evasion and attacker Focus bonuses.
- **Implementation:** `useMoveCalculation.ts` has `getEffectiveEquipBonuses()` (line 87) which checks `encounterStore.encounter?.wieldRelationships` and applies `computeEffectiveEquipment()`. This is used for both attacker Focus bonuses (line 520) and target defense/DR (line 596). The `computeTargetEvasions()` in `evasionCalculation.ts` also accepts wield relationships and applies the overlay (line 67-74).
- **Status:** CORRECT. Both the client-side composable and the extracted evasion utility correctly account for the Living Weapon overlay. The duplicate pattern (server-side `getEffectiveEquipmentBonuses` in living-weapon.service.ts + client-side `getEffectiveEquipBonuses` in useMoveCalculation.ts) is a necessary duplication since server and client have different access patterns.

### 14. Decree Compliance

- **decree-043:** Verified. Engagement has no rank check. Weapon moves are gated by `meetsSkillRequirement()`. COMPLIANT.
- **decree-001:** Verified. The `calculateDamage()` function in `damageCalculation.ts` applies minimum 1 damage at both post-defense (line 330) and post-effectiveness (line 341-343) steps. Living Weapon integration does not alter this pipeline. COMPLIANT.
- **decree-044:** Not directly relevant to P1. The Living Weapon system does not introduce any 'Bound' condition checks. COMPLIANT (by omission).

## Issues

### HIGH-001: Weapon Move Damage Base Missing Small Melee Weapon +1 DB Modifier

**Severity:** HIGH
**Mechanic:** Weapon move damage
**PTU Reference:** "Small Melee Weapons raise the Damage Base by +1." (`09-gear-and-items.md#page-287`). "All modifications that a Weapon makes to Struggle Attacks also apply to the Moves they grant." (`09-gear-and-items.md#page-287`). Example given: "a Large Melee Weapon with an AC 2 DB 4 Move would cause the wielder to use it as if it had AC 3 and DB 6." (Large Melee = +1 AC, +2 DB applied to the move).

All three Living Weapon species count as Small Melee Weapons (PTU p.305). PTU p.287 explicitly states weapon modifications apply to granted moves. Therefore:

- Wounding Strike should be DB **7** (6 base + 1 Small Melee), not DB 6
- Double Swipe should be DB **5** (4 base + 1 Small Melee), not DB 4
- Bleed! should be DB **10** (9 base + 1 Small Melee), not DB 9

The `WOUNDING_STRIKE`, `DOUBLE_SWIPE`, and `BLEED` constants in `app/constants/livingWeapon.ts` use the raw DB values from the move definitions (pp.288-290) without applying the Small Melee Weapon +1 DB modifier.

**Impact:** All weapon move damage is 1 DB too low. Using the DB chart: DB 6 = 15 avg vs DB 7 = 17 avg (Wounding Strike), DB 4 = 11 avg vs DB 5 = 13 avg (Double Swipe), DB 9 = 21 avg vs DB 10 = 24 avg (Bleed!). This undervalues weapon moves by 2-3 average damage per hit.

**Note:** The design spec (`shared-specs.md`) also lists raw DB values without the modifier, so this is a design-level omission, not just an implementation bug. The spec's weapon move data table on line 88-92 shows DB 6/4/9 matching the raw move definitions.

**Fix:** Update `app/constants/livingWeapon.ts` to apply the +1 DB modifier:
- `WOUNDING_STRIKE.damageBase`: 6 -> 7
- `DOUBLE_SWIPE.damageBase`: 4 -> 5
- `BLEED.damageBase`: 9 -> 10

Add a comment explaining these are post-weapon-modifier values: "DB includes Small Melee Weapon +1 modifier (PTU p.287)."

### MEDIUM-001: Weapon Moves Can Incorrectly Receive STAB

**Severity:** MEDIUM
**Mechanic:** Weapon move STAB exclusion
**PTU Reference:** "All modifications that a Weapon makes to Struggle Attacks also apply to the Moves they grant and to Moves granted by Features with the [Weapon] tag. However, these Moves can never benefit from STAB." (`09-gear-and-items.md#page-287`)

The weapon moves are correctly tagged with `keywords: ['Weapon']` in `getGrantedWeaponMoves()` (living-weapon.service.ts:483). However, neither the client-side `useMoveCalculation.ts` nor the server-side `calculateDamage()` in `damageCalculation.ts` check for the `[Weapon]` keyword to exclude STAB.

**Current behavior:** STAB is checked by comparing `moveType` against `attackerTypes`. Since the weapon moves are Normal type and Honedge/Doublade/Aegislash are Steel/Ghost, STAB would not trigger in practice for these specific Pokemon. However, if a Pokemon with the Normal type and Living Weapon capability (via the Weaponize ability) used these moves, STAB would be incorrectly applied.

**Impact:** Low immediate impact (Honedge line is Steel/Ghost, not Normal). Theoretical edge case with homebrew or future Weaponize-ability Pokemon that have the Normal type. The code has the `keywords: ['Weapon']` tag available but doesn't use it to block STAB.

**Fix:** In both `useMoveCalculation.ts` (effectiveDB computed) and `calculateDamage()`, add a check: if the move has `keywords` containing `'Weapon'`, skip STAB. Alternatively, handle this in `getGrantedWeaponMoves()` by setting the move type to `null`/undefined to prevent STAB matching.

### MEDIUM-002: buildCombatantFromEntity Does Not Account for Pre-Existing Wield Relationships

**Severity:** MEDIUM
**Mechanic:** Equipment evasion on encounter load
**PTU Reference:** Equipment bonuses should be computed with the Living Weapon overlay if a wield relationship is active.

`buildCombatantFromEntity()` in `combatant.service.ts` (line 591) calls `computeEquipmentBonuses()` directly without checking for wield relationships. This function is called during encounter initialization. While the design spec notes that "buildCombatantFromEntity() is called at encounter start (before any wield relationships exist)", wield relationships CAN exist when an encounter is loaded from a saved state (via `reconstructWieldRelationships`).

If an encounter is saved with active wield relationships and then reloaded (e.g., server restart or page refresh), the combatant builder would compute evasion without the Living Weapon overlay. The reconstruction happens later, but `refreshCombatantEquipmentBonuses` is not called after reconstruction.

**Impact:** On encounter reload with active wield relationships, the wielder's cached evasion values would not include the Living Weapon bonuses until the next evasion recalculation event. The client-side `computeTargetEvasions()` would still compute correctly since it reads wield relationships dynamically, but the cached `physicalEvasion`/`specialEvasion`/`speedEvasion` fields on the Combatant object would be stale.

**Fix:** After reconstructing wield relationships on encounter load, iterate wielders and call `refreshCombatantEquipmentBonuses()` on each. This should be done in the encounter load/deserialize path.

## Summary

The P1 Living Weapon implementation is mechanically sound across 13 verified areas. The equipment overlay pattern, evasion bonuses, shield DR, fainted penalty, weapon move injection, and skill rank gating all correctly implement PTU rules. Decree compliance is verified for decree-043 (engagement unrestricted), decree-001 (minimum damage floors preserved), and decree-044 (no phantom Bound condition introduced).

Three issues were found:

1. **HIGH-001**: Weapon move DB values are 1 point too low because the Small Melee Weapon +1 DB modifier (PTU p.287) is not applied to the stored move data. This is a design-level omission that affects all weapon move damage calculations.

2. **MEDIUM-001**: Weapon moves can theoretically receive STAB despite PTU p.287 explicitly forbidding it. Currently a non-issue for the Honedge line (Steel/Ghost types using Normal moves) but represents an incorrect rule implementation for edge cases.

3. **MEDIUM-002**: Encounter reload with active wield relationships would not refresh the wielder's cached evasion values with the Living Weapon overlay until the next state change event.

## Rulings

1. **Weapon DB modifier is mandatory.** PTU p.287's example unambiguously demonstrates that weapon type modifiers (+1 DB for Small Melee) apply to granted moves. The moves should be stored with their effective DB values, not their raw base values. This ruling is consistent with how mundane weapons work in the existing weapon system.

2. **Weapon STAB exclusion should be enforced in code.** Even though it's currently a non-issue for the Honedge line, the PTU text is explicit: "these Moves can never benefit from STAB." The `keywords: ['Weapon']` tag is already present and should be checked.

3. **Evasion cache staleness on reload is acceptable for P1 but should be tracked.** The client-side evasion computation is correct (it reads wield relationships dynamically). The server-side cached values are only stale until the next state change. A fix is recommended but not blocking.

## Verdict

**CHANGES_REQUIRED**

HIGH-001 (weapon DB modifier) must be fixed before P1 approval. The +1 DB difference affects every weapon move damage calculation and represents a systematic undervaluation of the Living Weapon system's offensive output.

MEDIUM-001 and MEDIUM-002 should be addressed but are not blocking for P1 approval. They can be fixed in a follow-up commit or deferred to P2.

## Required Changes

1. **[HIGH-001] Fix weapon move DB values** in `app/constants/livingWeapon.ts`:
   - `WOUNDING_STRIKE.damageBase`: 6 -> 7
   - `DOUBLE_SWIPE.damageBase`: 4 -> 5
   - `BLEED.damageBase`: 9 -> 10
   - Add comment: "DB includes Small Melee Weapon +1 modifier (PTU p.287: weapon modifications apply to granted moves)"

2. **[MEDIUM-001] Add STAB exclusion for weapon moves** (non-blocking):
   - Check `move.keywords?.includes('Weapon')` before applying STAB in both client and server damage pipelines
   - Or set weapon moves' type to prevent STAB matching

3. **[MEDIUM-002] Refresh evasion after wield reconstruction on encounter load** (non-blocking):
   - After `reconstructWieldRelationships()` in the encounter load path, call `refreshCombatantEquipmentBonuses()` for each wielder
