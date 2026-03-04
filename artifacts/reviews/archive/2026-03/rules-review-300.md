---
review_id: rules-review-300
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-024
domain: testing
commits_reviewed:
  - e250a53f
  - cc691946
mechanics_verified:
  - living-weapon-skill-rank-gating
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Weapons
reviewed_at: 2026-03-04T14:50:00Z
follows_up: code-review-324
---

## Mechanics Verified

### Living Weapon Skill Rank Gating (decree-043)
- **Rule:** Per decree-043, "Combat Skill Rank gates weapon move access only, not Living Weapon engagement. Any trainer can engage a willing Living Weapon regardless of Combat rank."
- **Implementation:** The `meetsSkillRequirement` function is tested in isolation (lines 172-205) as a pure rank-comparison utility. In the production service (`living-weapon.service.ts:493`), it is used only for filtering weapon moves by rank (`.filter(wm => meetsSkillRequirement(rank, wm.requiredRank))`), NOT for gating engagement. The `engageLivingWeapon` tests (lines 207+) do not assert any rank-based rejection of engagement. This correctly implements decree-043.
- **Status:** CORRECT

## Summary

Re-reviewed the fix commit `e250a53f` addressing code-review-324 findings H1 and M1:

**H1 (duplicate vi.mock dead code):** RESOLVED. The file now contains exactly one `vi.mock('~/utils/equipmentBonuses', ...)` block at line 27, which includes all three exports (`computeEquipmentBonuses`, `computeEffectiveEquipment`, `getEquipmentGrantedCapabilities`). The earlier duplicate block (previously lines 17-26) has been completely removed. No dead code remains.

**M1 (reference equality assertion):** RESOLVED. The `.toBe(combatants)` assertion at line 569 now has an explicit comment: "Intentional reference equality: no-op path must return the original array (not a copy)". This documents that reference equality is the deliberate design intent for the no-op path in `clearWieldOnRemoval`, not an accidental use of `.toBe` where `.toEqual` was intended.

No new issues were introduced by the fix commit. The remaining mock blocks are clean, each mocking a distinct dependency. The test file structure is unchanged apart from the targeted H1/M1 fixes.

## Rulings

No new PTU rule ambiguities discovered. decree-043 compliance confirmed -- `meetsSkillRequirement` is correctly scoped to move access filtering, not engagement gating.

## Verdict

**APPROVED** -- Both code-review-324 findings are cleanly resolved. No new issues introduced. Test assertions remain consistent with PTU Living Weapon mechanics per decree-043.

## Required Changes

None.
