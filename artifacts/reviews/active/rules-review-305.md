---
review_id: rules-review-305
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-050
domain: combat
commits_reviewed:
  - c3b07416
mechanics_verified:
  - weapon-move-stab-exclusion
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#weapon-moves
reviewed_at: 2026-03-04T19:30:00Z
---

## Mechanics Verified

### Weapon Move STAB Exclusion
- **Rule:** "these Moves can never benefit from STAB" (`core/09-gear-and-items.md`, line 1284, PTU p.287). Moves with the [Weapon] keyword must not receive the +2 STAB bonus to Damage Base.
- **Implementation:** The `calculateDamage()` function in `app/utils/damageCalculation.ts` (lines 332-334) correctly checks `input.moveKeywords?.includes('Weapon')` and sets `isWeaponMove = true`, then skips STAB: `const stabApplied = !isWeaponMove && hasSTAB(input.moveType, input.attackerTypes)`. The `DamageCalcInput` interface declares `moveKeywords?: string[]` (line 197). Before the fix, `calculate-damage.post.ts` did not pass `moveKeywords` in the `calculateDamage()` call, meaning `input.moveKeywords` was `undefined`, causing `isWeaponMove` to always be `false` on the server side. The fix (commit `c3b07416`) adds `moveKeywords: move.keywords` at line 280, ensuring the server-side damage calculation correctly excludes STAB for Weapon keyword moves.
- **Status:** CORRECT

### STAB Formula Integrity
- **Rule:** STAB adds +2 to Damage Base, not a multiplier on final damage (`core/07-combat.md`, lines 790-793).
- **Implementation:** `damageCalculation.ts` line 335: `const effectiveDB = weatherAdjustedDB + (stabApplied ? 2 : 0)`. This correctly adds +2 to DB. The fix does not alter this formula -- it only ensures the `moveKeywords` input reaches the function so the Weapon exclusion check can fire.
- **Status:** CORRECT

## Summary

Bug-050 fixes a missing data passthrough in the server-side damage calculation endpoint. The `calculateDamage()` utility already had correct Weapon keyword STAB exclusion logic (checking `moveKeywords?.includes('Weapon')`), but the server endpoint `calculate-damage.post.ts` was not passing `move.keywords` into the function call. The single-line fix adds `moveKeywords: move.keywords` to the input object.

The bug is currently not triggerable in practice (the only Living Weapon Pokemon in the system is the Honedge line, which is Steel/Ghost type, and its weapon moves are Normal type -- so STAB would never match anyway). However, the fix is correct as a defensive measure for future Living Weapon configurations where a weapon move's type could match the wielder's type.

## Rulings

Per decree-043 (Living Weapon skill rank gate): Combat Skill Rank gates Living Weapon move access, not engagement. This decree is not directly relevant to the STAB exclusion fix but confirms the Living Weapon system is decree-governed. No new ambiguities discovered.

## Verdict

**APPROVED** -- the fix correctly passes `moveKeywords` to `calculateDamage()`, enabling the existing Weapon STAB exclusion logic on the server side. The implementation matches PTU p.287 RAW: weapon moves can never benefit from STAB.

## Required Changes

None.
