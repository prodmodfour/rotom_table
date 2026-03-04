---
review_id: rules-review-274
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-005
domain: combat
commits_reviewed:
  - 07b9fedd
  - c234ea7f
  - 11f9dfa9
  - afe70f52
  - 22cdf4c7
  - b95b15df
  - 4d6e59ce
  - 63b0f9b7
mechanics_verified:
  - living-weapon-capability
  - weapon-species-mapping
  - weapon-quality-tiers
  - weapon-move-data
  - combat-skill-rank-gate
  - engage-action-economy
  - disengage-action-economy
  - turn-validation
  - action-availability
  - fainted-weapon-persistence
  - auto-disengage-on-removal
  - homebrew-species-handling
  - wield-state-reconstruction
  - websocket-state-sync
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Living-Weapon-pp305-306
  - core/09-gear-and-items.md#Weapons-pp287-290
  - core/09-gear-and-items.md#Weapon-Moves-pp288-290
  - errata-2.md (no Living Weapon errata found)
reviewed_at: 2026-03-03T14:30:00Z
follows_up: rules-review-270
---

## Re-Review Context

This is a re-review following the fix cycle for rules-review-270 (CHANGES_REQUIRED: 0 CRITICAL, 2 HIGH, 1 MEDIUM). Eight fix cycle commits were reviewed. All three issues from rules-review-270 have been verified as resolved.

Decree check: decree-043 (Combat Skill Rank gates move access, not engagement) is directly applicable and verified as correctly implemented. decree-033 (fainted switch timing) and decree-038 (Sleep persistence) were checked for interaction with Living Weapon fainted state -- no conflicts found.

Errata check: No Living Weapon, Honedge, Doublade, Aegislash, Wounding Strike, Double Swipe, or Bleed! entries found in `errata-2.md`.

## Fix Verification: rules-review-270 Issues

### HIGH #1: Combat Skill Rank Gate Misaligned with PTU RAW -- FIXED

**Previous issue:** `living-weapon.service.ts` gated engagement behind `meetsSkillRequirement()` with `requiredRank: 'Novice'` for Simple, `'Adept'` for Fine. This blocked engagement entirely based on Combat rank.

**Fix commit:** `07b9fedd` -- Removed the rank check from `engageLivingWeapon()`.

**Verification:** The `engageLivingWeapon()` function in `app/server/services/living-weapon.service.ts` (lines 141-242) no longer contains any Combat Skill Rank check. The function's doc comment (lines 137-139) explicitly cites decree-043: "Per decree-043, Combat Skill Rank gates weapon MOVE ACCESS only, not engagement. Any trainer can engage a Living Weapon regardless of Combat rank. Rank gating deferred to P1 (move injection)." The `meetsSkillRequirement()` function and `SKILL_RANK_ORDER` are retained in the service file for future P1 use, which is correct.

**Per decree-043:** This implementation now matches the decree ruling exactly. The function allows any trainer to engage regardless of rank. The `LivingWeaponMove.requiredRank` field in the constants file correctly records which rank each move requires (Adept for Wounding Strike/Double Swipe, Master for Bleed!) for future P1 move injection. No decree violation.

**Status:** RESOLVED CORRECTLY

### HIGH #2: Engage Always Charges Wielder's Standard Action -- FIXED

**Previous issue:** The engage endpoint always marked `standardActionUsed: true` on the wielder, ignoring PTU p.306: "Re-engaging is a Standard Action that may be taken by either party."

**Fix commit:** `11f9dfa9` -- Overhauled the engage endpoint to accept `initiatorId`.

**Verification:** `app/server/api/encounters/[id]/living-weapon/engage.post.ts` now:
1. Accepts `body.initiatorId` (line 39), defaulting to `body.wielderId` for backwards compatibility.
2. Validates `initiatorId` is either `wielderId` or `weaponId` (lines 41-46).
3. Validates the initiator's turn is active (lines 60-78, including held action support).
4. Checks Standard Action availability on the initiator (lines 80-86).
5. Marks `standardActionUsed: true` on the initiator specifically (lines 100-111).

**PTU Quote:** "Re-engaging is a Standard Action that may be taken by either party." (`core/10-indices-and-reference.md#p306`)

The implementation now correctly supports either the wielder or the weapon initiating engagement, with the Standard Action consumed on whichever combatant initiates. This matches PTU RAW.

