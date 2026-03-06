---
review_id: rules-review-320
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
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
  - 6d4c5392
mechanics_verified:
  - faint-clearing-persistent-volatile
  - faint-clearing-other-source-dependent
  - cs-reversal-on-faint
  - recall-clearing-source-aware
  - encounter-end-clearing-source-aware
  - condition-instance-lifecycle
  - revive-conditionInstances-sync
  - encounter-end-conditionInstances-sync
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 246 (Persistent Afflictions)
  - core/07-combat.md#Page 247 (Volatile Afflictions)
  - core/07-combat.md#Page 248 (Other Afflictions, Fainted)
reviewed_at: 2026-03-06T18:00:00Z
follows_up: rules-review-314
---

## Mechanics Verified

### 1. Faint Clearing -- Persistent and Volatile Conditions (PTU p.246-248)

- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." (`core/07-combat.md` line 1691-1692)
- **Implementation:** `applyFaintStatus()` in `combatant.service.ts:206-243` iterates all current conditions. For each, it calls `shouldClearOnFaint(condition, instance)`. For Persistent and Volatile conditions (category !== 'other'), the function returns the static `clearsOnFaint` flag, which is `true` for all 14 Persistent+Volatile conditions in `statusConditions.ts`.
- **Status:** CORRECT. All Persistent and Volatile conditions clear unconditionally on faint regardless of source, matching PTU p.246-248.

### 2. Faint Clearing -- Other Conditions, Source-Dependent (decree-047)

- **Rule:** Per decree-047: "Other conditions do NOT clear on faint by default; clearing is source-dependent." Move/ability/item sources clear on faint; terrain/weather/environment/manual/unknown do not.
- **Implementation:** `shouldClearOnFaint()` in `conditionSourceRules.ts:51-72`: for 'other' category conditions, checks `SOURCE_CLEARING_RULES[instance.sourceType]`. Move/ability/item return `clearsOnFaint: true`. Terrain/weather/environment/manual return `clearsOnFaint: false`. System returns `clearsOnFaint: false`. Unknown (`{}`) falls back to static flag (`clearsOnFaint: false` for all Other conditions). All 5 Other conditions have `clearsOnFaint: false` with decree-047 comments in `statusConditions.ts`.
- **Status:** CORRECT. Per decree-047, source-dependent clearing is correctly implemented.

### 3. CS Effect Reversal on Faint (decree-005)

- **Rule:** Per decree-005: Burn (-2 Def), Paralysis (-4 Speed), Poison (-2 SpDef) CS effects must be reversed when the condition is cured.
- **Implementation:** `applyFaintStatus()` calls `reverseStatusCsEffects(combatant, condition)` for each condition in `conditionsToRemove` (lines 228-230). Conditions that persist through faint (per source-aware logic) retain their CS effects. This is correct: if a condition is not cleared, its CS effect should remain.
- **Status:** CORRECT. CS reversal is properly coupled to source-aware clearing.

### 4. Recall Clearing -- Source-Aware (PTU p.247-248, decree-053)

- **Rule:** PTU p.248 (line 1719, 1724): Stuck "may be removed by switching", Slowed "may be removed by switching". Decree-053 rules: Other conditions clear on recall per RAW; terrain/weather re-apply on send-out (pending ptu-rule-156).
- **Implementation:** `shouldClearOnRecall()` in `conditionSourceRules.ts:78-99`. `applyRecallSideEffects()` in `switching.service.ts:769-793` passes `conditionInstances` for source-aware filtering. Both `recall.post.ts` (line 198) and `switch.post.ts` (line 236) pass `conditionInstances`.
- **Known divergence:** `SOURCE_CLEARING_RULES` currently has `clearsOnRecall: false` for terrain/weather, which contradicts decree-053's ruling that recall should always clear. However, commit 6d4c5392 added a documentation comment (lines 28-30) noting this divergence and referencing the pending ptu-rule-156 ticket. This is an acknowledged, tracked deviation pending implementation.
- **Status:** CORRECT for current state. The terrain/weather recall divergence is properly documented and tracked per decree-053. No rules violation -- the decree acknowledges this needs a follow-up ticket.

### 5. Encounter-End Clearing -- Source-Aware (PTU p.247, decree-038, decree-047)

