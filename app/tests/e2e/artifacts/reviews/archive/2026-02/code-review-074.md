---
review_id: code-review-074
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-020, bug-021, bug-022
domain: combat, capture, character-lifecycle, scenes
commits_reviewed:
  - c9e815d
  - 648e6e6
  - 11fc717
  - 39b93c5
  - f94dd60
  - 8321102
  - a0fc14d
  - c735e4a
  - d25d17e
  - c2d46ff
  - 158fc05
  - bae0a39
  - 8653044
  - b412f9d
  - 16de443
  - 43653a1
  - bc8f9e8
  - 9425386
files_reviewed:
  - app/constants/combatManeuvers.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useCapture.ts
  - app/prisma/schema.prisma
  - app/utils/restHealing.ts
  - app/utils/trainerDerivedStats.ts
  - app/utils/levelUpCheck.ts
  - app/server/api/scenes/[id]/deactivate.post.ts
  - app/server/api/scenes/[id]/activate.post.ts
  - app/server/api/characters/[id].put.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/characters/[id]/heal-injury.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/server/api/game/new-day.post.ts
  - app/server/api/pokemon/[id]/level-up-check.post.ts
  - app/server/services/combatant.service.ts
  - app/server/utils/serializers.ts
  - app/types/character.ts
  - app/components/character/tabs/HumanStatsTab.vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/pokemon/[id].vue
verdict: APPROVED_WITH_ISSUES
issues_found:
  critical: 0
  high: 2
  medium: 4
reviewed_at: 2026-02-20T22:00:00Z
---

## Review Scope

Review of Developer fixes for 3 P3 bug tickets (bug-020, bug-021, bug-022) plus 2 P2 PTU-rule tickets (ptu-rule-042, ptu-rule-043) and 1 untracked faint-status fix (9425386), totalling 18 commits across 21 source files.

## Status Table

| Ticket | Description | Status | Verdict |
|--------|------------|--------|---------|
| bug-020 | Disarm and Dirty Trick maneuvers missing | Complete | PASS |
| bug-021 | Capture doesn't consume standard action | Structurally complete, not wired to UI | PASS with note |
| bug-022 | No scene-end AP restoration | Complete | PASS |
| ptu-rule-042 | Derived trainer stats not computed | Complete (out-of-scope for this review) | PASS |
| ptu-rule-043 | Level-up notification system | Partial (out-of-scope for this review) | PASS |
| (untracked) | Faint clears wrong status categories | Complete | PASS |

## Issues

### HIGH

**H1. `console.error` left in production composable (bug-021)**
- **File:** `app/composables/useCapture.ts:252`
- **Problem:** The action consumption error is caught and silently logged with `console.error`. This violates the project coding-style rule ("No console.log statements"). More importantly, if the standard action consumption fails, the GM has no indication that the trainer still has their action available. The capture succeeds but the action economy is silently broken.
- **Buggy code:**
  ```typescript
  } catch (actionError: any) {
    console.error('Failed to consume standard action for capture:', actionError)
  }
  ```
- **Fix:** Surface this error to the user via the composable's `error` ref, or at minimum re-throw so the caller can handle it. The capture already succeeded at this point, so the correct approach is to set a warning that the action wasn't consumed:
  ```typescript
  } catch (actionError: any) {
    error.value = 'Capture succeeded but failed to consume standard action. Mark it manually.'
  }
  ```

**H2. N+1 query pattern in global new-day endpoint (bug-022)**
- **File:** `app/server/api/game/new-day.post.ts:23-35`
- **Problem:** The previous `updateMany` was replaced with `findMany` + N individual `update` calls. For a game with 20 characters, this is 21 queries instead of 1. The reason (maxAp varies by level) is valid, but the implementation should batch by level.
- **Buggy code:**
  ```typescript
  for (const char of characters) {
    const maxAp = calculateMaxAp(char.level)
    await prisma.humanCharacter.update({
      where: { id: char.id },
      data: { ... }
    })
  }
  ```
- **Fix:** Group characters by level and use `updateMany` per group:
  ```typescript
  const byLevel = new Map<number, string[]>()
  for (const char of characters) {
    const arr = byLevel.get(char.level) || []
    arr.push(char.id)
    byLevel.set(char.level, arr)
  }
  for (const [level, ids] of byLevel) {
    const maxAp = calculateMaxAp(level)
    await prisma.humanCharacter.updateMany({
      where: { id: { in: ids } },
      data: { restMinutesToday: 0, injuriesHealedToday: 0, drainedAp: 0, currentAp: maxAp, lastRestReset: now }
    })
  }
  ```
  This reduces worst-case from N+1 to L+1 queries (where L = distinct levels, usually 5-10).

### MEDIUM

