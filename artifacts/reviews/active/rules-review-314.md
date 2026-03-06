---
review_id: rules-review-314
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
  - 2b68cff0
  - 9c03190f
  - 3d3dfcd8
  - 50bcbc59
  - e53491a1
  - 937fe056
  - 3b6d3722
  - ed89b94d
mechanics_verified:
  - faint-clearing
  - recall-clearing
  - encounter-end-clearing
  - source-dependent-condition-clearing
  - condition-instance-lifecycle
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/07-combat.md#Page 246 (Persistent Afflictions)
  - core/07-combat.md#Page 247 (Volatile Afflictions)
  - core/07-combat.md#Page 248 (Other Afflictions, Fainted)
reviewed_at: 2026-03-06T10:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Faint Clearing — Persistent and Volatile Conditions (PTU p.246-248)

- **Rule:** PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." PTU p.246: "All Persistent Status conditions are cured if the target is Fainted." PTU p.247: "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions."
- **Implementation:** In `applyFaintStatus()` (`combatant.service.ts:183-220`), each condition is checked via `shouldClearOnFaint()`. For Persistent/Volatile conditions (category !== 'other'), `shouldClearOnFaint()` returns the static `clearsOnFaint` flag from `statusConditions.ts`. All 5 Persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) have `clearsOnFaint: true`. All Volatile conditions (Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) also have `clearsOnFaint: true`. The source type is irrelevant for these categories.
- **Status:** CORRECT. Persistent and Volatile conditions always clear on faint regardless of source, matching PTU p.246-248.

### 2. Faint Clearing — Other Conditions (decree-047)

- **Rule:** PTU p.248 mentions only Persistent and Volatile for faint clearing. Decree-047 establishes: (1) Other conditions do NOT clear on faint by default, (2) clearing is source-dependent — move/ability/item sources clear, terrain/weather/environment/manual do not, (3) unknown sources fall back to static flag (false).
- **Implementation:** `shouldClearOnFaint()` in `conditionSourceRules.ts:45-66`: for category 'other', checks `SOURCE_CLEARING_RULES[instance.sourceType]`. Move/ability/item sources return `clearsOnFaint: true`. Terrain/weather/environment/manual return `clearsOnFaint: false`. Unknown source (`{}`) falls back to static flag (`clearsOnFaint: false` for all Other conditions per decree-047). System source returns `clearsOnFaint: false`.
- **Decree compliance:** The five Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) all have `clearsOnFaint: false` in `statusConditions.ts` (lines 181, 188, 195, 202, 209), each with a comment citing decree-047. The source-dependent override logic matches decree-047's three binding points exactly.
- **Status:** CORRECT. Per decree-047, source-dependent clearing is correctly implemented.

### 3. Faint — CS Effect Reversal (decree-005)

- **Rule:** Per decree-005, status conditions with inherent CS effects (Burn -2 Def, Paralysis -4 Speed, Poison -2 SpDef) must be reversed when cured on faint.
- **Implementation:** `applyFaintStatus()` calls `reverseStatusCsEffects()` for each condition in `conditionsToRemove` (line 205-207). This correctly reverses CS effects only for conditions that are actually cleared by faint, not for conditions that persist.
- **Status:** CORRECT. CS reversal is properly coupled to source-aware clearing.

### 4. Recall Clearing — Source-Aware (PTU p.247-248, decree-047 P1)

- **Rule:** PTU p.247: "Volatile Afflictions are cured completely... from Pokemon by recalling them into their Poke Balls." PTU p.248: Stuck and Slowed "may be removed by switching."
- **Implementation:** `shouldClearOnRecall()` in `conditionSourceRules.ts:72-93`: for non-other conditions, uses static `clearsOnRecall` flag. For Other conditions, checks `SOURCE_CLEARING_RULES`. `applyRecallSideEffects()` in `switching.service.ts:769-793` passes `conditionInstances` and uses `shouldClearOnRecall()` per-condition. Both `recall.post.ts` (line 194) and `switch.post.ts` (line 233) pass `conditionInstances`.
- **Status:** CORRECT for the implementation as designed. See MEDIUM-001 for a concern about terrain-sourced Stuck/Slowed recall behavior vs RAW.

### 5. Encounter-End Clearing — Source-Aware (PTU p.247, decree-038, decree-047 P1)

- **Rule:** PTU p.247: "Volatile Afflictions are cured completely at the end of the encounter." Per decree-038: individual `clearsOnEncounterEnd` flags control clearing. Per decree-047 P1: Other conditions use source-based clearing at encounter end.
- **Implementation:** `clearEncounterEndConditions()` in `end.post.ts:28-36` filters conditions using `shouldClearOnEncounterEnd()`. The function receives `combatant.conditionInstances` (line 68). Source rules: terrain/weather clear at encounter end (`clearsOnEncounterEnd: true`), environment/manual do NOT (`clearsOnEncounterEnd: false`). This is a reasonable design: terrain/weather effects dissipate when the encounter ends (no more active combat in that space), but environment presets and GM-applied conditions may persist (the GM controls their removal).
- **Status:** CORRECT.

