---
review_id: code-review-219
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-122+ptu-rule-123
domain: healing+encounter-tables
commits_reviewed:
  - 9f03df5
  - 06d4a67
  - 96f95cd
  - 6756ec3
  - 968fa4c
  - 3b1f344
  - cbae10f
files_reviewed:
  - app/utils/restHealing.ts
  - app/tests/unit/utils/restHealing.test.ts
  - app/utils/encounterBudget.ts
  - app/server/utils/significance-validation.ts
  - app/utils/experienceCalculation.ts
  - app/prisma/schema.prisma
  - app/components/encounter/SignificancePanel.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/server/api/pokemon/[id]/rest.post.ts
  - app/server/api/characters/[id]/rest.post.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/pokemon/[id]/extended-rest.post.ts
  - app/server/api/encounters/[id]/significance.put.ts
  - app/server/services/encounter.service.ts
  - app/types/encounter.ts
  - app/stores/encounter.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T10:15:00Z
follows_up: null
---

## Review Scope

Two decree-driven P3 bug fixes reviewed together:

1. **ptu-rule-122** (rest domain): Apply minimum 1 HP floor to rest healing per decree-029. Two code files changed, four new test cases added.
2. **ptu-rule-123** (encounter domain): Remove climactic (x6) and legendary (x8) significance presets per decree-030. Five files changed across client types, server validation, and schema comments.

## Decree Compliance

### decree-029 (Rest healing minimum 1 HP)
**Compliant.** The `Math.max(1, Math.floor(maxHp / 16))` pattern is applied in both `calculateRestHealing()` (line 66) and `getRestHealingInfo()` (line 175). Both sites include a comment referencing the decree. The fix is correctly scoped: it applies to the shared utility that all four rest endpoints import (`pokemon/[id]/rest.post.ts`, `characters/[id]/rest.post.ts`, `pokemon/[id]/extended-rest.post.ts`, `characters/[id]/extended-rest.post.ts`). No server-side duplication of the formula exists -- all endpoints call `calculateRestHealing()` from the shared utility. Both entity types (HumanCharacter + Pokemon) are covered through the same code path.

### decree-030 (Cap significance presets at x5)
**Compliant.** The `SignificanceTier` union type was narrowed from 5 values to 3 (`'insignificant' | 'everyday' | 'significant'`). The `SIGNIFICANCE_PRESETS` array was reduced from 5 to 3 entries. The `significant` tier's `defaultMultiplier` was correctly bumped from 4.0 to 5.0 and its range widened to `{ min: 4.0, max: 5.0 }` to cover the full x4-x5 band. Server-side validation (`significance-validation.ts`) was updated in lockstep. Custom numeric input remains available (confirmed in both `SignificancePanel.vue` and `XpDistributionModal.vue`, which still render a `<option value="custom">Custom</option>` with a numeric input accepting up to 10).

## Analysis

### ptu-rule-122: Rest Healing Minimum

**Correctness of the fix:**
- `Math.max(1, Math.floor(maxHp / 16))` is the correct pattern. It ensures the floor of the division is computed first, then clamped to a minimum of 1.
- The existing `actualHeal = Math.min(healAmount, effectiveMax - currentHp)` cap on line 68 prevents over-healing. Even with the minimum 1 HP floor, a Pokemon already at effective max HP is blocked by the `currentHp >= effectiveMax` guard on line 60. This was verified by the "does not over-heal past effective max" test case.
- The `getRestHealingInfo()` function (used for UI display) was updated consistently, so the HP-per-rest tooltip will show "1" instead of "0" for low-HP entities.

**Test coverage:**
- Updated existing test from expecting 0 to expecting 1 (the core behavioral change).
- Added three new edge case tests: Shedinja-level maxHp (14), maxHp of 1, and over-heal prevention.
- Added two `getRestHealingInfo` tests verifying the display function returns correct `hpPerRest` for both low and normal HP values.
- All six test descriptions correctly reference decree-029.

