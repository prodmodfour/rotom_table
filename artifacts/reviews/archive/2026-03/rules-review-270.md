---
review_id: rules-review-270
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 8eaea9de
  - 34df0387
  - 74beac95
  - 3df22372
  - 9a95d52c
  - 834f3a18
  - 360b71bc
  - 502cf645
  - de7732c0
  - 6115647c
  - 21a90b58
  - 240a3448
  - 0ec66cf1
  - 1da17253
  - 87c2a6b1
mechanics_verified:
  - living-weapon-capability
  - weapon-species-mapping
  - weapon-move-data
  - engage-action-economy
  - disengage-action-economy
  - fainted-weapon-persistence
  - auto-disengage-on-removal
  - auto-disengage-on-recall
  - auto-disengage-on-switch-recall
  - wield-state-reconstruction
  - combat-skill-rank-gate
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 1
ptu_refs:
  - core/10-indices-and-reference.md#Living-Weapon-pp305-306
  - core/09-gear-and-items.md#Weapons-pp287-290
  - core/09-gear-and-items.md#Weapon-Moves-pp288-290
reviewed_at: 2026-03-03T08:00:00Z
follows_up: null
---

## Mechanics Verified

### Living Weapon Capability Definition
- **Rule:** "Living Weapon: In addition to being a Pokemon, Honedge and its evolutionary relatives also count as equipment and may be used as such if the Pokemon is willing." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `getLivingWeaponConfig()` in `app/utils/combatantCapabilities.ts` checks species name against `LIVING_WEAPON_CONFIG` map, falls back to scanning `otherCapabilities` for "Living Weapon" string. Homebrew Pokemon default to Honedge config.
- **Status:** CORRECT

### Weapon Species Mapping
- **Rule:** "Honedge may be used as a Small Melee Weapon. Doublade may be used as two Small Melee Weapons; when one is held in each hand, the user gains +2 to Evasion. Aegislash may be used as a Small Melee Weapon and a Light Shield." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `LIVING_WEAPON_CONFIG` in `app/constants/livingWeapon.ts`:
  - Honedge: `occupiedSlots: ['mainHand']`, `grantsShield: false`, `dualWieldEvasionBonus: 0` -- matches "Small Melee Weapon" (one-handed)
  - Doublade: `occupiedSlots: ['mainHand', 'offHand']`, `grantsShield: false`, `dualWieldEvasionBonus: 2` -- matches "two Small Melee Weapons" with +2 evasion
  - Aegislash: `occupiedSlots: ['mainHand', 'offHand']`, `grantsShield: true`, `dualWieldEvasionBonus: 0` -- matches "Small Melee Weapon and a Light Shield"
- **Status:** CORRECT

### Weapon Quality Tiers
- **Rule:** "the Living Weapon may impart its wielder benefits as if it were a Simple or Fine Weapon" (`core/10-indices-and-reference.md#p306`). "A Honedge counts as a Simple Weapon [...] A Doublade counts as a Simple Weapon [...] An Aegislash counts as a Fine Weapon" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** Honedge `weaponType: 'Simple'`, Doublade `weaponType: 'Simple'`, Aegislash `weaponType: 'Fine'`
- **Status:** CORRECT

### Weapon Move Data
- **Rule:** Wounding Strike (PTU p.288): Normal, EOT, AC 2, DB 6, Physical, WR 1 Target, "target loses a Tick of Hit Points." Double Swipe (PTU p.288): Normal, EOT, AC 2, DB 4, Physical, WR 2 Targets or 1 Target Double Strike, None. Bleed! (PTU p.290): Normal, Scene x2, AC 2, DB 9, Physical, WR 1 Target, "target loses Tick of HP at start of next 3 turns."
- **Implementation:** Constants in `app/constants/livingWeapon.ts` match all values exactly: `WOUNDING_STRIKE` (db=6, ac=2, EOT), `DOUBLE_SWIPE` (db=4, ac=2, EOT), `BLEED` (db=9, ac=2, Scene x2). Effects match verbatim.
- **Status:** CORRECT

### Species-to-Move Mapping
- **Rule:** "A Honedge counts as a Simple Weapon and grants the Adept Move Wounding Strike. A Doublade counts as a Simple Weapon and Grants the Adept Move Double Swipe. An Aegislash counts as a Fine Weapon and grants the Adept Move Wounding Strike and the Master Move Bleed!" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** Honedge `grantedMoves: [WOUNDING_STRIKE]`, Doublade `grantedMoves: [DOUBLE_SWIPE]`, Aegislash `grantedMoves: [WOUNDING_STRIKE, BLEED]`.
- **Status:** CORRECT

