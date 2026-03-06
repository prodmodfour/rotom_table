---
review_id: code-review-361
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-129
domain: combat
commits_reviewed:
  - 65d55a8f
  - dbec2fc8
  - d303c57f
  - 10452518
  - c8bd0b60
  - 9c03190f
  - 3d3dfcd8
  - 50bcbc59
  - 937fe056
  - c39ce9b8
  - 84b5e3be
  - 2866c72d
  - 97917c1a
  - 6d4c5392
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/constants/conditionSourceRules.ts
  - app/constants/statusConditions.ts
  - app/server/services/combatant.service.ts
  - app/server/services/switching.service.ts
  - app/server/services/healing-item.service.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/components/encounter/CombatantConditionsSection.vue
  - app/components/encounter/GMActionModal.vue
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T16:00:00Z
follows_up: code-review-347
---

## Review Scope

Re-review of refactoring-129 after D2 fix cycle. 4 fix commits (c39ce9b8, 84b5e3be, 2866c72d, 97917c1a) plus 1 documentation commit (6d4c5392) addressing all findings from code-review-347 (1 critical, 1 high, 2 medium) and rules-review-314 (1 high, 1 medium). Verified fixes by reading the actual source files, not just the diffs.

**Decrees verified:**
- decree-047: Other conditions do NOT clear on faint by default; clearing is source-dependent. All 5 Other conditions have `clearsOnFaint: false` in `statusConditions.ts`. Source-dependent overrides via `SOURCE_CLEARING_RULES` correctly gate behind `def.category !== 'other'` check. Compliant.
- decree-038: Behaviors remain decoupled from categories. Sleep (`clearsOnRecall: false`) is not affected by source tracking. Compliant.
- decree-005: CS effect reversal in `applyFaintStatus()` only processes conditions in `conditionsToRemove`, not persisting conditions. `reverseStatusCsEffects()` correctly scoped. Compliant.
- decree-053: Terrain/weather `clearsOnRecall: false` diverges from the new decree-053 ruling (should be true). This is properly documented with a NOTE comment citing decree-053 and pending ptu-rule-156. Acceptable as deferred work.

## Fix Verification

### CRIT-001 (code-review-347): applyReviveItem conditionInstances desync -- RESOLVED

**Commit:** c39ce9b8

Verified in `healing-item.service.ts` lines 293-298: after removing Fainted from `entity.statusConditions` (line 290-292), the fix adds a guarded filter on `target.conditionInstances` to remove all Fainted entries. The guard `if (target.conditionInstances)` matches the optional nature of the field on Combatant. The filter uses `i.condition !== 'Fainted'` which correctly targets all Fainted instances regardless of source type. Fix is correct and complete.

### HIGH-001 (code-review-347): end.post.ts conditionInstances not cleared -- RESOLVED

**Commit:** 84b5e3be

Verified in `end.post.ts` lines 91-99: after computing `clearedConditions` (which is the array of conditions that **survived** encounter-end clearing), the fix filters `combatant.conditionInstances` to keep only instances whose condition appears in `clearedConditions`. The filtered result is spread into the returned combatant at line 99. Logic verified: `clearedConditions` is the return value of `clearEncounterEndConditions()`, which filters OUT conditions that should clear, so the surviving set is correct. The `updatedInstances` are then persisted alongside the updated entity. Fix is correct.

Note: the variable name `clearedConditions` is misleading (it holds the survivors, not the cleared ones), but this is a pre-existing naming issue from the original implementation, not introduced by the fix. Not worth a separate ticket for a single variable rename.

### MED-001 (code-review-347): app-surface.md not updated -- RESOLVED

**Commit:** 97917c1a

Verified in `.claude/skills/references/app-surface.md` line 217: `conditionSourceRules.ts` is registered with a comprehensive description covering `SOURCE_CLEARING_RULES`, all three `shouldClearOn*` functions, builder helpers, and `formatConditionDisplay`. Placed in the correct location (after movement modifiers utility, before encounter templates). Fix is correct.

### MED-002 (code-review-347): system source type missing comment -- RESOLVED

**Commit:** 2866c72d

