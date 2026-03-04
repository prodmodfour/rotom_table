---
review_id: rules-review-292
review_type: rules
reviewer: game-logic-reviewer
trigger: fix-cycle-rereview
target_report: feature-005
domain: combat
commits_reviewed:
  - cbb0134a
  - b3dcb764
  - dcf159e6
  - 3c8ac002
  - 0cd31069
  - 7baef017
  - 0f044b3b
mechanics_verified:
  - weapon-move-db-modifier
  - weapon-stab-exclusion
  - equipment-bonuses-extraction
  - weapon-move-gm-ui-injection
  - evasion-reload-refresh
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 09-gear-and-items.md#page-287
  - 09-gear-and-items.md#page-288
  - 09-gear-and-items.md#page-289
  - 09-gear-and-items.md#page-290
  - 10-indices-and-reference.md#page-305
  - 10-indices-and-reference.md#page-306
reviewed_at: 2026-03-04T10:50:00Z
follows_up: rules-review-289
---

## Re-Review Context

This is a re-review of feature-005 P1 (Living Weapon Equipment Integration) following a fix cycle of 7 commits that addressed all 6 issues raised in rules-review-289 (1H+2M) and code-review-316 (1H+2M). Each original issue is verified below.

## Issue Resolution Verification

### rules-review-289 HIGH-001: Weapon Move DB Missing Small Melee Weapon +1 Modifier

**Original issue:** Weapon move DB values used raw book values (Wounding Strike DB 6, Double Swipe DB 4, Bleed! DB 9) without applying the Small Melee Weapon +1 DB modifier required by PTU p.287: "Small Melee Weapons raise the Damage Base by +1."

**Fix commit:** cbb0134a

**Verification:** Reviewed `app/constants/livingWeapon.ts` lines 48-90. The DB values are now:
- Wounding Strike: DB **7** (6 base + 1 Small Melee) -- line 58
- Double Swipe: DB **5** (4 base + 1 Small Melee) -- line 71
- Bleed!: DB **10** (9 base + 1 Small Melee) -- line 84

A clear comment block at lines 48-51 explains the modifier: "DB values include the Small Melee Weapon +1 DB modifier (PTU p.287: 'Small Melee Weapons raise the Damage Base by +1'). Base DB -> effective DB: Wounding Strike 6->7, Double Swipe 4->5, Bleed! 9->10."

**PTU cross-check:** PTU p.287 states: "All modifications that a Weapon makes to Struggle Attacks also apply to the Moves they grant." The example given on p.287 demonstrates a Large Melee Weapon (+1 AC, +2 DB) applied to an AC 2 DB 4 move resulting in AC 3 DB 6. The same principle applies to Small Melee Weapons (+1 DB only). All three Living Weapon species count as Small Melee Weapons per PTU p.305.

**Status:** RESOLVED. DB values are correct.

### rules-review-289 MEDIUM-001: Weapon Moves Can Incorrectly Receive STAB

**Original issue:** Neither client-side `useMoveCalculation.ts` nor server-side `calculateDamage()` checked the `[Weapon]` keyword to exclude STAB, despite PTU p.287 stating "these Moves can never benefit from STAB."

**Fix commit:** b3dcb764

**Verification:** Three code paths now correctly block STAB for weapon moves:

1. **Client-side move resolution** (`app/composables/useMoveCalculation.ts` line 347): `hasSTAB` computed property includes the guard `if (move.value.keywords?.includes('Weapon')) return false` before the STAB type check.

2. **Move display** (`app/components/encounter/MoveButton.vue` line 48): `if (props.move.keywords?.includes('Weapon')) return false` in the `hasSTAB` computed property prevents the STAB indicator from appearing on weapon moves in the UI.

3. **Server-side damage calculation** (`app/utils/damageCalculation.ts` lines 190-192, 327-329): `DamageCalcInput` interface now has an optional `moveKeywords` field, and `calculateDamage()` checks `const isWeaponMove = input.moveKeywords?.includes('Weapon') ?? false` before applying STAB.

**PTU cross-check:** PTU p.287 explicitly states: "these Moves can never benefit from STAB." The `keywords: ['Weapon']` tag is set on all injected weapon moves in both `getGrantedWeaponMoves()` (living-weapon.service.ts:483) and the GMActionModal computed (line 278). All three STAB code paths now check this keyword.

**Status:** RESOLVED. STAB is correctly blocked for weapon-keyword moves in all code paths.

### rules-review-289 MEDIUM-002: Stale Evasion on Encounter Reload

**Original issue:** `buildCombatantFromEntity()` calls `computeEquipmentBonuses()` without wield relationship awareness. When an encounter is loaded from a saved state with active wield relationships, the wielder's cached evasion values would not reflect the Living Weapon equipment overlay.

**Fix commit:** 0cd31069

**Verification:** Reviewed `app/server/services/encounter.service.ts` lines 238-252. `buildEncounterResponse()` now:

1. Reconstructs wield relationships via `reconstructWieldRelationships(combatants)` (line 242)
2. If any wield relationships exist, maps over all combatants and calls `refreshCombatantEquipmentBonuses(wieldRelationships, c)` for each wielder (lines 244-252)
3. Uses the refreshed `effectiveCombatants` array in the returned `ParsedEncounter` (line 261)

The `refreshCombatantEquipmentBonuses()` function (living-weapon.service.ts lines 416-450) correctly recalculates physical, special, and speed evasion using `getEffectiveEquipmentBonuses()` which applies the Living Weapon overlay before computing bonuses. This ensures cached evasion values on the Combatant object match the client-side dynamic computation.

