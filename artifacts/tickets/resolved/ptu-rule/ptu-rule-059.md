---
ticket_id: ptu-rule-059
priority: P2
status: resolved
domain: scenes
matrix_source:
  rule_id: scenes-R025
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Scene-frequency move tracking fields exist in the database but are never enforced. `usedThisScene` is never incremented, no per-scene limit validation occurs, and no "Every Other Turn" frequency restriction is implemented.

## Expected Behavior (PTU Rules)

Moves with scene-frequency limits (1/scene, 2/scene) should be tracked and enforced. "Every Other Turn" moves should alternate availability. At scene end, scene-use counters should reset.

## Actual Behavior

The DB fields exist but are never read or written during move execution. All moves can be used unlimited times per scene.

## Resolution Log

### 2026-02-20: Implementation complete

**Changes made:**

1. **`app/types/character.ts`** -- Added `lastTurnUsed` field to `Move` interface for EOT round tracking.

2. **`app/utils/moveFrequency.ts`** (new) -- Pure utility with:
   - `checkMoveFrequency(move, currentRound)` -- validates if a move can be used based on frequency
   - `incrementMoveUsage(move, currentRound)` -- returns new move object with updated usage counters
   - `resetSceneUsage(moves)` -- resets `usedThisScene` and `lastTurnUsed` for all moves
   - Parsing helpers: `getSceneLimit()`, `getDailyLimit()`, `isEotFrequency()`, etc.

3. **`app/server/api/encounters/[id]/move.post.ts`** -- Server-side enforcement:
   - Validates frequency before allowing move execution (400 error if exhausted)
   - Increments `usedThisScene` for Scene/Scene x2/Scene x3 moves
   - Tracks `lastTurnUsed` for EOT moves
   - Increments `usedToday` for Daily moves
   - Syncs updated move data to Pokemon DB record

4. **`app/server/api/encounters/[id]/next-scene.post.ts`** (new) -- Resets scene-frequency counters for all Pokemon combatants. Called by existing client `encounterCombat.nextScene()` action.

5. **`app/server/api/encounters/[id]/end.post.ts`** -- Added scene-frequency reset alongside existing volatile condition clearing at encounter end.

6. **`app/server/api/encounters/[id]/start.post.ts`** -- Added scene-frequency reset at encounter start (new encounter = new scene).

7. **`app/components/encounter/GMActionModal.vue`** -- UI enforcement:
   - Moves with exhausted frequency are visually disabled (grayed out, line-through)
   - Hover tooltip shows the reason why a move cannot be used
   - Uses `checkMoveFrequency()` from the shared utility

8. **`app/tests/unit/utils/moveFrequency.test.ts`** (new) -- 39 unit tests covering all frequency types, validation, usage tracking, and scene reset.

**Test results:** All 546 unit tests pass (20 files). No regressions.

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
