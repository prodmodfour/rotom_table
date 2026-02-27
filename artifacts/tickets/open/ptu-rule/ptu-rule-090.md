---
id: ptu-rule-090
title: Scene-end AP restoration not automated
priority: P3
severity: MEDIUM
status: in-progress
domain: healing
source: healing-audit.md (R042)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-090: Scene-end AP restoration not automated

## Summary

Pure calculation functions for scene-end AP restoration exist (`calculateSceneEndAp()`) but no automated trigger invokes them at scene or encounter end. AP is only restored via extended rest, new day, or GM manual edit.

## Affected Files

- `app/utils/restHealing.ts` (`calculateSceneEndAp`)
- Scene deactivation endpoints
- Encounter end endpoints

## PTU Rule Reference

AP refreshes at end of each scene (characters regain AP based on their scene-end AP pool).

## Suggested Fix

Add AP restoration call to scene deactivation and encounter end flows. After a scene or encounter concludes, automatically restore AP for all involved characters.

## Impact

GMs must manually adjust AP after every scene/encounter, which is tedious and error-prone.

## Fix Log

### 2026-02-27 — slave-6-developer

**Finding:** Scene-end AP restoration was **already implemented** in all three relevant code paths before this ticket was created. The ticket was likely generated from stale audit data (pre-commit `c45c246` and `a0fc14d`).

**Existing implementations verified:**
1. `app/server/api/scenes/[id]/deactivate.post.ts` — calls `restoreSceneAp(sceneData.characters)` (line 32)
2. `app/server/api/scenes/[id]/activate.post.ts` — restores AP for all previously active scenes before deactivation (lines 18-24)
3. `app/server/api/encounters/[id]/end.post.ts` — calculates and restores AP for all human combatants, clears `boundAp` (lines 128-150)
4. `app/server/services/scene.service.ts` — `restoreSceneAp()` service function handles batched AP restore via `calculateSceneEndAp()`

**No code changes required.** All three scene/encounter end paths already invoke AP restoration automatically. The `restoreSceneAp()` service function (extracted in commit `c45c246`) is used by both scene endpoints, and the encounter end endpoint handles AP inline.