Verified in `conditionSourceRules.ts` lines 36-38: a 3-line comment explains that `system` intentionally omits `clearsOnRecall`/`clearsOnEncounterEnd` so breather-applied conditions (Tripped, Vulnerable) fall back to their static per-condition flags. This is the correct rationale -- system-sourced conditions from breather should clear on recall and encounter end, and the static flags provide exactly that. Fix is correct.

### MEDIUM-001 (rules-review-314): Terrain-sourced Stuck/Slowed recall divergence -- RESOLVED

**Commit:** 6d4c5392

Verified in `conditionSourceRules.ts` lines 28-30: a NOTE comment documents that terrain/weather `clearsOnRecall: false` diverges from decree-053's ruling and references the pending ptu-rule-156 ticket. Also verified that decree-053 exists at `decrees/decree-053.md` and ptu-rule-156 exists at `artifacts/tickets/open/ptu-rule/ptu-rule-156.md`. The divergence is explicitly documented with a clear path to resolution. Fix is correct.

### HIGH-001 (rules-review-314): Same as CRIT-001 above -- RESOLVED

Same fix (c39ce9b8). The rules review identified the same applyReviveItem conditionInstances desync from a game-logic perspective. Covered by the CRIT-001 fix verification above.

## Regression Check

Verified all encounter-scoped code paths that modify `statusConditions` for conditionInstances consistency:

| Code Path | conditionInstances Sync | Status |
|-----------|------------------------|--------|
| `applyFaintStatus()` | Lines 238-242: adds Fainted, removes cleared | Correct |
| `applyHealingToEntity()` | Lines 307-312: removes Fainted on 0-to-positive | Correct |
| `applyReviveItem()` | Lines 293-298: removes Fainted (D2 fix) | Correct |
| `updateStatusConditions()` | Lines 381-402: adds/removes instances | Correct |
| `end.post.ts` clearing | Lines 91-99: filters to match surviving conditions (D2 fix) | Correct |
| `damage.post.ts` Dead | Lines 127-132: adds Dead with system source | Correct |
| `applyRecallSideEffects()` | Lines 780-782: passes instances to shouldClearOnRecall | Correct |
| `buildCombatantFromEntity()` | Line 747: seeds from entity.statusConditions | Correct |

**Out-of-scope desyncs noted** (pre-existing, not introduced by this PR):
- `breather.post.ts` clears volatile conditions at line 133 without filtering conditionInstances. This is from the original breather implementation and is out of scope for refactoring-129.
- `next-turn.post.ts` adds Dead from heavily injured penalty at line 154 without updating conditionInstances. This is from ptu-rule-151, a separate ticket.

These should be tracked as follow-up items but do not block this PR.

## What Looks Good

1. **All 4 review findings are fully resolved.** Each fix is minimal, targeted, and correct. No over-engineering or unnecessary changes.

2. **Commit granularity is correct.** Each fix is a separate commit with a descriptive message referencing the review finding (CRIT-001, HIGH-001, MED-001, MED-002). The docs commit for rules-review-314 MEDIUM-001 is also separate.

3. **The overall source-tracking system is solid.** After the D2 fixes, all encounter-scoped statusConditions mutations within refactoring-129's scope have matching conditionInstances updates. The dual-format architecture (flat statusConditions for persistence, enriched conditionInstances for combat-scoped source tracking) is clean, backward compatible, and follows the existing stageSources pattern per decree-005.

4. **Decree compliance is thorough.** decree-047 binding points are all correctly implemented. decree-038 decoupling is respected. decree-005 CS reversal is properly scoped to source-aware clearing. decree-053 divergence is explicitly documented with a ticket trail.

5. **Backward compatibility is maintained.** All conditionInstances fields are optional with `|| []` guards. The `source` parameter on `updateStatusConditions()` defaults to manual. Pre-existing callers require no changes.

## Verdict

**APPROVED**

All findings from code-review-347 and rules-review-314 are resolved. The fixes are correct, minimal, and well-documented. No regressions introduced within the source-tracking system's scope. The two out-of-scope conditionInstances desyncs (breather volatile clearing, next-turn heavily injured death) should be tracked as separate follow-up tickets but do not block this approval.
