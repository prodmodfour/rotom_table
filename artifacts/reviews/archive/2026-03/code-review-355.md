---
review_id: code-review-355
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-062
domain: scenes
commits_reviewed:
  - 71907adb
files_reviewed:
  - app/server/services/scene.service.ts
  - app/server/api/scenes/[id]/activate.post.ts
  - app/server/api/scenes/[id]/deactivate.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T12:00:00Z
follows_up: null
---

## Review Scope

Bug-062: `resetSceneUsage()` existed as a pure utility in `app/utils/moveFrequency.ts` but was never called from scene lifecycle endpoints. Scene-frequency move counters (`usedThisScene`, `lastTurnUsed`) persisted across scene boundaries, making Scene/Scene x2/Scene x3 and EOT moves permanently consumed after first use.

The fix adds a new `resetScenePokemonMoves()` function to `scene.service.ts` and wires it into both `activate.post.ts` (for deactivating scenes) and `deactivate.post.ts`.

3 files changed, +74 lines / -2 lines, 1 commit.

## Verification Checklist

### 1. resetScenePokemonMoves correctly reads, resets, and persists Pokemon moves

VERIFIED. The function:
- Parses the scene's `pokemon` JSON string to extract Pokemon IDs (line 89-95)
- Handles parse failures gracefully with `console.error` + early return (same pattern as `restoreSceneAp`)
- Fetches Pokemon records from DB selecting only `id` and `moves` (minimal query)
- Parses each Pokemon's move JSON and applies `resetSceneUsage()` from the well-tested utility
- Uses reference equality to detect changes (`!resetMoves.every((m, i) => m === moves[i])`) -- this works because `resetSceneUsage` returns the same object reference for moves that don't need reset
- Only creates DB update promises for Pokemon whose moves actually changed

### 2. Called at correct lifecycle points (deactivating scene, not activating scene)

VERIFIED.
- **activate.post.ts** (line 22-24): Calls `resetScenePokemonMoves(activeScene.pokemon)` inside the loop over `activeScenes` (scenes with `isActive: true`). These are the scenes being *deactivated* during activation of a new scene. Correct.
- **deactivate.post.ts** (line 35): Calls `resetScenePokemonMoves(sceneData.pokemon)` using `sceneData` read *before* deactivation (line 17). Correct -- operates on the scene being deactivated.

Neither endpoint resets moves for the newly-activating scene, which is correct behavior.

### 3. Only writes DB when moves actually changed (optimization)

VERIFIED. The `movesChanged` check on line 125 gates the DB update push. If no moves had `usedThisScene > 0` or `lastTurnUsed > 0`, `resetSceneUsage` returns same references and `movesChanged` is false. The `if (updates.length > 0)` guard on line 137 also avoids an empty `Promise.all`. This matches the same optimization pattern used in `encounters/[id]/start.post.ts` (line 68-76) and `encounters/[id]/next-scene.post.ts` (line 50-61).

### 4. Daily moves are NOT reset

VERIFIED. `resetSceneUsage()` only resets `usedThisScene` and `lastTurnUsed` to 0. It explicitly preserves `usedToday` and `lastUsedAt`. This is confirmed by the existing unit test "preserves usedToday on Daily moves while resetting scene counters" (moveFrequency.test.ts line 424-442).

### 5. Edge case: scene deactivation during encounter

SAFE. Scene deactivation and encounter operations target different data stores:
- Scene deactivation reads Pokemon moves directly from the `Pokemon` DB table
- Encounter operations work with combatant entities serialized inside the `Encounter` row

If a scene is deactivated while an encounter is running, the DB-level move reset happens on `Pokemon` rows, while the encounter still holds its own combatant snapshot. When the encounter ends (`end.post.ts`), it also calls `resetSceneUsage` on its combatant copies and syncs back to DB. The worst case is a redundant double-reset to 0, which is idempotent.

The encounter `next-scene.post.ts` endpoint handles mid-encounter scene transitions separately and also syncs to DB, so that path is also covered.

### Additional Checks

- **Decree compliance**: No active decrees govern scene-frequency reset behavior. Decree-019 (new-day is pure counter reset) is tangentially related but not violated -- this fix correctly only resets scene counters, not daily counters.
- **Pokemon ID extraction**: The scene pokemon JSON consistently uses `{ id: string }` (confirmed across `pokemon.post.ts`, `active.get.ts`, `[pokemonId].delete.ts`). The function correctly maps `p.id`. No `characterId`/`pokemonId` aliasing issue.
- **HumanCharacter moves**: Only Pokemon have the `moves` field in the Prisma schema. HumanCharacters do not have moves. No missing entity type.
- **Error handling**: Parse failures log to console and return 0, consistent with `restoreSceneAp` pattern. Individual Pokemon move parse failures skip silently via `continue` (line 121), which is acceptable -- one corrupted Pokemon record should not block reset for others.
- **Promise.all vs transaction**: Uses `Promise.all` for individual `pokemon.update` calls, consistent with how encounter endpoints handle the same pattern (`next-scene.post.ts` line 74, `end.post.ts` line 158). Individual Pokemon move resets are independent operations that don't require atomicity.
- **File size**: `scene.service.ts` is 142 lines, well under the 800-line limit.
- **Commit granularity**: Single commit for a cohesive bug fix across 3 files. Appropriate -- the function definition and its two call sites are a single logical change.
- **app-surface.md**: No new endpoints, components, routes, or stores were added. No update needed.

## What Looks Good

- Clean structural parallel with `restoreSceneAp` -- same parameter convention (raw JSON string), same error handling pattern, same early-return guards. Easy to review because the patterns match.
- The optimization to skip DB writes when no moves changed avoids unnecessary I/O for Pokemon with only At-Will moves.
- JSDoc comment accurately describes what is reset and why.
- The import of `resetSceneUsage` from `~/utils/moveFrequency` maintains the existing architecture where pure logic lives in utils and DB orchestration lives in services.

## Verdict

**APPROVED.** The fix correctly wires `resetSceneUsage()` into both scene lifecycle endpoints at the right moments (deactivating scenes only), preserves daily counters, optimizes away unnecessary writes, handles edge cases gracefully, and follows established project patterns. No issues found.
