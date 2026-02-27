---
ticket_id: ptu-rule-070
priority: P2
status: resolved
domain: combat
source: rules-review-070
created_at: 2026-02-20
created_by: orchestrator
severity: MEDIUM
affected_files:
  - app/utils/moveFrequency.ts
---

## Summary

Scene x2/x3 moves missing implicit EOT restriction, and Daily x2/x3 moves missing per-scene cap.

## PTU Rule Reference

PTU 1.05 p.337: "Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
PTU 1.05 p.337: "Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."

## Issues

1. Scene x2/x3 moves can be used on consecutive turns (e.g., round 1 and round 2). Should enforce EOT between uses.
2. Daily x2/x3 moves can be used multiple times in the same scene. Should cap at 1 use per scene.

## Fix

1. Apply `lastTurnUsed` validation to scene-frequency moves with limit > 1
2. Add `usedThisScene >= 1` check for daily-frequency moves with limit > 1

Note: Scene x1 and Daily x1 are already implicitly correct (capped at 1 use total).

## Resolution Log

### 2026-02-20: Implementation started

**Changes to `app/utils/moveFrequency.ts`:**

1. **`checkMoveFrequency` — Scene x2/x3 EOT restriction (PTU p.337):**
   - After confirming scene uses remain, added EOT check for `sceneLimit > 1`
   - Uses existing `lastTurnUsed` field: blocks if `currentRound <= lastTurnUsed + 1`
   - Scene x1 is not affected (only 1 use total, consecutive use impossible)
   - Exhaustion check runs first, so "used 2/2 times" takes priority over EOT message

2. **`checkMoveFrequency` — Daily x2/x3 per-scene cap (PTU p.337):**
   - After confirming daily uses remain, added `usedThisScene >= 1` check for `dailyLimit > 1`
   - Daily x1 is not affected (only 1 daily use, per-scene cap is redundant)
   - Daily exhaustion check runs first, so "used 2/2 times today" takes priority over per-scene message

3. **`incrementMoveUsage` — Scene x2/x3 now tracks `lastTurnUsed`:**
   - Scene x2/x3 moves now set `lastTurnUsed = currentRound` when used (needed for EOT enforcement)
   - Scene x1 does not track `lastTurnUsed` (unnecessary, only 1 use possible)

**No changes needed to:**
- `incrementMoveUsage` for daily moves — already tracks `usedThisScene`
- `resetSceneUsage` — already resets both `usedThisScene` and `lastTurnUsed`
- Server endpoints / UI components — they call `checkMoveFrequency`, which now enforces the rules

**Tests added (16 new tests, 54 total):**
- Scene x2 EOT block on consecutive turn
- Scene x2 allow after skipping a turn
- Scene x3 EOT block on same turn
- Scene x3 allow two rounds after last use
- Scene x1 no EOT restriction (implicitly safe)
- Scene x2 exhaustion priority over EOT
- Daily x2 per-scene block
- Daily x2 allow in new scene
- Daily x3 per-scene block
- Daily x3 allow with daily uses but new scene
- Daily x1 no per-scene cap (implicitly safe)
- Daily x2 daily exhaustion priority over per-scene
- incrementMoveUsage: Scene x2 sets lastTurnUsed
- incrementMoveUsage: Scene x3 sets lastTurnUsed
- incrementMoveUsage: Scene x1 does not set lastTurnUsed