**No server-side duplication detected:** All four rest API endpoints (`pokemon/rest`, `characters/rest`, `pokemon/extended-rest`, `characters/extended-rest`) import and call `calculateRestHealing()` from the shared utility. The extended rest endpoints loop over periods, calling `calculateRestHealing` per period, so the minimum floor applies correctly to each 30-minute rest period.

### ptu-rule-123: Significance Preset Cap

**Correctness of the fix:**
- Removed 'climactic' and 'legendary' from the `SignificanceTier` type union -- TypeScript will now catch any lingering references at compile time.
- Removed the two preset objects from `SIGNIFICANCE_PRESETS` array.
- Server-side `VALID_SIGNIFICANCE_TIERS` whitelist updated to match.
- Prisma schema comment updated (comment-only change, no migration needed).
- `experienceCalculation.ts` comments updated, and the derived `SIGNIFICANCE_PRESETS` object (used by the UI) is auto-generated from `encounterBudget.ts` via `Object.fromEntries(BUDGET_PRESETS.map(...))`, so no separate update was needed there.

**Backward compatibility with existing DB data:**
- Existing encounters with `significanceTier = 'climactic'` or `significanceTier = 'legendary'` in the DB will load correctly. The `encounter.service.ts` line 240 casts with `as SignificanceTier`, and the `resolvePresetFromMultiplier()` function (used in both `SignificancePanel.vue` and `XpDistributionModal.vue`) will fall through to `'custom'` for multiplier values 6.0 or 8.0 since they no longer match any preset. This is the correct behavior as stated in the ticket: "Existing DB data with old tiers renders as 'Custom'."
- Server-side validation (`validateSignificanceTier`) will reject new writes of 'climactic' or 'legendary' tiers, which is correct -- the server should not accept the removed values going forward.
- The `significanceMultiplier` numeric field is independent of the tier label, so XP calculations on old encounters remain numerically correct.

**No orphaned references:** Searched the full `app/` tree for `climactic` and `legendary` -- no significance-related references remain. The `legendary` hits in the codebase are all capture-rate related (Pokemon species legendary status) or encounter-table rarity presets, which are completely separate domains.

**UI components verified:**
- `SignificancePanel.vue` iterates `SIGNIFICANCE_PRESETS` via `v-for="(value, key) in SIGNIFICANCE_PRESETS"` -- automatically renders only the three remaining presets.
- `XpDistributionModal.vue` uses the same pattern. Both still offer "Custom" as an option.

### Commit Granularity

Appropriate. The ptu-rule-122 fix is a single focused commit (code + tests together). The ptu-rule-123 fix is split into four logical commits: encounterBudget type/presets, server validation, experienceCalculation comments, and Prisma schema comment. Each commit produces a working state. Documentation commits for ticket resolution logs are separate.

## What Looks Good

1. **Single source of truth for healing formula.** The `calculateRestHealing()` utility is the sole calculation point, imported by all four rest endpoints. The fix needed only one file change to cover both entity types and both rest modes.

2. **Derived constants pattern.** The `experienceCalculation.ts` SIGNIFICANCE_PRESETS are auto-derived from `encounterBudget.ts` via `Object.fromEntries(BUDGET_PRESETS.map(...))`. Removing presets from the canonical source automatically propagated to the UI -- no manual sync needed.

3. **Thorough test coverage for decree-029.** The four new test cases cover the exact edge cases described in the decree: Shedinja-level HP, absolute minimum HP, and the over-heal guard. The `getRestHealingInfo` tests verify the display layer matches the calculation layer.

4. **Server-side validation updated in lockstep.** The `VALID_SIGNIFICANCE_TIERS` whitelist was updated in the same commit series, preventing future API requests from writing the removed tiers.

5. **Clean backward compatibility.** Old DB records with removed tiers gracefully degrade to "Custom" display via the `resolvePresetFromMultiplier()` fallthrough. No data migration needed.

6. **Good decree citation discipline.** Both code comments and test descriptions reference the governing decree by ID.

## Verdict

**APPROVED.** Both fixes are correct, well-scoped, properly tested, and fully compliant with their governing decrees. No issues found at any severity level.
