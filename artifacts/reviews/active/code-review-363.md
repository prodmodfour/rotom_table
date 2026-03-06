---
review_id: code-review-363
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-058
domain: combat
commits_reviewed:
  - ed1a7628
  - 94c4be48
  - 584e26e9
files_reviewed:
  - app/types/combat.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/components/encounter/CombatantGmActions.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
  - app/stores/encounter.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useEncounterCombatActions.ts
  - app/tests/unit/services/combatant.service.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T16:30:00Z
follows_up: code-review-352
---

## Review Scope

Re-review of bug-058 D2 fix cycle. Three commits addressing all issues raised in code-review-352:

- **ed1a7628** (HIGH-002): Reset lossType selector to 'damage' after applying HP reduction
- **94c4be48** (HIGH-001): Move HpReductionType to ~/types/combat.ts as single source of truth
- **584e26e9** (MED-002): Add 21 calculateDamage lossType unit tests

Rules already APPROVED (rules-review-317). This is a code-only re-review.

## Issue Resolution Verification

### HIGH-001: HpReductionType union inlined 6 times -- RESOLVED

The canonical definition now lives at `app/types/combat.ts` (line 77) with full PTU citation JSDoc. All 6 previously inlined `'damage' | 'hpLoss' | 'setHp'` unions were replaced:

| File | Change |
|------|--------|
| CombatantGmActions.vue | emit type + ref type -> `HpReductionType` |
| CombatantCard.vue | emit type -> `HpReductionType` |
| CombatantSides.vue | emit type -> `HpReductionType` |
| encounter.ts (store) | applyDamage param -> `HpReductionType` |
| useEncounterActions.ts | handleDamage param -> `HpReductionType` |
| useEncounterCombatActions.ts | import moved from `~/server/services/combatant.service` to `~/types` |

The re-export in `combatant.service.ts` (line 28: `export type { HpReductionType } from '~/types/combat'`) preserves backward compatibility for any external imports. Verified via grep: zero files still import `HpReductionType` from `combatant.service`.

The barrel file `app/types/index.ts` re-exports `~/types/combat` via `export * from './combat'`, so `import { HpReductionType } from '~/types'` resolves correctly for all consumer files.

No remaining inline `'damage' | 'hpLoss' | 'setHp'` unions exist outside the canonical definition.

### HIGH-002: lossTypeInput not reset after damage -- RESOLVED

In `CombatantGmActions.vue` line 212, `lossTypeInput.value = 'damage'` is now set immediately after emitting the damage event and resetting `damageInput`. The reset is inside the `if (damageInput.value > 0)` guard, which is correct -- the reset only fires when damage is actually applied, not on spurious clicks with zero damage.

The reset ordering (emit first, then reset) is correct: the emitted value captures the current `lossTypeInput.value` before the reset changes it.

### MED-001: Temp HP / HP loss ambiguity -- NO CODE CHANGE NEEDED

Per decree-054, the current 3-type enum is correct for now. The future split of `hpLoss` into recoil/self-cost subtypes is tracked as bug-069 (separate ticket). The current implementation and tests correctly reflect the current behavior where all `hpLoss` bypasses temp HP.

### MED-002: No unit tests for lossType parameter -- RESOLVED

21 new tests added in `combatant.service.test.ts`, organized into 6 describe blocks:

1. **Default backward compatibility** (2 tests): omitted `lossType` defaults to `'damage'`, massive damage still triggers
2. **damage type** (4 tests): lossType in result, massive damage, temp HP absorption, marker injuries
3. **hpLoss type** (6 tests): lossType in result, skips massive damage, bypasses temp HP, markers still apply, fainting, accumulation without massive damage
4. **setHp type** (5 tests): lossType in result, skips massive damage, bypasses temp HP, markers still apply, fainting
5. **Injury accumulation across lossTypes** (1 test): verifies injury count differences between damage (marker + massive) vs hpLoss/setHp (marker only)
6. **Temp HP interaction by lossType** (3 tests): damage absorbs, hpLoss preserves, setHp preserves

Test quality assessment:
- Tests exercise the pure `calculateDamage` function directly, no mocking complexity
- Assertions check both positive behaviors (what should happen) and negative behaviors (what should NOT happen)
- The hpLoss accumulation test (lines 834-841) is particularly well-crafted: verifies both that massive damage is skipped AND that marker injuries still accumulate, covering 2 markers crossed
- Temp HP interaction tests cover both partial absorption (damage <= tempHp) and full bypass scenarios
- All three lossType values are tested with consistent parameters (maxHp=100), making results easy to verify mentally

## Decree Compliance

- **decree-001** (minimum 1 damage): Not affected by lossType changes. The minimum damage floor is applied in `damageCalculation.ts`, upstream of `calculateDamage`. No conflict.
- **decree-004** (massive damage uses real HP): Correctly preserved. The massive damage check at line 131 of `combatant.service.ts` uses `hpDamage` (after temp HP absorption), not total damage. Only applies when `lossType === 'damage'`.
- **decree-054** (split hpLoss into recoil/self-cost): Current implementation uses the existing 3-type enum. The future expansion is tracked as bug-069. No violation.

## What Looks Good

- **Commit granularity is excellent**: each of the 3 issues is in its own commit with a clear message referencing the original review issue ID. This makes future bisect trivial.
- **JSDoc on the canonical type**: the `HpReductionType` definition in `combat.ts` includes PTU page references and explains all three values. Future developers will understand the distinction without reading the ticket.
- **Backward compatibility re-export**: the `export type { HpReductionType } from '~/types/combat'` in `combatant.service.ts` prevents breakage for any imports the developer may have missed. Defensive and correct.
- **Test file organization**: the new `calculateDamage lossType` describe block is cleanly separated from the existing `buildCombatantFromEntity` tests, with a section header comment. The existing tests were not modified (only the import line was extended).
- **No over-engineering**: the fixes are minimal and targeted. No unnecessary refactoring beyond what was required.
- **File sizes within limits**: `combatant.service.ts` is 791 lines (under 800). Test file is 914 lines but test files are exempt from the size rule.

## Verdict

**APPROVED**

All three issues from code-review-352 are fully resolved. The type centralization is clean with no stale imports. The lossType reset is correctly placed. The test coverage is thorough and well-structured. No new issues introduced. Decree compliance verified.