### 6. Condition Instance Lifecycle — Seeding on Combat Entry

- **Rule:** Per design spec Section C.3: pre-existing conditions on combat entry get 'unknown' source (safe default).
- **Implementation:** `buildCombatantFromEntity()` in `combatant.service.ts:721-724` seeds `conditionInstances` from `entity.statusConditions` using `buildUnknownSourceInstance()`, which creates instances with `sourceType: 'unknown'` and `sourceLabel: 'Unknown source'`. This happens after combatant construction and before `reapplyActiveStatusCsEffects()`.
- **Status:** CORRECT. Unknown-source conditions fall back to static flags (which are `false` for Other conditions per decree-047), meaning pre-existing Other conditions will NOT clear on faint — the safe default.

### 7. Condition Instance Lifecycle — Application with Source

- **Rule:** Per design spec Section C.1: `updateStatusConditions()` accepts optional source; defaults to 'manual'.
- **Implementation:** `updateStatusConditions()` in `combatant.service.ts:334-410` accepts `source?: ConditionSource`. For added conditions, creates `ConditionInstance` with source metadata (or `buildManualSourceInstance()` if no source). For removed conditions, filters out matching instances. `status.post.ts` (lines 107-126) validates source type and label before passing to service.
- **Status:** CORRECT.

### 8. Condition Instance Lifecycle — Fainted Instance on Faint

- **Rule:** Per design spec Section C.2: add Fainted as a system-sourced condition instance.
- **Implementation:** `applyFaintStatus()` at line 216-219 adds `{ condition: 'Fainted', sourceType: 'system', sourceLabel: 'Fainted from damage' }` to `conditionInstances` while filtering out cleared conditions and any prior Fainted instance.
- **Status:** CORRECT.

### 9. Condition Instance Lifecycle — Revive (Fainted Removal)

- **Rule:** Per design spec Section J.4: removing Fainted on revive must also remove from conditionInstances.
- **Implementation (applyHealingToEntity):** Commit 3b6d3722 added conditionInstances cleanup at `combatant.service.ts:284-289` — when HP goes from 0 to positive, Fainted is removed from both `entity.statusConditions` and `conditionInstances`.
- **Implementation (applyReviveItem):** `healing-item.service.ts:281-318` removes Fainted from `entity.statusConditions` (line 290-292) but does NOT touch `combatant.conditionInstances`. This function explicitly bypasses `applyHealingToEntity()` (documented in its own comment, line 277-279). See HIGH-001.
- **Status:** INCORRECT for `applyReviveItem` path. See HIGH-001.

### 10. Condition Instance Lifecycle — Dead Instance on Death

- **Rule:** Per design spec Section J.6: add Dead to conditionInstances with system source.
- **Implementation:** `damage.post.ts:105-110` adds `{ condition: 'Dead', sourceType: 'system', sourceLabel: deathCheck.cause || 'Death' }` to `conditionInstances` when death conditions are met. Correctly filters out any pre-existing Dead instance.
- **Status:** CORRECT.

### 11. Decree-038 Compliance — Behavior Decoupling

- **Rule:** Per decree-038: each condition has independent behavior flags; category is for display/grouping only.
- **Implementation:** `statusConditions.ts` defines per-condition `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint` flags. The source-tracking system extends this: for Other conditions, even per-condition flags can be overridden by per-instance source. This is a natural extension of decree-038's decoupling principle.
- **Notable:** Sleep (Asleep, Bad Sleep) correctly has `clearsOnRecall: false, clearsOnEncounterEnd: false` per decree-038, even though it is categorized as volatile. The source-tracking system does not interfere with this — Sleep is not category 'other', so source rules are not consulted.
- **Status:** CORRECT.

### 12. Source Clearing Rules — PTU Consistency

- **Rule:** The SOURCE_CLEARING_RULES table defines how each source type affects clearing behavior for Other conditions.
- **Implementation review of each source type:**
  - `move` — `clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true`. PTU-consistent: move effects end when the affected Pokemon faints or the move's duration ends.
  - `ability` — same as move. Reasonable: ability-applied conditions are tied to combat interaction.
  - `terrain` — `clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: true`. The terrain persists independently of the Pokemon's state, so faint/recall don't clear. Encounter end does clear because terrain effects are combat-contextual.
  - `weather` — same as terrain. Consistent.
  - `item` — same as move. PTU-consistent: item effects are one-time applications.
  - `environment` — `clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: false`. Environment presets are GM-controlled and may span multiple encounters.
  - `manual` — same as environment. GM retains full control.
  - `system` — `clearsOnFaint: false`. System-applied conditions (like Fainted itself) should not auto-clear.
  - `unknown` — `{}` (empty, no overrides). Falls back to static flags. Safe default.
- **Status:** CORRECT. The rules table is internally consistent and matches the design rationale.

## Summary