**Status:** RESOLVED CORRECTLY

### MEDIUM #1: No Turn Validation for Engage/Disengage -- FIXED

**Previous issue:** Neither endpoint validated that the initiating combatant's turn was currently active.

**Fix commits:** `11f9dfa9` (engage overhaul), `afe70f52` (disengage overhaul)

**Verification:**

Engage endpoint (lines 58-78): Parses `turnOrder` from encounter record, finds `currentTurnId`, checks `isInitiatorsTurn` or `hasHeldAction`. Returns 400 if neither condition is met. Error message: "Can only engage a Living Weapon on the initiator's turn (or with a held action)".

Disengage endpoint (lines 46-66): Same pattern -- parses turn order, checks `isInitiatorsTurn` or `hasHeldAction` for the `body.combatantId`. Returns 400 if neither condition is met.

**PTU Quote:** "Either the Living Weapon or the Wielder can disengage as a Swift Action during their turn" (`core/10-indices-and-reference.md#p306`)

The "during their turn" constraint is now properly enforced. The held action exception is consistent with the existing codebase pattern (switch endpoint uses similar validation).

**Status:** RESOLVED CORRECTLY

## Mechanics Verified

### Living Weapon Capability Definition
- **Rule:** "Living Weapon: In addition to being a Pokemon, Honedge and its evolutionary relatives also count as equipment and may be used as such if the Pokemon is willing." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `getLivingWeaponConfig()` in `app/utils/combatantCapabilities.ts` (lines 400-423) checks species name against `LIVING_WEAPON_CONFIG` map (primary), then falls back to scanning `otherCapabilities` for "Living Weapon" string (homebrew support). Returns null if neither match.
- **Status:** CORRECT

### Weapon Species Mapping
- **Rule:** "Honedge may be used as a Small Melee Weapon. Doublade may be used as two Small Melee Weapons; when one is held in each hand, the user gains +2 to Evasion. Aegislash may be used as a Small Melee Weapon and a Light Shield." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `LIVING_WEAPON_CONFIG` in `app/constants/livingWeapon.ts`:
  - Honedge: `occupiedSlots: ['mainHand']`, `grantsShield: false`, `dualWieldEvasionBonus: 0` -- one-handed Small Melee Weapon
  - Doublade: `occupiedSlots: ['mainHand', 'offHand']`, `grantsShield: false`, `dualWieldEvasionBonus: 2` -- two Small Melee Weapons, +2 Evasion
  - Aegislash: `occupiedSlots: ['mainHand', 'offHand']`, `grantsShield: true`, `dualWieldEvasionBonus: 0` -- Small Melee Weapon + Light Shield
- **Status:** CORRECT

### Weapon Quality Tiers
- **Rule:** "A Honedge counts as a Simple Weapon [...] A Doublade counts as a Simple Weapon [...] An Aegislash counts as a Fine Weapon" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** Honedge `weaponType: 'Simple'`, Doublade `weaponType: 'Simple'`, Aegislash `weaponType: 'Fine'`
- **Status:** CORRECT

### Weapon Move Data
- **Rule:** Wounding Strike (PTU p.288): Normal, EOT, AC 2, DB 6, Physical, WR 1 Target, "target loses a Tick of Hit Points." Double Swipe (PTU p.288): Normal, EOT, AC 2, DB 4, Physical, WR 2 Targets or 1 Target Double Strike, None. Bleed! (PTU p.290): Normal, Scene x2, AC 2, DB 9, Physical, WR 1 Target, "target loses Tick of HP at start of next 3 turns."
- **Implementation:** Constants in `app/constants/livingWeapon.ts`:
  - `WOUNDING_STRIKE`: name='Wounding Strike', type='Normal', frequency='EOT', ac=2, damageBase=6, damageClass='Physical', range='WR, 1 Target', effect='The target loses a Tick of Hit Points.', tier='Adept', requiredRank='Adept'
  - `DOUBLE_SWIPE`: name='Double Swipe', type='Normal', frequency='EOT', ac=2, damageBase=4, damageClass='Physical', range='WR, 2 Targets; or WR, 1 Target, Double Strike', effect='None', tier='Adept', requiredRank='Adept'
  - `BLEED`: name='Bleed!', type='Normal', frequency='Scene x2', ac=2, damageBase=9, damageClass='Physical', range='WR, 1 Target', effect='The target loses a Tick of Hit Points at the start of their next three turns.', tier='Master', requiredRank='Master'