**M1. Variable shadowing: `id` in deactivate.post.ts (bug-022)**
- **File:** `app/server/api/scenes/[id]/deactivate.post.ts:37`
- **Problem:** The arrow function parameter `(id)` in `.filter((id): id is string => !!id)` shadows the outer `id` variable from line 7 (the scene ID route param). Currently harmless because the outer `id` is not referenced after line 27, but fragile if code is restructured.
- **Fix:** Rename the filter parameter to `cid`:
  ```typescript
  .filter((cid): cid is string => !!cid)
  ```
  Note: `activate.post.ts:26` uses `(cid)` correctly. The same pattern should be used in `deactivate.post.ts` for consistency.

**M2. Duplicate AP restoration logic between activate and deactivate (bug-022)**
- **Files:** `app/server/api/scenes/[id]/activate.post.ts:17-42` and `app/server/api/scenes/[id]/deactivate.post.ts:31-53`
- **Problem:** The AP restoration loop (parse characters JSON, extract IDs, query DB, compute scene-end AP, update each) is duplicated verbatim across both endpoints. If the restoration logic changes (e.g., Pokemon AP in the future), both must be updated.
- **Fix:** Extract into a shared helper function, e.g. `restoreSceneAp(sceneCharactersJson: string): Promise<number>` in a scene service or utility, and call from both endpoints.

**M3. Duplicate SCSS for capabilities UI across 2 files (ptu-rule-042)**
- **Files:** `app/pages/gm/characters/[id].vue:702-748` and `app/components/character/tabs/HumanStatsTab.vue:200-245`
- **Problem:** The `.capabilities-section`, `.capabilities-grid`, `.capability-block`, and `.capability-value` SCSS blocks are copy-pasted identically (with minor background color differences: `$color-bg-secondary` vs `$color-bg-tertiary`). The template markup is also nearly identical.
- **Fix:** Extract a `CapabilitiesDisplay.vue` component that accepts derived stats as a prop, with scoped styling. Both pages would use `<CapabilitiesDisplay :stats="derivedStats" />`.

**M4. `encounterContext` is not wired by any UI caller (bug-021)**
- **File:** `app/composables/useCapture.ts:219-222`
- **Problem:** The `encounterContext` parameter was added to `attemptCapture()` but no component currently passes it. The ticket fix log says "all capture attempts go through useCapture.ts" which is true, but CombatantCard.vue (line 211) only calls `calculateCaptureRateLocal` -- the actual capture attempt button is not yet wired (per the capture matrix: "The UI button exists but does nothing"). This means the standard action consumption is technically dead code until the capture button is wired.
- **Impact:** Low -- the implementation is forward-correct and will work when the capture button is connected. But this should be noted so it's not accidentally removed as "unused code" in a cleanup pass.

## What Looks Good

1. **bug-020 (Disarm/Dirty Trick):** Clean, minimal change. The maneuver definitions follow the exact same pattern as existing maneuvers. The `useEncounterActions.ts` maneuver name mapping and action consumption list were both updated in sync. The AC values (Disarm AC 6, Dirty Trick AC 2) match PTU Core. No duplicate code paths were missed.

2. **bug-022 (Scene-end AP restoration):** Thorough coverage of all AP-affecting code paths. The developer found and updated 6 different endpoints (`extended-rest`, `new-day` individual, `new-day` global, `heal-injury`, `activate`, `deactivate`) plus serializers and the combatant service. The `calculateMaxAp` and `calculateSceneEndAp` pure functions are clean, well-documented, and correctly implement `5 + floor(level/5)`.

3. **Pure utility functions:** Both `trainerDerivedStats.ts` and `levelUpCheck.ts` follow the project pattern of pure, stateless functions with clear JSDoc headers referencing PTU page numbers. Type safety is strong with explicit interfaces.

4. **Faint status fix (9425386):** Correctly changes the fainting behavior from "clear everything except Fainted" to "clear only Persistent and Volatile conditions, preserve Other conditions". Uses the canonical constant arrays from `statusConditions.ts`. This is a correctness fix that was not in any ticket -- the developer caught it while working on adjacent code.

5. **Schema evolution:** Adding `currentAp` with a sensible default (5) means existing characters will have correct AP without a data migration.

6. **Commit granularity:** 18 commits across 3 bug tickets plus 2 PTU-rule tickets plus 1 bonus fix. Good separation of concerns per commit.

## Recommended Next Steps (ordered)

1. Fix H1: Replace `console.error` with user-visible error feedback in `useCapture.ts`.
2. Fix H2: Batch the N+1 query in `game/new-day.post.ts` by grouping characters by level.
3. Fix M1: Rename shadowed `id` parameter to `cid` in `deactivate.post.ts:37`.
4. Fix M2: Extract shared AP restoration logic into a reusable helper.
5. Fix M3: Extract `CapabilitiesDisplay.vue` component to deduplicate UI + SCSS.
6. File a ticket for `gm/pokemon/[id].vue` (1384 lines) -- it was over the 800-line limit before these changes and continues to grow. Needs decomposition into tab components.
7. Wire the `encounterContext` into the actual capture UI when the capture button connection (capture matrix gap) is addressed.