The implementation correctly translates PTU p.248 faint clearing rules into source-aware clearing logic per decree-047. All 5 Persistent conditions and 9 Volatile conditions unconditionally clear on faint, matching RAW. The 5 Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) use source-dependent clearing: move/ability/item sources clear on faint while terrain/weather/environment/manual/unknown sources do not. The system is extended to recall and encounter-end clearing in P1. Decree-038 compliance is maintained — behaviors remain decoupled from categories.

One HIGH issue found: the `applyReviveItem()` path in `healing-item.service.ts` does not sync conditionInstances when removing Fainted, creating a desync. One MEDIUM concern about terrain-sourced recall behavior vs PTU RAW.

## Issues

### HIGH-001: applyReviveItem does not remove Fainted from conditionInstances

**File:** `app/server/services/healing-item.service.ts:281-318`

**Problem:** `applyReviveItem()` removes Fainted from `entity.statusConditions` (line 290-292) but does not remove it from `combatant.conditionInstances`. The function explicitly bypasses `applyHealingToEntity()` (which was patched in commit 3b6d3722 to handle this). This means after using a Revive/Revival Herb, the combatant's `conditionInstances` array retains a stale `{ condition: 'Fainted', sourceType: 'system' }` entry.

**Impact:** The stale Fainted instance would cause incorrect behavior if `shouldClearOnFaint()` is consulted again (e.g., if the Pokemon faints a second time, `applyFaintStatus` would see the old Fainted instance in the list, though the `if (condition === 'Fainted') continue` guard prevents Fainted from being processed as a clearable condition). The more likely impact is UI: `formatConditionDisplay()` could show inconsistent state. Additionally, any future logic that iterates `conditionInstances` would see a phantom Fainted entry.

**Fix:** Add `conditionInstances` sync to `applyReviveItem()`:

```typescript
// After removing Fainted from entity.statusConditions:
if (target.conditionInstances) {
  target.conditionInstances = target.conditionInstances.filter(
    i => i.condition !== 'Fainted'
  )
}
```

**Severity:** HIGH — conditionInstances desync on a core game path (revive items).

### MEDIUM-001: Terrain-sourced Stuck/Slowed do not clear on recall, potentially conflicting with PTU RAW

**File:** `app/constants/conditionSourceRules.ts:28`

**Rule:** PTU p.248: "Stuck: ... This condition may be removed by switching" and "Slowed: ... This condition may be removed by switching."

**Problem:** `SOURCE_CLEARING_RULES` for 'terrain' sets `clearsOnRecall: false`. This means a terrain-sourced Stuck or Slowed condition will NOT be removed when the Pokemon is recalled, contradicting the explicit PTU text that says these conditions "may be removed by switching."

**Nuance:** The design rationale is reasonable — if terrain caused the condition, recalling and re-sending would just re-apply it. However, decree-047 only establishes source-dependent clearing for **faint**, not for recall. Extending source-dependency to recall is a design decision not explicitly covered by a decree.

**Recommendation:** This should be documented as a conscious design divergence from RAW, or a new decree-need should be filed to formally rule on whether source-dependent recall clearing is intended. The `clearsOnRecall` behavior for terrain-sourced Stuck/Slowed could arguably remain `true` (matching RAW) while `clearsOnFaint` remains `false` (per decree-047).

**Severity:** MEDIUM — design choice that extends beyond decree-047's scope, but has a reasonable rationale. Not a regression from pre-existing behavior (the old code cleared all Stuck/Slowed on recall).

## Rulings

1. **Persistent/Volatile faint clearing:** CORRECT per PTU p.246-248. All 14 Persistent+Volatile conditions clear unconditionally on faint. No issues.

2. **Other condition faint clearing:** CORRECT per decree-047. Source-dependent clearing is properly implemented. Static flags default to `clearsOnFaint: false` for all 5 Other conditions.

3. **CS effect reversal on faint:** CORRECT per decree-005. Only reversed for conditions actually cleared by the source-aware logic.

4. **Sleep persistence through recall/encounter-end:** CORRECT per decree-038. Sleep's `clearsOnRecall: false` and `clearsOnEncounterEnd: false` are not affected by source tracking (Sleep is volatile, not other).

5. **Source tracking infrastructure:** CORRECT. The dual-format approach (flat `statusConditions[]` for persistence + enriched `conditionInstances[]` for combat-scoped source tracking) is clean and backward compatible.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue must be fixed before approval: `applyReviveItem()` in `healing-item.service.ts` must sync `conditionInstances` when removing Fainted. This is a straightforward 4-line fix.

One MEDIUM concern about terrain-sourced recall behavior should be addressed with either (a) a comment documenting the conscious RAW divergence, or (b) a decree-need ticket for formal ruling.

## Required Changes

1. **[HIGH-001]** Add `conditionInstances` cleanup to `applyReviveItem()` in `app/server/services/healing-item.service.ts` to remove the stale Fainted instance when a revive item is used.

2. **[MEDIUM-001]** Either add a comment to `SOURCE_CLEARING_RULES` documenting the conscious decision to make terrain-sourced Stuck/Slowed NOT clear on recall (diverging from PTU p.248 RAW), or file a decree-need ticket for formal ruling on source-dependent recall behavior.