- **Status:** CORRECT (all values match PTU RAW verbatim)

### Species-to-Move Mapping
- **Rule:** "A Honedge counts as a Simple Weapon and grants the Adept Move Wounding Strike. A Doublade counts as a Simple Weapon and Grants the Adept Move Double Swipe. An Aegislash counts as a Fine Weapon and grants the Adept Move Wounding Strike and the Master Move Bleed!" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** Honedge `grantedMoves: [WOUNDING_STRIKE]`, Doublade `grantedMoves: [DOUBLE_SWIPE]`, Aegislash `grantedMoves: [WOUNDING_STRIKE, BLEED]`
- **Status:** CORRECT

### Combat Skill Rank Gate (Post-Fix)
- **Rule:** PTU p.287: "Simple Weapons grant a single Move that can be used if the wielder has Adept Combat or higher, and Fine Weapons grant two Moves, one at Adept Combat or higher and another at Master Combat or higher." Per decree-043: "Combat Skill Rank gates weapon move access only, not Living Weapon engagement."
- **Implementation:** No rank check in `engageLivingWeapon()`. The `requiredRank` field is correctly stored per-move in `LivingWeaponMove` for future P1 move injection: `'Adept'` for Wounding Strike and Double Swipe, `'Master'` for Bleed!.
- **Status:** CORRECT (per decree-043)

### Engage Action Economy
- **Rule:** "Re-engaging is a Standard Action that may be taken by either party." (`core/10-indices-and-reference.md#p306`)
- **Implementation:** `engage.post.ts` accepts `initiatorId` (wielder or weapon). Standard Action validated and consumed on the initiator. Turn validation enforces "during their turn" (or held action). Action availability check prevents double-spending.
- **Status:** CORRECT

### Disengage Action Economy
- **Rule:** "Either the Living Weapon or the Wielder can disengage as a Swift Action during their turn" (`core/10-indices-and-reference.md#p306`)
- **Implementation:** `disengage.post.ts` accepts `combatantId` (either the wielder or weapon). Swift Action validated and consumed on the specified combatant. Turn validation enforces "during their turn" (or held action).
- **Status:** CORRECT

### Action Availability Validation
- **Rule:** Standard Action and Swift Action are each once-per-turn resources.
- **Implementation:** Engage checks `initiator.turnState.standardActionUsed` (line 81) and returns 400 if already used. Disengage checks `initiator.turnState.swiftActionUsed` (line 69) and returns 400 if already used. Both checks occur before any state mutation.
- **Status:** CORRECT

### Fainted Weapon Persistence
- **Rule:** "When Fainted, these Pokemon may still be used as inanimate pieces of equipment, but all rolls made with them take a -2 penalty." (`core/10-indices-and-reference.md#p305`)
- **Implementation:** `WieldRelationship.isFainted` flag set during engage (service lines 212-213) based on `pokemon.currentHp <= 0 || statusConditions.includes('Fainted')`. Fainted Living Weapons remain wielded -- no auto-disengage on faint. Penalty application is correctly deferred to P1 scope.
- **Status:** CORRECT (P0 scope: tracking only)

### Auto-Disengage on Combatant Removal
- **Rule:** Implicit -- removed combatants cannot participate in relationships. Design spec: "Combatant removal: automatically dissolved without action cost."
- **Implementation:** `clearWieldOnRemoval()` in the service (lines 319-349) clears flags on the remaining partner and removes the relationship. No action cost charged.
- **Status:** CORRECT

### Homebrew Species Handling
- **Rule:** N/A (implementation robustness, not PTU RAW)
- **Implementation (post-fix):** Two-layer handling:
  1. `getLivingWeaponConfig()` in `combatantCapabilities.ts` (lines 412-419): homebrew Pokemon with "Living Weapon" in `otherCapabilities` get a config based on Honedge defaults with the actual species name.
  2. `engageLivingWeapon()` in the service (lines 204-209): validates `weaponConfig.species` against known species list (`['Honedge', 'Doublade', 'Aegislash']`). Unknown species default to `'Honedge'` for the `WieldRelationship.weaponSpecies` field, matching the reconstruction logic.
  3. `reconstructWieldRelationships()` in `living-weapon-state.ts` (lines 35-37): same defaulting logic.