### Combat Skill Rank Gate (Wielding Proficiency)
- **Rule:** PTU p.287: "Simple Weapons grant a single Move that can be used if the wielder has **Adept Combat** or higher, and Fine Weapons grant two Moves, one at Adept Combat or higher and another at Master Combat or higher." PTU p.306: "the Living Weapon may impart its wielder benefits as if it were a Simple or Fine Weapon, **as long as the wielder has the requisite Combat Skill Rank.**"
- **Implementation:** `living-weapon.service.ts` line 190 sets `requiredRank = 'Novice'` for Simple weapons and `'Adept'` for Fine weapons, then gates engage behind `meetsSkillRequirement()`. This **blocks engagement entirely** if the trainer doesn't meet the rank.
- **Status:** INCORRECT -- See HIGH issue #1 below.

### Engage Action Economy
- **Rule:** "Re-engaging is a Standard Action that may be taken by either party." (`core/10-indices-and-reference.md#p306`)
- **Implementation:** `engage.post.ts` always marks `standardActionUsed: true` on the wielder (trainer), regardless of who initiates. The request body takes `wielderId` and `weaponId` but no `initiatorId`.
- **Status:** INCORRECT -- See HIGH issue #2 below.

### Disengage Action Economy
- **Rule:** "Either the Living Weapon or the Wielder can disengage as a Swift Action during their turn" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** `disengage.post.ts` marks `swiftActionUsed: true` on `body.combatantId`, which can be either the wielder or weapon. The caller specifies who initiates.
- **Status:** CORRECT

### Fainted Weapon Persistence
- **Rule:** "When Fainted, these Pokemon may still be used as inanimate pieces of equipment, but all rolls made with them take a -2 penalty." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `WieldRelationship.isFainted` flag is set during engage based on `pokemon.currentHp <= 0` or `statusConditions.includes('Fainted')`. The `damage.post.ts` endpoint has a comment (commit 6115647c) noting that fainted Living Weapons remain wielded and the `isFainted` flag is derived from entity HP during reconstruction. The -2 penalty application is correctly deferred to P1.
- **Status:** CORRECT (P0 scope: tracking only, penalty is P1)

### Auto-Disengage on Combatant Removal
- **Rule:** Implicit from encounter rules -- removed combatants cannot participate in relationships. The design spec states: "Combatant removal: If a wielded Pokemon or wielding trainer is removed from the encounter, the wield relationship is automatically dissolved (disengage without action cost)."
- **Implementation:** `[combatantId].delete.ts` calls `clearWieldOnRemoval()` after splice. `clearWieldOnRemoval()` in `living-weapon.service.ts` clears flags on the remaining partner and removes the relationship from the array. No action cost charged.
- **Status:** CORRECT

### Auto-Disengage on Recall
- **Rule:** Recall removes a Pokemon from the encounter. A wielded Pokemon being recalled must break the wield relationship.
- **Implementation:** `recall.post.ts` calls `reconstructWieldRelationships()` then `clearWieldOnRemoval()` on the recalled combatant. No action cost charged (recall itself already costs a Shift Action).
- **Status:** CORRECT

### Auto-Disengage on Switch Recall
- **Rule:** Switch = recall + release. The recalled Pokemon's wield relationship must be dissolved.
- **Implementation:** `switch.post.ts` calls `reconstructWieldRelationships()` then `clearWieldOnRemoval()` on `recallCombatantId` after removal.
- **Status:** CORRECT

### Wield State Reconstruction
- **Rule:** N/A (implementation pattern, not a PTU rule)
- **Implementation:** `living-weapon-state.ts` scans combatants for `wieldingWeaponId` flags, looks up the weapon combatant, determines species from entity data, and constructs the `WieldRelationship[]` array. Unknown species default to Honedge. Fainted state is derived from current HP.
- **Status:** CORRECT (Robust reconstruction pattern that handles edge cases)

### WebSocket State Sync
- **Rule:** N/A (implementation pattern)
- **Implementation:** `ws.ts` includes `wieldRelationships: reconstructWieldRelationships(combatants)` in the encounter sync payload. New `living_weapon_engage` and `living_weapon_disengage` event types are handled with broadcast to encounter room. Store syncs `wieldRelationships`, `wieldingWeaponId`, and `wieldedByTrainerId` from incoming data.
- **Status:** CORRECT

## Summary

The P0 implementation correctly establishes the Living Weapon data model, capability parsing, engage/disengage endpoints, wield state tracking, and auto-disengage triggers. The weapon species mapping (Honedge/Doublade/Aegislash), weapon quality tiers (Simple/Fine), weapon move data (Wounding Strike, Double Swipe, Bleed!), and fainted persistence behavior all match PTU RAW precisely.

Two HIGH issues were found:

1. The Combat Skill Rank gate uses incorrect rank requirements that do not match PTU RAW weapon proficiency rules, and it blocks engagement entirely rather than gating move access.

2. The engage endpoint always charges the trainer's Standard Action, but PTU allows either party to initiate engagement.

One MEDIUM issue flags the lack of "during their turn" validation for both engage and disengage, which could allow off-turn actions.

## Rulings

### HIGH #1: Combat Skill Rank Gate Misaligned with PTU RAW

