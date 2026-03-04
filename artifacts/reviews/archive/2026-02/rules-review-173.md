---
review_id: rules-review-173
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-089, ptu-rule-090
domain: healing
commits_reviewed:
  - 75f9832
  - b0617ad
  - a7e6362
  - d0e870e
  - 1b472d5
mechanics_verified:
  - extended-rest-daily-move-refresh
  - rolling-window-daily-move-eligibility
  - scene-end-ap-restoration
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#extended-rest (p.252)
  - core/06-playing-the-game.md#action-points (p.221)
reviewed_at: 2026-02-27T10:00:00+00:00
follows_up: null
---

## Mechanics Verified

### 1. Extended Rest Daily Move Refresh (ptu-rule-089)

- **Rule (PTU Core p.252):**
  > "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."

- **Implementation (`app/server/services/rest-healing.service.ts`, lines 27-58):**
  The `refreshDailyMoves()` function iterates over all moves, identifies daily-frequency moves (`frequency.startsWith('Daily')`), and for each one with `usedToday > 0`, checks `isDailyMoveRefreshable(move.lastUsedAt)` from `app/utils/restHealing.ts` (line 207). That function returns `true` if `lastUsedAt` is on a different calendar day than today, implementing the "hasn't been used since the previous day" rule. Refreshed moves get `usedToday: 0`, `lastUsedAt: undefined`, `usedThisScene: 0`.

- **Rolling window verification:** The `isDailyMoveRefreshable()` utility (line 207-211 of `app/utils/restHealing.ts`) compares `usedDate.toDateString()` against `today.toDateString()`. A move used today is NOT refreshable. A move used yesterday or earlier IS refreshable. This correctly implements the PTU rolling window: "if the Move hasn't been used since the previous day."

- **`Daily x2` / `Daily x3` handling:** The code uses `frequency?.startsWith('Daily')` which correctly matches `Daily`, `Daily x2`, and `Daily x3`. All daily-frequency variants are handled identically -- the rolling window applies to the most recent use (`lastUsedAt`), and all uses are reset together (`usedToday: 0`). This is correct per PTU because the rule says "daily-frequency moves are regained" without distinguishing between Daily x1/x2/x3.

- **Character endpoint wiring (`app/server/api/characters/[id]/extended-rest.post.ts`, line 103):**
  Calls `refreshDailyMovesForOwnedPokemon(id)` which fetches all Pokemon owned by the character and applies `refreshDailyMoves()` to each. This correctly implements the rule that when a trainer takes an extended rest, their Pokemon's daily moves are also refreshed. The result is included in the API response for GM visibility.

- **Pokemon endpoint wiring (`app/server/api/pokemon/[id]/extended-rest.post.ts`, line 84):**
  Calls `refreshDailyMoves(moves)` directly on the Pokemon's own moves. The updated moves are written back to the database. This handles the case where a Pokemon takes an extended rest independently.

- **Decree compliance:**
  - Per decree-016, extended rest clears only Drained AP, not Bound AP. The character endpoint (line 96-97) correctly sets `drainedAp: 0` and `currentAp: maxAp - character.boundAp`. Not affected by this change.
  - Per decree-018, extended rest accepts a duration parameter. Both endpoints accept `duration` (4-8 hours). Not affected by this change.
  - Per decree-019, New Day is a pure counter reset. The daily move refresh is correctly wired into extended rest (not new day). Compliant.

- **Status:** CORRECT

### 2. Rolling Window Edge Cases

- **No `lastUsedAt` recorded (line 40, `isDailyMoveRefreshable`):** Returns `true` (eligible for refresh). If a move has `usedToday > 0` but no timestamp, it means the timestamp was lost. Defaulting to "refreshable" is the safe choice -- the move was used at some unknown prior time.

- **`usedToday === 0`:** The outer guard `move.usedToday && move.usedToday > 0` short-circuits, so unused daily moves are left untouched. Correct -- no refresh needed for a move that has not been expended.

- **Status:** CORRECT

### 3. Scene-End AP Restoration (ptu-rule-090)

- **Rule (PTU Core p.221):**
  > "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends... Drained AP becomes unavailable for use until after an Extended Rest is taken."

