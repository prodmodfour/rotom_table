---
review_id: code-review-209
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-087, refactoring-088, ptu-rule-117, ux-009, ux-010
domain: vtt-grid, combat, character-lifecycle, encounter-tables
commits_reviewed:
  - c76cb8e
  - 05a2cda
  - e8da88a
  - 83264fb
  - b3a032c
files_reviewed:
  - app/tests/unit/stores/terrain.test.ts
  - app/tests/unit/stores/terrain-migration.test.ts
  - app/composables/useMoveCalculation.ts
  - app/tests/unit/composables/useMoveCalculation.test.ts
  - app/constants/trainerClasses.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/utils/encounterBudget.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T16:45:00Z
follows_up: null
---

## Review Scope

Five P4 fixes across four domains, covering code health (test file split, parameter strictness), PTU data correction (contest stat name), UX improvement (proactive immunity display), and boundary logic (significance tiers). All five commits are single-file or two-file changes with well-scoped granularity.

### Decree Compliance

- **decree-012** (type-immunity enforcement with GM override): ux-009 adds proactive IMMUNE label display in StatusConditionsModal. The existing GM Override button and server-side enforcement remain intact. The `getImmuneLabel` change only affects display -- save/apply logic is untouched. Compliant.
- **decree-022** (specialization suffix for branching classes): ptu-rule-117 changes the Style Expert specialization from 'Beautiful' to 'Beauty'. The branching class system with colon-suffix format is preserved. Compliant.
- **decree-025** (exclude endpoints from rough terrain penalty): refactoring-088 makes allCombatants required but does not change the rough terrain logic. Endpoint exclusion at lines 197-198 of useMoveCalculation.ts is preserved. Compliant.
- **decree-026** (Martial Artist not branching): Verified trainerClasses.ts -- Martial Artist has no `isBranching` flag and is absent from `BRANCHING_CLASS_SPECIALIZATIONS`. Compliant.

## Issues

### MEDIUM

**MED-1: `combatantsOnGrid` computed is now a trivial passthrough (refactoring-088)**

File: `app/composables/useMoveCalculation.ts`, lines 111-113

After removing the fallback, `combatantsOnGrid` is now just `computed(() => allCombatants.value)` -- a one-line wrapper that adds no logic. It is used in exactly one place (`enemyOccupiedCells`, line 119). This indirection makes the code slightly harder to follow without providing abstraction value.

However, this is cosmetic -- the named computed serves as documentation of intent ("these are all combatants on the grid"). Filed as an observation; does not block approval.

**MED-2: Significance tier boundaries use floating-point approximation (ux-010)**

File: `app/utils/encounterBudget.ts`, lines 90, 97

The fix changes `max: 5.0` to `max: 4.99` and `max: 7.0` to `max: 6.99`. While this resolves the overlap at exact integer boundaries, it introduces a micro-gap: multiplier values like 4.995 would fall into no tier. In practice this is irrelevant because the UI uses preset values (4.0, 6.0, 8.0) and the multiplierRange is informational for display, not used in classification logic. The `resolvePresetFromMultiplier` function in experienceCalculation.ts matches on `defaultMultiplier` equality, not range membership. No functional impact.

A cleaner pattern would be exclusive upper bounds in the comparison logic (e.g., `min <= x < max`) rather than adjusting the data. But since the ranges are currently display-only and no comparison function iterates them, this is acceptable as-is.

## PTU Rules Verification (rules-review-185 scope)

### ptu-rule-117: Style Expert specialization 'Beauty'

**Verified correct.** PTU Core p.389 (Chapter 8: Pokemon Contests) defines the five Contest Stats as: **Beauty, Cool, Cute, Smart, Tough** (also confirmed at p.262: "Cool, Tough, Beauty, Smart, and Cute"). The table of contents lists "Beauty Expert Features" at p.115, and the Style Expert class text at ~p.2485 reads: "choose from Beauty, Cool, Cute, Smart, or Tough." The previous value 'Beautiful' was the adjective form; 'Beauty' is the canonical stat name. Fix is correct.

### ux-009: Type immunity IMMUNE tags

**Verified correct per decree-012 and PTU p.239.** The type-immunity mapping in `typeStatusImmunity.ts` correctly encodes PTU p.239 immunities (Electric/Paralysis, Fire/Burn, Ghost/Stuck+Trapped, Ice/Frozen, Poison+Steel/Poison). Showing these proactively gives GMs visibility without requiring trial-and-error. The warning banner (lines 11-17) and GM Override button (lines 46-51) remain gated on actual checkbox interaction, so the override workflow is unaffected. The `isNewAndImmune` CSS class still only activates when a user checks an immune status -- visual hierarchy is well-designed.

### ux-010: Significance tier boundaries

**Verified against PTU Core p.460/p.473.** PTU defines significance multipliers as a range "from x1 to about x5" with the following guidance: insignificant x1-x1.5, everyday x2-x3, significant x4-x5. The tool extends beyond RAW with Climactic (x5-x7) and Legendary (x7-x10) as GM convenience tiers. The overlap fix ensures each numeric value maps to exactly one tier. The pre-existing gaps between tiers (x1.5-x2.0, x3.0-x4.0) are intentional -- these represent the "in-between" values that PTU leaves to GM judgment.

## What Looks Good

1. **refactoring-087: Clean test split.** The `migrateLegacyCell` describe block was cleanly extracted into its own file with the correct import. No test logic was changed -- a byte-for-byte move. terrain.test.ts dropped from 811 to 773 lines, safely under the 800-line project maximum. The new file is 89 lines with 7 well-structured tests. No Pinia store setup is needed since `migrateLegacyCell` is a pure function, which the new file correctly reflects (no `beforeEach` with `createPinia`).

2. **refactoring-088: Correct approach to eliminating the fallback.** Making `allCombatants` required eliminates the silent fallback that could mask bugs where a caller forgets to pass the full combatant list. The single production caller (`MoveTargetModal.vue`, line 288) already passes the value -- it receives `allCombatants` from `GMActionModal.vue` via the `:targets` prop (line 164 of GMActionModal). All 11 test call sites were updated to pass an explicit `allCombatants` ref containing both actor and target, which is the correct minimal set for tests that don't involve intervening enemies. The one test that does involve intervening enemies (line 277) correctly includes the enemy in the allCombatants array.

3. **ptu-rule-117: Surgical one-line fix.** Correct PTU stat name verified against source material. No cascading impact -- this is a constant used for specialization selection in the UI.

4. **ux-009: Minimal, well-targeted change.** Removing two guard clauses (the checkbox-checked check and the already-applied check) makes the IMMUNE label proactive while preserving the existing warning banner and GM Override button for the actual save flow. The separation between display-only proactive labels and action-gated warnings is clean.

5. **Commit granularity is correct.** Five tickets, five commits, each touching 1-2 files. Commit messages are descriptive with PTU page references where applicable.

## Verdict

**APPROVED**

All five changes are correct, well-scoped, and follow project patterns. The two MEDIUM items are cosmetic observations, not blocking issues. PTU rules compliance is verified across all three rule-touching changes. No decree violations found.

## Required Changes

None.