**File:** `app/server/services/living-weapon.service.ts`, line 190

**Problem:** The implementation requires `Novice` Combat for Simple weapons and `Adept` for Fine weapons to **engage at all**. PTU RAW (p.287) states that Simple weapons grant moves at **Adept** Combat, and Fine weapons grant an Adept move at Adept Combat and a Master move at Master Combat. There is no "minimum rank to hold/wield" -- the ranks gate **move access**, not wielding permission.

The Living Weapon text (p.306) says the weapon "may impart its wielder benefits as if it were a Simple or Fine Weapon, as long as the wielder has the requisite Combat Skill Rank." This means: a trainer with Untrained Combat can still engage and wield a Honedge (gaining the equipment slot overlay and Struggle Attack modifications from a Small Melee Weapon), but would NOT gain access to Wounding Strike (requires Adept Combat).

**PTU Quote:** "Simple Weapons grant a single Move that can be used if the wielder has Adept Combat or higher" (`core/09-gear-and-items.md#p287`)

**Expected behavior:** Engagement should NOT be gated by Combat rank. Instead, Combat rank should gate which weapon moves become available (P1 scope: move injection). A trainer with any Combat rank (even Untrained) should be able to engage a Living Weapon; they just won't get weapon moves until Adept/Master.

**Current code:**
```typescript
const requiredRank: SkillRank = weaponConfig.weaponType === 'Simple' ? 'Novice' : 'Adept'
```

**Note:** The design spec explicitly states this behavior (`requiredRank: 'Novice'` for Simple, `'Adept'` for Fine). This is a design spec error, not just an implementation error. If this interpretation was intentional, a decree should be filed to formalize it. Filing a `decree-need` ticket is recommended (see below).

### HIGH #2: Engage Always Charges Wielder's Standard Action

**File:** `app/server/api/encounters/[id]/living-weapon/engage.post.ts`, lines 56-67

**Problem:** PTU p.306 states "Re-engaging is a Standard Action that may be taken by **either party**." The implementation always marks `standardActionUsed: true` on the wielder (trainer), even if the Pokemon should be the one initiating. If the Pokemon initiates engagement on its turn, the Pokemon's Standard Action should be consumed.

**PTU Quote:** "Re-engaging is a Standard Action that may be taken by either party." (`core/10-indices-and-reference.md#p306`)

**Expected behavior:** The request body should include an `initiatorId` field (either wielder or weapon combatant ID). The Standard Action should be consumed on the initiator, not always on the wielder.

**Impact:** Currently, if a Pokemon wants to engage on its turn, the trainer would incorrectly lose their Standard Action instead of the Pokemon.

### MEDIUM #1: No Turn Validation for Engage/Disengage

**File:** `app/server/api/encounters/[id]/living-weapon/engage.post.ts` and `disengage.post.ts`

**Problem:** PTU p.306 says engagement is "a Standard Action" and disengage is "a Swift Action **during their turn**." Neither endpoint validates that the initiating combatant's turn is currently active. A combatant could potentially engage or disengage outside their turn in the initiative order.

**Expected behavior:** Validate that the initiating combatant is the current active combatant in the turn order (or that the action is otherwise legal for the current initiative state). Other action endpoints in the codebase likely perform similar turn validation.

**Impact:** Could allow out-of-turn Living Weapon actions that should not be permitted.

## Verdict

**CHANGES_REQUIRED**

Two HIGH-severity issues must be addressed before this P0 can be considered rules-correct:

1. The Combat Skill Rank gate either needs to be removed (matching PTU RAW: anyone can wield, rank only gates moves) or a decree must be filed to formalize the design spec's custom interpretation.

2. The engage endpoint needs an `initiatorId` parameter so the correct combatant's Standard Action is consumed.

The MEDIUM turn-validation issue should be addressed but is not a blocker if the existing codebase has consistent patterns for how other action endpoints handle turn validation.

## Required Changes

1. **[HIGH] Fix or decree the Combat Skill Rank gate** (`app/server/services/living-weapon.service.ts` line 190):
   - **Option A (match PTU RAW):** Remove the rank check from `engageLivingWeapon()`. Anyone can engage. Combat rank gates move access in P1.
   - **Option B (file decree):** If the design intentionally restricts engagement by rank, create `decree-need` ticket in `artifacts/tickets/open/decree/` documenting the PTU RAW discrepancy and requesting a human ruling.

2. **[HIGH] Add `initiatorId` to engage endpoint** (`app/server/api/encounters/[id]/living-weapon/engage.post.ts`):
   - Accept `initiatorId` in request body (must be either `wielderId` or `weaponId`)
   - Consume the Standard Action on the initiator, not always on the wielder
   - Validate the initiator is part of the relationship

3. **[MEDIUM] Add turn validation** to both engage and disengage endpoints:
   - Verify the initiating combatant is the current active combatant in the turn order
   - Follow existing patterns from other action endpoints (e.g., damage, switch)