- **Rule:** PTU p.247: "Volatile Afflictions are cured completely at the end of the encounter." Per decree-038: individual `clearsOnEncounterEnd` flags control clearing. Per decree-047: Other conditions use source-based clearing.
- **Implementation:** `clearEncounterEndConditions()` in `end.post.ts:28-36` uses `shouldClearOnEncounterEnd()` with condition instances. The D2 fix (commit 84b5e3be) now also filters `conditionInstances` to match the cleared conditions (lines 91-94, 99), fixing the HIGH-001 desync from code-review-347.
- **Status:** CORRECT. The conditionInstances are now properly filtered at encounter end.

### 6. Condition Instance Lifecycle -- Revive Path (D2 Fix for CRIT-001/HIGH-001)

- **Rule:** When Fainted is removed (via revive item), the corresponding `conditionInstances` entry must also be removed to maintain the dual-format invariant.
- **Implementation (applyReviveItem):** Commit c39ce9b8 added lines 293-297 in `healing-item.service.ts`, filtering `target.conditionInstances` to remove Fainted entries after removing Fainted from `entity.statusConditions`. This fix mirrors the existing pattern in `applyHealingToEntity()` (lines 307-312).
- **Implementation (applyHealingToEntity):** Lines 307-312 in `combatant.service.ts` also remove Fainted from `conditionInstances` when HP goes from 0 to positive. Both paths are now consistent.
- **Status:** CORRECT. The CRIT-001 / rules-review-314 HIGH-001 finding is fully resolved.

### 7. Condition Instance Lifecycle -- Seeding on Combat Entry

- **Rule:** Pre-existing conditions on combat entry get 'unknown' source (safe default per decree-047).
- **Implementation:** `buildCombatantFromEntity()` in `combatant.service.ts:744-747` seeds `conditionInstances` from `entity.statusConditions` using `buildUnknownSourceInstance()`. Unknown-source conditions fall back to static flags for all clearing decisions.
- **Status:** CORRECT.

### 8. Condition Instance Lifecycle -- Application with Source (status.post.ts)

- **Rule:** `updateStatusConditions()` accepts optional source; defaults to 'manual' per decree-047.
- **Implementation:** `updateStatusConditions()` in `combatant.service.ts:357-433` correctly creates `ConditionInstance` with source metadata for added conditions and removes instances for removed conditions. `status.post.ts` validates source type against a whitelist (line 110) and requires a non-empty label (line 116).
- **Status:** CORRECT.

### 9. System Source Clearing Rules (D2 Fix for MED-002)

- **Rule:** System-applied conditions (breather penalties like Tripped, Vulnerable) should use static per-condition flags for recall/encounter-end clearing, while not clearing on faint.
- **Implementation:** Commit 2866c72d added a clarifying comment (lines 36-38 in `conditionSourceRules.ts`) explaining that `system` intentionally omits `clearsOnRecall`/`clearsOnEncounterEnd` so that breather-applied Tripped/Vulnerable fall back to their static flags (`clearsOnRecall: true`, `clearsOnEncounterEnd: true`). This is correct: breather-applied conditions should still clear on recall and encounter end.
- **Status:** CORRECT. The intentional omission is now documented.

### 10. Terrain/Weather Recall Divergence Documentation (D2 Fix for rules-review-314 MEDIUM-001)

- **Rule:** Decree-053 establishes that Other conditions clear on recall per RAW, then re-apply on send-out if the source persists.
- **Implementation:** Commit 6d4c5392 added a NOTE comment (lines 28-30 in `conditionSourceRules.ts`) documenting that terrain/weather `clearsOnRecall: false` diverges from decree-053 and is pending ptu-rule-156 to implement the clear-then-reapply pattern.
- **Status:** CORRECT as documentation. The divergence is acknowledged and tracked. The actual fix (setting `clearsOnRecall: true` and adding a send-out re-apply hook) is deferred to ptu-rule-156, which is the correct scope boundary.

### 11. Dead Instance Tracking (damage.post.ts)

- **Rule:** When a combatant dies, Dead should be added to conditionInstances with system source.
- **Implementation:** `damage.post.ts` lines 127-132 add `{ condition: 'Dead', sourceType: 'system', sourceLabel: deathCheck.cause || 'Death' }` to `conditionInstances`. Also in switch.post.ts and recall.post.ts for heavily injured penalty death paths.
- **Status:** CORRECT.

### 12. Faint Path Consistency Check (Regression Scan)