- **Existing implementations verified:**

  1. **Scene deactivate** (`app/server/api/scenes/[id]/deactivate.post.ts`, line 32): Calls `restoreSceneAp(sceneData.characters)` which uses `calculateSceneEndAp(level, drainedAp)` to compute `maxAp - boundAp - drainedAp` and writes back with `boundAp: 0`.

  2. **Scene activate** (`app/server/api/scenes/[id]/activate.post.ts`, lines 18-24): Before activating a new scene, deactivates all currently active scenes and calls `restoreSceneAp()` on each. This ensures AP is restored when transitioning between scenes.

  3. **Encounter end** (`app/server/api/encounters/[id]/end.post.ts`, lines 128-150): Fetches all human combatants from the database, calculates `calculateSceneEndAp(char.level, char.drainedAp)`, and writes `boundAp: 0, currentAp: restoredAp`.

- **`restoreSceneAp()` service** (`app/server/services/scene.service.ts`, lines 18-74): Batches updates by `(level, drainedAp)` groups for efficiency. Uses transactions. Sets `boundAp: 0` at scene end, which is correct per PTU Core p.59 ("Stratagems... automatically unbind when combat ends") and the general principle that bound AP is released at scene end.

- **Formula verification:** `calculateSceneEndAp(level, drainedAp, boundAp)` calls `calculateMaxAp(level)` which returns `5 + floor(level / 5)` (correct per PTU Core p.221: "5, plus 1 more for every 5 Trainer Levels"), then subtracts `boundAp` and `drainedAp`. At scene end, `boundAp` is zeroed before the calculation is used, so effective AP = `maxAp - drainedAp`. This matches the rule: AP completely regained minus drained.

- **Developer's finding confirmed:** All three code paths already implement scene-end AP restoration. The ticket was generated from stale audit data. No code changes were needed.

- **Status:** CORRECT (already implemented)

## Summary

### ptu-rule-089 (Extended rest daily move refresh)

The fix correctly extracts daily move refresh logic into `refreshDailyMoves()` and wires it into both extended rest endpoints. The rolling window rule is faithfully implemented via `isDailyMoveRefreshable()`. The refactoring from inline code to a shared service function is mechanically correct -- the PTU rule is properly applied.

### ptu-rule-090 (Scene-end AP restoration)

Confirmed already implemented across three code paths. The developer correctly identified this as a stale-audit ticket. The existing `restoreSceneAp()` service and inline encounter-end AP restore both correctly implement the PTU Core p.221 rule with proper handling of bound and drained AP.

## Issues

### MEDIUM-1: Behavior regression -- non-daily move `usedToday` reset removed

**Old code** (`app/server/api/pokemon/[id]/extended-rest.post.ts` before refactoring) contained:
```typescript
} else if (!isDailyMove && move.usedToday && move.usedToday > 0) {
  // Non-daily moves: reset usage counter (no rolling window applies)
  move.usedToday = 0
  move.lastUsedAt = undefined
}
```

**New code** (`refreshDailyMoves()`) only processes daily-frequency moves. Non-daily moves with `usedToday > 0` are returned unchanged.

**PTU assessment:** The `usedToday` field on non-daily moves (At-Will, EOT, Scene) is **not used for any frequency enforcement** (verified in `moveFrequency.ts` -- only `usedThisScene`, `lastTurnUsed`, and daily-specific `usedToday` are checked). The old code was resetting a counter that had no functional effect. The removal does NOT cause a gameplay bug because `usedToday` on non-daily moves is dead data. However, keeping stale `usedToday` values on non-daily moves is slightly untidy.

**Severity:** MEDIUM (cosmetic data hygiene, no gameplay impact). This is not a PTU correctness issue -- the old behavior was arguably over-resetting, clearing a field that PTU rules do not require to be cleared during extended rest. PTU p.252 only mentions "Daily-Frequency Moves" being regained.

## Rulings

1. **Daily move refresh during extended rest:** Implementation is CORRECT per PTU Core p.252. The rolling window, `Daily x2`/`x3` handling, and character-to-Pokemon propagation are all faithful to the rules.

2. **Scene-end AP restoration:** Already CORRECT in all relevant code paths. No changes needed.

3. **Non-daily `usedToday` reset removal:** Not a PTU rules violation. The old behavior was doing extra work not required by the rules. The new code is more focused and correct in scope.

## Verdict

**APPROVED** -- Both mechanics are correctly implemented per PTU 1.05 rules. The single MEDIUM issue is cosmetic data hygiene with no gameplay impact.

## Required Changes

None. The MEDIUM issue does not affect game mechanics.
