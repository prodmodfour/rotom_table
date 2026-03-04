---
review_id: code-review-319
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/constants/livingWeapon.ts
  - app/composables/useMoveCalculation.ts
  - app/utils/equipmentBonuses.ts
  - app/utils/damageCalculation.ts
  - app/components/encounter/GMActionModal.vue
  - app/components/encounter/MoveButton.vue
  - app/server/services/encounter.service.ts
  - app/server/services/living-weapon.service.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-living-weapon-001/implementation-log.md
  - artifacts/designs/design-living-weapon-001/shared-specs.md
  - artifacts/tickets/open/feature/feature-005.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-04T10:55:00Z
follows_up: code-review-316
---

## Review Scope

Re-review of the P1 fix cycle for feature-005 (Living Weapon Equipment Integration). 7 commits addressing all 6 issues from code-review-316 (1H+2M) and rules-review-289 (1H+2M).

### Decree Compliance

- **decree-043**: Combat Skill Rank gates weapon move access, not engagement. GMActionModal.vue (line 255) correctly reads `human.skills?.Combat` to filter `grantedMoves` by `requiredRank`. The server-side `getGrantedWeaponMoves` in living-weapon.service.ts uses the same `meetsSkillRequirement` pattern. Compliant.
- **decree-044**: No Bound condition references found in changed files. Compliant.
- **decree-001**: Minimum 1 damage enforced in `damageCalculation.ts` at both post-defense (line 347) and final (line 362-365) steps. Compliant.

## Issue Resolution Verification

### rules-review-289 HIGH-001: Weapon Move DB +1 Modifier (RESOLVED)

Commit `cbb0134a` updates `app/constants/livingWeapon.ts` with correct DB values including the Small Melee Weapon +1 modifier: Wounding Strike 7 (line 58), Double Swipe 5 (line 71), Bleed! 10 (line 84). Comment block at lines 48-51 documents the base-to-effective DB conversion. The `shared-specs.md` table was also updated to match. Verified correct per PTU p.287.

### rules-review-289 MEDIUM-001: Weapon Moves STAB Skip (RESOLVED)

Commit `b3dcb764` adds Weapon keyword checks in three STAB paths:

1. **useMoveCalculation.ts** line 347: `if (move.value.keywords?.includes('Weapon')) return false` in the `hasSTAB` computed.
2. **MoveButton.vue** line 48: `if (props.move.keywords?.includes('Weapon')) return false` in the display STAB computed.
3. **damageCalculation.ts** line 328-329: `const isWeaponMove = input.moveKeywords?.includes('Weapon') ?? false` with the result used in the STAB check at line 329.

All three client-side paths are correctly covered. The `DamageCalcInput` interface gains the optional `moveKeywords` field (line 192).

### rules-review-289 MEDIUM-002: Stale Evasion on Encounter Reload (RESOLVED)

Commit `0cd31069` modifies `buildEncounterResponse` in `encounter.service.ts` (lines 238-252). After reconstructing wield relationships, the function maps over combatants and calls `refreshCombatantEquipmentBonuses` for each wielder. The function correctly recalculates all three evasion values (physical, special, speed) using `calculateEvasion` with the Living Weapon equipment overlay. Returns new combatant objects (immutable pattern). Import of `refreshCombatantEquipmentBonuses` added at line 13.

### code-review-316 HIGH-001: Weapon Move Injection in GMActionModal (RESOLVED)

Commit `3c8ac002` adds Living Weapon move injection to `GMActionModal.vue` (lines 242-285). The `moves` computed:

1. Checks for an active wield relationship where the current Pokemon is the weapon (line 248).
2. Finds the wielder and reads their Combat skill rank (lines 252-255).
3. Filters `config.grantedMoves` by rank requirement using `SKILL_RANK_ORDER` (lines 261-267).
4. Maps to the `Move` interface with `keywords: ['Weapon']` (line 278).
5. Deduplicates by name before merging (lines 282-284).

Pattern correctly mirrors the server-side `getGrantedWeaponMoves` logic. Per decree-043, rank gating is applied correctly.

### code-review-316 MEDIUM-001: File Size Limit (RESOLVED)

Commit `dcf159e6` extracts `getEffectiveEquipBonuses` from inline in `useMoveCalculation.ts` to `app/utils/equipmentBonuses.ts` (lines 218-235). File size now 800 lines (verified via `wc -l`), within the 800-line limit. The extracted function is clean -- accepts `(combatant, wieldRelationships)`, delegates to `computeEffectiveEquipment` and `computeEquipmentBonuses`. Unused imports were also cleaned up.

### code-review-316 MEDIUM-002: app-surface.md Update (RESOLVED)

Commit `7baef017` updates `.claude/skills/references/app-surface.md` with P1 additions: `getEffectiveEquipmentBonuses`, `refreshCombatantEquipmentBonuses`, `getGrantedWeaponMoves`, `getEffectiveMoveList` for living-weapon.service.ts; `computeEffectiveEquipment`, `getEffectiveEquipBonuses`, `computeTargetEvasions` wield support for the equipment section.

## New Issues Found

### MEDIUM-001: `calculate-damage.post.ts` missing `moveKeywords` passthrough

**File:** `app/server/api/encounters/[id]/calculate-damage.post.ts` lines 273-289

The `calculateDamage()` call in this endpoint does not pass `moveKeywords: move.keywords` despite the `move` object (resolved from `getEffectiveMoveList` on line 192) having `keywords: ['Weapon']` for Living Weapon moves, and the `DamageCalcInput.moveKeywords` field being available since commit `b3dcb764`.

This means the server-side 9-step damage calculation endpoint will not skip STAB for weapon moves. For the current Honedge line (Steel/Ghost types using Normal-type weapon moves), this is not practically triggerable because STAB requires type matching. However, the fix is incomplete -- any future Living Weapon species with type-matching weapon moves would receive incorrect STAB. The fix is a single-line addition: `moveKeywords: move.keywords,` in the `calculateDamage` input object.

**Severity rationale:** MEDIUM, not HIGH, because (a) the current Living Weapon species cannot trigger the bug in practice, and (b) the client-side path (which is the primary calculation path used by the GM) is correctly fixed.

## Commit Granularity Assessment

Good. Each commit addresses exactly one review issue with a focused scope: 1-3 files changed per commit. The refactor extraction (dcf159e6) is cleanly separated from the functional fixes. Documentation commits are separate from code changes.

## Regression Check

- `computeEquipmentBonuses` function signature unchanged; existing callers unaffected.
- `getEffectiveEquipBonuses` extraction preserves identical logic (moved, not rewritten).
- `buildEncounterResponse` evasion refresh only fires when `wieldRelationships.length > 0`, zero impact on encounters without Living Weapons.
- GMActionModal move injection is guarded by `wieldRels.find(r => r.weaponId === props.combatant.id)` -- only triggers for wielded Pokemon.
- No schema changes, no new endpoints, no store modifications.

## Verdict: APPROVED

All 6 issues from code-review-316 and rules-review-289 are resolved. The one new MEDIUM issue (missing `moveKeywords` passthrough in `calculate-damage.post.ts`) does not block approval because it is not practically triggerable with the current Living Weapon species and the primary client-side path is correctly fixed. A follow-up ticket should be filed for the passthrough fix.