- **Status:** CORRECT (consistent handling across all three paths)

### Wield State Reconstruction
- **Rule:** N/A (implementation pattern)
- **Implementation:** `living-weapon-state.ts` scans combatants for `wieldingWeaponId` flags, looks up weapon combatant, determines species (defaulting unknown to Honedge), derives fainted state from entity HP. Consistent with how the engage service creates relationships.
- **Status:** CORRECT

### WebSocket State Sync
- **Rule:** N/A (implementation pattern, but relevant for rules correctness -- clients must see correct game state)
- **Implementation (post-fix):**
  1. Both endpoints now broadcast `encounter_update` with the full `buildEncounterResponse()` payload (engage line 133-136, disengage line 120-124). This resolves the C1 crash from code-review-297.
  2. `living_weapon_engage` and `living_weapon_disengage` are now in the `WebSocketEvent` union type in `app/types/api.ts` (lines 53-54).
  3. `useWebSocket.ts` has no-op handler cases for both event types (lines 239-244) with comments explaining state sync happens via the companion `encounter_update`.
  4. `ws.ts` relay handlers for both events (lines 543-555) follow the established broadcast pattern.
- **Status:** CORRECT

## Summary

All three issues from rules-review-270 have been resolved correctly in the fix cycle:

1. **HIGH #1 (Combat Skill Rank gate):** Removed entirely from engagement, per decree-043. Rank requirements correctly retained per-move for future P1 move injection. No decree violation.

2. **HIGH #2 (Engage action economy):** `initiatorId` parameter added. Either the wielder or weapon can initiate engagement, and the Standard Action is consumed on the correct party. Matches PTU p.306 verbatim.

3. **MEDIUM #1 (Turn validation):** Both engage and disengage now validate that the initiating combatant's turn is active (or they have a held action). Matches PTU p.306 "during their turn" constraint.

Additionally, the code-review-297 fixes (verified for rules impact):
- **C1 fix:** Full encounter response in WS broadcast means clients now receive correct wield state -- no rules impact, but ensures all clients see the correct game state.
- **H2 fix:** Response objects now reflect the consumed action (standardActionUsed/swiftActionUsed) -- ensures API consumers see accurate turn state.
- **M1 fix:** Homebrew species gracefully default to Honedge config -- no rules issue since homebrew Pokemon are outside PTU RAW, but the Honedge default is a reasonable fallback.
- **M3 fix:** Action availability checks now prevent illegal double-spending of Standard/Swift Actions.

The mount/dismount endpoints (pre-existing bug from code-review-297 C1 note) have also been fixed in commit `22cdf4c7` to send full encounter responses. This is good housekeeping but was not a rules-review issue.

## Rulings

No new rules issues found. All previously identified issues have been resolved.

### Decree Compliance

- **decree-043:** Fully compliant. Engagement has no rank gate. Rank requirements stored per-move for P1.
- **decree-033:** No interaction with Living Weapon fainted state. Fainted Living Weapons remain wielded (different mechanic than fainted Pokemon switching).
- **decree-038:** No interaction with Living Weapon engage/disengage. Sleep status does not affect wield eligibility.

### Potential Future Rules Concern (Informational, Not Blocking)

The Weaponize ability (PTU p.306, `core/10-indices-and-reference.md`): "While being wielded as a Living Weapon and being actively Commanded as a Pokemon, the user may Intercept for its Wielder as a Free Action." This ability is not implemented in P0 (correctly deferred), but P1/P2 should ensure the Living Weapon's ability interactions are handled. This is noted for the P1 reviewer, not as a current issue.

## Verdict

**APPROVED**

All rules-review-270 issues have been correctly resolved. The Living Weapon P0 implementation now accurately reflects PTU 1.05 rules for:
- Living Weapon capability parsing and species mapping
- Weapon quality tiers and move data
- Engage/disengage action economy with correct initiator support
- Turn validation and action availability checks
- Fainted weapon persistence
- Auto-disengage on combatant removal
- Homebrew species graceful handling
- Per decree-043: no engagement rank gate

No CRITICAL, HIGH, or MEDIUM rules issues remain. The P0 is rules-correct and ready for progression.