- **Rule:** All code paths that cause fainting must go through `applyFaintStatus()` to maintain conditionInstances sync.
- **Verified paths:**
  - `damage.post.ts`: calls `applyDamageToEntity()` which calls `applyFaintStatus()` on faint. Heavily injured penalty also calls `applyFaintStatus()` directly.
  - `move.post.ts`: same pattern as damage.post.ts for target damage and actor heavily injured penalty.
  - `next-turn.post.ts`: tick damage calls `applyFaintStatus()` on faint. Weather damage calls `applyFaintStatus()`. Heavily injured penalty calls `applyFaintStatus()`.
  - `switch.post.ts`: heavily injured penalty on standard switch calls `applyFaintStatus()`.
  - `recall.post.ts`: heavily injured penalty on double recall calls `applyFaintStatus()`.
- **Status:** CORRECT. No faint path bypasses `applyFaintStatus()`. All paths maintain conditionInstances consistency.

### 13. Decree-038 Compliance -- Behavior Decoupling

- **Rule:** Per decree-038: each condition has independent behavior flags; category is for display/grouping only.
- **Implementation:** `statusConditions.ts` defines per-condition flags. The source-tracking system extends this for Other conditions only. Sleep (Asleep, Bad Sleep) has `clearsOnRecall: false, clearsOnEncounterEnd: false` per decree-038, which is not affected by source tracking (Sleep is volatile, not other).
- **Status:** CORRECT.

## Summary

All D2 fix commits successfully resolve the findings from both code-review-347 and rules-review-314:

| Original Finding | Fix Commit | Verification |
|---|---|---|
| CRIT-001 (code-review-347): applyReviveItem conditionInstances desync | c39ce9b8 | RESOLVED -- conditionInstances now filtered to remove Fainted in applyReviveItem() |
| HIGH-001 (code-review-347): end.post.ts conditionInstances not cleared | 84b5e3be | RESOLVED -- conditionInstances now filtered at encounter end |
| MED-001 (code-review-347): app-surface.md not updated | Already in app-surface.md line 217 | RESOLVED -- conditionSourceRules.ts is registered |
| MED-002 (code-review-347): system source type missing comment | 2866c72d | RESOLVED -- clarifying comment added |
| HIGH-001 (rules-review-314): applyReviveItem Fainted instance desync | c39ce9b8 (same fix) | RESOLVED |
| MEDIUM-001 (rules-review-314): Terrain-sourced Stuck/Slowed recall divergence | 6d4c5392 | RESOLVED -- documented with decree-053 reference, pending ptu-rule-156 |

The source-tracking system correctly implements decree-047's source-dependent clearing for Other conditions while maintaining full PTU RAW compliance for Persistent and Volatile conditions. No regressions were found in any faint, recall, or encounter-end code path. The dual-format storage (flat statusConditions + enriched conditionInstances) maintains backward compatibility and achieves the design goal of source-aware condition clearing.

## Rulings

1. **Persistent/Volatile faint clearing:** CORRECT per PTU p.248 line 1692. All 14 conditions clear unconditionally on faint.

2. **Other condition faint clearing:** CORRECT per decree-047. Source-dependent clearing produces correct results for all source types.

3. **CS effect reversal on faint:** CORRECT per decree-005. Only reversed for conditions actually cleared by source-aware logic.

4. **Sleep persistence:** CORRECT per decree-038. Sleep's special behavior flags are unaffected by source tracking.

5. **Revive conditionInstances sync:** CORRECT after D2 fix (c39ce9b8). Both applyReviveItem and applyHealingToEntity paths now properly remove Fainted from conditionInstances.

6. **Encounter-end conditionInstances sync:** CORRECT after D2 fix (84b5e3be). conditionInstances are filtered to match cleared conditions.

7. **Terrain/weather recall divergence:** Acknowledged divergence from RAW/decree-053, properly documented and tracked via ptu-rule-156.

## Verdict

**APPROVED**

All findings from both code-review-347 and rules-review-314 have been satisfactorily resolved. The four D2 fix commits correctly address the identified issues without introducing regressions. The source-tracking system is PTU-compliant for Persistent and Volatile conditions and correctly implements decree-047 for Other conditions. The terrain/weather recall divergence is an acknowledged, tracked item with a clear path to resolution (ptu-rule-156 per decree-053).

## Required Changes

None. All prior findings resolved.
