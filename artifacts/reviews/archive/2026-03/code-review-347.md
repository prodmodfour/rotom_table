---
review_id: code-review-347
review_type: code
reviewer: senior-reviewer
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
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
reviewed_at: 2026-03-06T14:00:00Z
follows_up: null
---

## Review Scope

13 commits (65d55a8f through ed89b94d) implementing decree-047 source-aware condition clearing across P0 (source tracking data model, source-aware faint clearing) and P1 (UI display, recall/encounter-end source-aware clearing, revive/death edge cases). Reviewed against design spec `design-condition-source-tracking-129`, decrees 047, 038, and 005.

**Decrees verified:**
- decree-047: Other conditions do NOT clear on faint by default; clearing is source-dependent. Implementation correctly respects this via `shouldClearOnFaint()` consulting `SOURCE_CLEARING_RULES` only for `other` category conditions. The static `clearsOnFaint: false` flags in `statusConditions.ts` remain as the safe default.
- decree-038: Condition behaviors decoupled from categories. Per-condition flags continue to drive Persistent/Volatile behavior; source overrides apply only to Other conditions. Correct.
- decree-005: CS source tracking pattern followed. `conditionInstances` on Combatant mirrors the `stageSources` pattern. Consistent.

## Issues

### CRITICAL

#### CRIT-001: `applyReviveItem()` in healing-item.service.ts does not update conditionInstances

**File:** `app/server/services/healing-item.service.ts` lines 281-318

The `applyReviveItem()` function directly mutates `entity.statusConditions` to remove Fainted (line 290-292) but does NOT remove the corresponding Fainted entry from `target.conditionInstances`. This creates a desync: the flat `statusConditions` no longer includes Fainted, but `conditionInstances` still has a `{ condition: 'Fainted', sourceType: 'system', ... }` entry.

This is a correctness bug. After a revive item is used:
1. The combatant's `conditionInstances` still shows Fainted.
2. `formatConditionDisplay()` in the GM view would still display Fainted source info (since the instance persists).
3. Any subsequent clearing logic that iterates `conditionInstances` (faint clearing, encounter-end clearing) would see a stale Fainted instance.

The design spec P1 Section J.4 explicitly specifies this fix. The implementation correctly added `conditionInstances` sync to `applyHealingToEntity()` (commit 3b6d3722), but `applyReviveItem()` bypasses `applyHealingToEntity()` entirely (its own comment says so: "Does NOT go through applyHealingToEntity"). This separate revive path was missed.

**Additionally:** `applyReviveItem()` uses direct mutation (`entity.statusConditions = ...`, `entity.currentHp = ...`) instead of the immutable spread pattern (`combatant.entity = { ...combatant.entity, ... }`) used consistently elsewhere. This is a pre-existing pattern issue, but the conditionInstances fix should use the immutable pattern.

**Fix:** Add conditionInstances sync after the Fainted removal in `applyReviveItem()`:
```typescript
// After removing Fainted from statusConditions (line 292):
if (target.conditionInstances) {
  target.conditionInstances = target.conditionInstances.filter(
    i => i.condition !== 'Fainted'
  )
}
```

### HIGH

#### HIGH-001: `end.post.ts` does not update conditionInstances when clearing encounter-end conditions

**File:** `app/server/api/encounters/[id]/end.post.ts` lines 66-96

When the encounter ends, `clearEncounterEndConditions()` correctly uses source-aware logic to filter `entity.statusConditions`. However, the corresponding `conditionInstances` on each combatant are NOT updated. The map function at line 66-96 spreads the combatant but only updates `entity.statusConditions` and resets `stageSources`. The `conditionInstances` array retains entries for conditions that were cleared.

While the encounter is ending and the combatant data may not be actively used afterward, the updated combatants JSON IS written back to the database (line 99-106). If this data is ever read again (encounter history, re-examination, debugging), the conditionInstances would be inconsistent with statusConditions.

**Fix:** In the map function, filter conditionInstances to match the cleared conditions:
```typescript
return {
  ...combatant,
  stageSources: [],
  conditionInstances: (combatant.conditionInstances || []).filter(
    i => clearedConditions.includes(i.condition)
  ),
  entity: updatedEntity
}
```

### MEDIUM

#### MED-001: `app-surface.md` not updated with new `conditionSourceRules.ts` file

**File:** `.claude/skills/references/app-surface.md`

The new file `app/constants/conditionSourceRules.ts` was created in this PR but not registered in `app-surface.md`. Per the checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" While this is a constants file (not an endpoint or component), the `app-surface.md` does track constants files (e.g., `statusConditions.ts`, `trainerSprites.ts`), so the new file should be registered for discoverability.

The root `CLAUDE.md` was correctly updated to include `conditionSourceRules` in the constants directory listing.

