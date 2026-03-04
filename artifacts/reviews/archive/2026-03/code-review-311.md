---
review_id: code-review-311
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-129
domain: combat
commits_reviewed:
  - 02beecb7
  - 0caab34e
  - d8a20ea1
  - 931891bd
files_reviewed:
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/services/switching.service.ts
  - app/composables/useSwitching.ts
  - app/tests/unit/services/switching.service.test.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - .claude/skills/references/app-surface.md
  - app/types/encounter.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T01:15:00Z
follows_up: code-review-308
---

## Review Scope

Re-review of the ptu-rule-129 fix cycle. The previous review (code-review-308) found 1 HIGH and 2 MEDIUM issues. The developer addressed all three across 4 commits (02beecb7, 0caab34e, d8a20ea1, 931891bd). Additionally, decree-044 was recorded to formally resolve the 'Bound' condition ambiguity that was flagged as MEDIUM-002.

This review verifies all three code-review-308 issues are resolved and checks for regressions introduced by the fix cycle.

**Decrees checked:** decree-039 (Roar blocked by Trapped), decree-044 (remove phantom Bound condition), decree-034 (Roar uses own 6m range; Whirlwind is push), decree-033 (fainted switch on turn only), decree-038 (condition behavior decoupling). No violations found.

## Issues

None.

## What Looks Good

1. **HIGH-001 fully resolved (02beecb7).** `recall.post.ts` line 118 now reads `pokemon.tempConditions || []` instead of the previous `(pokemon.entity as { tempConditions?: string[] })?.tempConditions || []`. This matches the Combatant type definition (`app/types/encounter.ts` line 49), where `tempConditions` is a property on the Combatant interface, not on the inner entity. The fix follows the exact same pattern already used in `switching.service.ts` lines 427 and 610. The developer also added an inline comment on line 116 ("Note: tempConditions lives on the combatant, not the entity.") matching the documentation comment added to `switching.service.ts` during the initial fix, which guards against future regression. The 'Bound' check was simultaneously removed from the same condition on line 120, which was the correct approach since both fixes touch adjacent lines.

2. **MEDIUM-001 fully resolved (d8a20ea1).** `app-surface.md` line 192 now reads `canSwitch, canFaintedSwitch, canForcedSwitch pre-validation` instead of the previous `canSwitch, canFaintedSwitch pre-validation`. The comma-separated listing follows the existing pattern. Verified the actual useSwitching.ts composable exports `canForcedSwitch` in its return object (line 248).

3. **MEDIUM-002 fully resolved (0caab34e + decree-044).** Rather than filing a simple follow-up ticket, the developer escalated to a decree-need and obtained decree-044 which ruled that 'Bound' has no PTU basis and should be removed entirely. The fix correctly removed `|| allRecalledConditions.includes('Bound')` from:
   - `switching.service.ts` line 429 (`validateSwitch`)
   - `switching.service.ts` line 612 (`validateForcedSwitch`)
   - `useSwitching.ts` line 155 (`canForcedSwitch`)
   - `recall.post.ts` line 120 (standalone recall endpoint, already removed in 02beecb7)
   - `switching.service.test.ts` lines 178-206 (entire `as any` test case deleted)

   Grep confirms zero remaining 'Bound' references in any switching-related file. The only `Bound` references remaining in the server codebase are about Bound AP (Action Points from Stratagems/Features per decree-016/019), which is an entirely unrelated concept.

4. **Ticket hygiene is clean (931891bd).** Three related tickets were properly resolved:
   - `bug-049`: Primary ticket from decree-044, resolution log references both fix commits.
   - `bug-048`: Duplicate ticket from code-review-308 + rules-review-281, marked as resolved with cross-reference to bug-049.
   - `refactoring-105`: Pre-existing refactoring ticket from code-review-236 for the same issue, marked as subset of bug-049.
   - `ptu-rule-129` resolution log updated with all three fix cycle commits (entries 6-8), documenting the full commit chain from initial fix through fix cycle.

5. **No regressions detected.** The fix cycle changes are purely subtractive (removing dead 'Bound' checks) and corrective (fixing tempConditions data source). No new logic was introduced. The remaining test suite still covers the critical Trapped condition scenarios:
   - Trapped in statusConditions blocks forced switch (line 152)
   - Trapped in tempConditions blocks forced switch (line 181)
   - Non-Trapped Pokemon allows forced switch (lines 209, 235)
   - Standard switch Trapped blocking (line 355)
   - Existing forced switch validations (inactive encounter, missing trainer, fainted release) all preserved (lines 262-334)

6. **Consistency across all validation layers is verified.** All four locations that check Trapped for recall-blocking now use the identical pattern:
   - Read `statusConditions` from `entity` (correct -- persisted on entity)
   - Read `tempConditions` from `combatant` (correct -- combat-scoped, per Combatant type)
   - Combine into `allConditions` array
   - Check only for `'Trapped'` (per decree-044)

   Locations verified: `switching.service.ts:validateSwitch` (line 429), `switching.service.ts:validateForcedSwitch` (line 612), `recall.post.ts` (line 120), `useSwitching.ts:canForcedSwitch` (line 155).

7. **Commit granularity is correct.** Each of the 4 commits addresses a single concern: tempConditions source fix, Bound removal, app-surface.md update, and ticket resolution. Per project commit guidelines, this is the right granularity.

## Verdict

**APPROVED**

All three issues from code-review-308 are fully resolved. The tempConditions data source is corrected in recall.post.ts. The phantom 'Bound' condition checks are completely removed with decree-044 providing formal authority. The app-surface.md reference document is updated. No regressions were introduced. The ptu-rule-129 implementation now has consistent Trapped validation across all four code paths (validateSwitch, validateForcedSwitch, recall endpoint, client-side canForcedSwitch), all reading tempConditions from the correct source (combatant, not entity), and all checking only for Trapped per decree-039 and decree-044.

## Required Changes

None.