**Status:** RESOLVED. Evasion values are refreshed after wield relationship reconstruction on every encounter load.

## Non-Rules Fixes Verified (Code Review Issues)

### code-review-316 HIGH-001: Weapon Moves Not Injected Into GM Move Selection UI

**Fix commit:** 3c8ac002

**Verification:** Reviewed `app/components/encounter/GMActionModal.vue` lines 242-285. The `moves` computed property now:

1. Checks `encounterStore.encounter?.wieldRelationships` for an active wield relationship where this Pokemon is the weapon (line 248)
2. Finds the wielder and reads their `skills.Combat` rank (lines 252-255)
3. Looks up `LIVING_WEAPON_CONFIG` for the weapon species (line 258)
4. Filters granted moves by the wielder's Combat rank using `SKILL_RANK_ORDER` index comparison (lines 261-267), correctly implementing decree-043 (rank gates move access, not engagement)
5. Maps weapon moves to the `Move` type with `keywords: ['Weapon']` (line 278), which triggers the STAB exclusion

**Rules concern:** The rank gating logic (lines 261-267) uses the same `SKILL_RANK_ORDER` array and index comparison as the server-side `meetsSkillRequirement()` function in living-weapon.service.ts. The logic is duplicated but consistent. Both correctly allow Adept Combat to access Adept moves and Master Combat for Master moves. Per decree-043, this is the correct behavior.

**Status:** RESOLVED. Weapon moves appear in the GM UI for wielded Pokemon, correctly filtered by wielder Combat rank.

### code-review-316 MEDIUM-001: File Size Extraction

**Fix commit:** dcf159e6

**Verification:** `useMoveCalculation.ts` is now 800 lines (confirmed via line count). The `getEffectiveEquipBonuses()` function was extracted to `app/utils/equipmentBonuses.ts` (lines 218-235) as a shared utility. No PTU rules implications from this refactoring -- the logic is identical, just relocated.

**Status:** RESOLVED. No rules impact.

### code-review-316 MEDIUM-002: Documentation Update

**Fix commit:** 7baef017

**Status:** Documentation-only. No rules impact.

## Regression Check

### Equipment Overlay Integrity

The refactoring in dcf159e6 extracted `getEffectiveEquipBonuses()` from inline in `useMoveCalculation.ts` to `app/utils/equipmentBonuses.ts`. Verified the extracted function (lines 218-235) maintains identical behavior:
- Checks `combatant.type !== 'human'` guard
- Reads `wieldRelationships` to find the wielder's relationship
- Applies `computeEffectiveEquipment()` overlay before computing bonuses
- Returns standard `EquipmentCombatBonuses` interface

The composable now imports from the utility (`import { getEffectiveEquipBonuses } from '~/utils/equipmentBonuses'` at line 4) and wraps it in a closure that injects wield relationships from the encounter store (lines 81-84). No behavioral change.

### STAB Calculation Pipeline

Verified the STAB exclusion does not interfere with normal STAB behavior:
- `useMoveCalculation.ts` line 347: Weapon check happens before type check. If `keywords` is undefined or does not include 'Weapon', control falls through to the normal `checkSTAB()` call.
- `damageCalculation.ts` line 328-329: `isWeaponMove` defaults to `false` via nullish coalescing. Normal moves without `moveKeywords` will proceed with standard STAB logic.
- Non-weapon Normal-type moves used by Normal-type Pokemon will still correctly receive STAB.

### Minimum Damage Floors (decree-001)

The damage calculation pipeline in `useMoveCalculation.ts` (lines 629-636) still applies:
- Post-defense floor: `Math.max(1, damage)` at line 630
- Post-effectiveness floor: `Math.max(1, damage)` at line 632
- Immune override: `if (effectiveness === 0) damage = 0` at line 634-636

The weapon move changes do not alter this pipeline. Per decree-001: COMPLIANT.

### Decree Compliance

- **decree-043:** Verified. Engagement remains unrestricted (no rank check in `engageLivingWeapon()`). Move access is gated by Combat rank in both server-side `getGrantedWeaponMoves()` and client-side `GMActionModal.vue` moves computed. COMPLIANT.
- **decree-044:** No 'Bound' condition introduced. COMPLIANT.
- **decree-001:** Minimum damage floors preserved. COMPLIANT.

## Summary

All 6 issues from the original reviews (rules-review-289 + code-review-316) have been resolved:

| Original Issue | Fix Commit | Status |
|---|---|---|
| rules HIGH-001: Missing +1 DB modifier | cbb0134a | RESOLVED |
| rules MEDIUM-001: Weapon STAB not blocked | b3dcb764 | RESOLVED |
| rules MEDIUM-002: Stale evasion on reload | 0cd31069 | RESOLVED |
| code HIGH-001: Weapon moves not in GM UI | 3c8ac002 | RESOLVED |
| code MEDIUM-001: File size limit exceeded | dcf159e6 | RESOLVED |
| code MEDIUM-002: Docs not updated | 7baef017 | RESOLVED |

No regressions detected. No new PTU rule violations found. Decree compliance verified.

## Verdict

**APPROVED**

The P1 fix cycle correctly addresses all identified issues. Weapon move DB values now include the Small Melee Weapon +1 modifier per PTU p.287. STAB is blocked for weapon-keyword moves in all three code paths per PTU p.287. Evasion values are refreshed on encounter reload to account for Living Weapon equipment overlay. The GM UI correctly injects weapon moves filtered by wielder Combat rank per decree-043.