#### MED-002: `system` source type missing `clearsOnRecall` and `clearsOnEncounterEnd` in SOURCE_CLEARING_RULES

**File:** `app/constants/conditionSourceRules.ts` line 33

The `system` source type only specifies `{ clearsOnFaint: false }` but does not specify `clearsOnRecall` or `clearsOnEncounterEnd`. This means `shouldClearOnRecall()` and `shouldClearOnEncounterEnd()` for system-sourced Other conditions will fall back to the static condition def flags (`clearsOnRecall: true`, `clearsOnEncounterEnd: true` for Stuck/Slowed/Tripped/Vulnerable).

This may be intentional (system conditions like breather-applied Tripped/Vulnerable should clear on recall/encounter-end), but it's inconsistent with the design spec P1 Section F.2 which shows `'system': { clearsOnFaint: false }` without explicit recall/encounter-end overrides. If this is the intended behavior, add a comment explaining why system sources fall back to static flags for recall/encounter-end. If not, add explicit `clearsOnRecall: false, clearsOnEncounterEnd: false` entries.

The design spec shows this exact pattern (system only has clearsOnFaint), so this appears intentional. A clarifying comment would prevent future confusion.

## What Looks Good

1. **Architecture is clean and well-motivated.** The dual-format storage decision (flat `statusConditions` for backward compat, enriched `conditionInstances` on Combatant for combat-scoped source tracking) avoids a risky schema migration and follows the existing `stageSources` pattern per decree-005.

2. **Decree compliance is thorough.** Every clearing function (`shouldClearOnFaint`, `shouldClearOnRecall`, `shouldClearOnEncounterEnd`) correctly gates source-based overrides behind a `def.category !== 'other'` check. Persistent and Volatile conditions always use their static flags per PTU p.248. Other conditions consult source rules only when an instance with a known source exists. The `unknown` source correctly falls through to static flags (safe default per decree-047).

3. **Backward compatibility is solid.** The `source` parameter on `updateStatusConditions()` is optional with a default to `buildManualSourceInstance()`. All existing callers work without modification. The `conditionInstances` field on Combatant is optional (`ConditionInstance[]?`), and all code paths use `|| []` guards.

4. **Commit granularity is excellent.** 13 commits, each small and focused on a single logical change. Types first, then constants, then seeding, then service updates, then API, then UI. Each step is independently verifiable.

5. **The `conditionSourceRules.ts` module is well-structured.** The three `shouldClearOn*` functions follow a consistent pattern. The `formatConditionDisplay()` function correctly suppresses source labels for non-Other conditions and manual sources. Builder functions (`buildUnknownSourceInstance`, `buildManualSourceInstance`) centralize instance construction.

6. **Source validation in `status.post.ts` is thorough.** The endpoint validates `source.type` against a whitelist of valid `ConditionSourceType` values and requires `source.label` to be a non-empty string. The validation is correctly placed before the service call.

7. **Immutability is mostly well-maintained.** `applyFaintStatus()`, `updateStatusConditions()`, and `applyHealingToEntity()` all use the spread pattern for entity updates. `conditionInstances` updates use array filter/spread rather than mutation.

8. **UI integration is minimal and correct.** `CombatantConditionsSection.vue` accepts optional `conditionInstances` prop and uses `formatConditionDisplay()` for the active conditions display. The `GMActionModal.vue` passes `combatant.conditionInstances` through. No overcomplicated UI changes.

## Verdict

**CHANGES_REQUIRED** -- Route back to Developer.

The CRIT-001 bug (applyReviveItem conditionInstances desync) is a correctness issue that will cause stale Fainted instances to persist after revive items are used. This is a missed code path explicitly called out in the design spec (Section J.4) that was only partially implemented.

HIGH-001 (encounter-end conditionInstances not cleared) creates data inconsistency in the persisted encounter state.

Both are straightforward fixes (3-5 lines each). MED-001 and MED-002 can be addressed in the same pass.

## Required Changes

1. **CRIT-001:** In `app/server/services/healing-item.service.ts` `applyReviveItem()`, add `conditionInstances` sync to remove Fainted after the `statusConditions` filter (line 292). This is a 4-line fix.

2. **HIGH-001:** In `app/server/api/encounters/[id]/end.post.ts`, update the combatant map function (line 91-95) to also filter `conditionInstances` to remove entries for conditions that were cleared at encounter end. This is a 3-line fix.

3. **MED-001:** Register `app/constants/conditionSourceRules.ts` in `.claude/skills/references/app-surface.md` under the constants section.

4. **MED-002:** Add a clarifying comment on the `system` entry in `SOURCE_CLEARING_RULES` explaining that the omission of `clearsOnRecall`/`clearsOnEncounterEnd` is intentional (falls back to static flags, which is correct for breather-applied conditions).
