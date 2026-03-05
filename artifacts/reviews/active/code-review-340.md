---
review_id: code-review-340
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-098
domain: combat
commits_reviewed:
  - 3f9488ca
  - 2c164356
  - 5bb485f0
  - a46404d8
files_reviewed:
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/services/combatant.service.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Review Scope

Refactoring-098: convert direct entity property mutations (`entity.currentHp = x`) to immutable spread reassignment (`combatant.entity = { ...entity, currentHp: x }`) across 4 files. Pure code-health refactoring with no behavioral changes intended.

4 commits reviewed, 4 files changed (+56/-45 net).

## Decree Compliance

- **decree-001** (minimum damage floor): Not affected by this refactoring. Damage calculation logic in `calculateDamage` is unchanged.
- **decree-004** (massive damage uses real HP after temp HP): Not affected. `calculateDamage` logic unchanged.
- **decree-005** (auto-apply/reverse CS effects with source tracking): Verified. `applyStatusCsEffects`, `reverseStatusCsEffects`, and `applyFaintStatus` all correctly chain immutable spreads. CS effects are properly reversed on faint, and the `combatant.entity` reference is re-read after each spread in callers (e.g., `entity = combatant.entity` after `applyFaintStatus`).
- **decree-038** (decouple condition behaviors): Not affected by this refactoring. `FAINT_CLEARED_CONDITIONS` usage in `applyFaintStatus` is unchanged.
- **decree-047** (Other conditions do not clear on faint): Not affected. Condition filtering logic in `applyFaintStatus` is unchanged -- only the storage mechanism (spread vs. direct assignment) changed.

No decree violations found.

## Issues

### MEDIUM

**MED-001: Stale comment in damage.post.ts (line 61)**

```
// Apply damage to combatant entity (mutates entity)
```

The comment says "mutates entity" which is now misleading -- `applyDamageToEntity` no longer mutates entity properties directly. It reassigns `combatant.entity` via spread. The comment should be updated to reflect the new pattern, e.g., "replaces combatant.entity with spread" or simply removed since the function name is self-documenting.

File: `app/server/api/encounters/[id]/damage.post.ts`, line 61.

## What Looks Good

1. **Consistent pattern across all 4 files.** Every mutation site follows the same `combatant.entity = { ...entity, ... }` + `entity = combatant.entity` re-read pattern. No half-conversions or mixed styles.

2. **Correct chaining in multi-step flows.** The heavily-injured-penalty -> faint-check -> death-check pipeline in all three endpoints correctly re-reads `entity = combatant.entity` after each spread, ensuring subsequent reads see the latest state. This is the most important correctness aspect of this refactoring.

3. **applyFaintStatus correctly uses combatant.entity after reverseStatusCsEffects loop.** Line 185 reads `combatant.entity.statusConditions` (not the stale `entity` const from line 174), which is correct because `reverseStatusCsEffects` may have reassigned `combatant.entity` during the loop.

4. **applyHealingToEntity handles sequential spreads correctly.** Injury heal (line 230) -> HP heal (line 237 re-reads via `currentEntity = combatant.entity`) -> temp HP (line 261 re-reads `combatant.entity.temporaryHp`). Each section chains off the previous spread.

5. **updateStageModifiers accumulates changes into a local `stageModifiers` variable** and does a single `combatant.entity` spread at the end (line 520), avoiding unnecessary intermediate spreads in the loop. Efficient.

6. **updateStatusConditions correctly reads combatant.entity.stageModifiers** (line 329) after `applyStatusCsEffects`/`reverseStatusCsEffects` calls, getting the post-CS-change state.

7. **Commit granularity is appropriate.** One commit per file, clear conventional commit messages. The service file commit is last, which makes sense since the service functions are called by the endpoints.

8. **No behavioral regressions detectable.** All mutation sites produce identical data flow -- the entity object contents are the same, only the mutation mechanism changed from in-place to spread-reassignment.

9. **Zero remaining direct entity mutations** in any of the 4 files (verified via grep for `entity\.\w+\s*=\s` and `\.entity\.\w+\s*=\s` patterns).

## Pre-existing Observations (not caused by this refactoring)

- `next-turn.post.ts` is 838 lines (pre-refactoring: 835), exceeding the 800-line threshold. This pre-dates the refactoring and is tracked separately.
- No unit tests exist for `applyDamageToEntity`, `applyFaintStatus`, `applyHealingToEntity`, `updateStatusConditions`, `applyStatusCsEffects`, `reverseStatusCsEffects`, or `updateStageModifiers`. This is a pre-existing coverage gap.

## Verdict

**APPROVED** with one MEDIUM fix required (stale comment). The immutability conversion is correctly and consistently applied across all 4 files. Entity state chaining is handled properly in all multi-step flows. No behavioral regressions. Decree compliance verified.

## Required Changes

1. **MED-001**: Update or remove the stale "(mutates entity)" comment at `damage.post.ts:61`.
