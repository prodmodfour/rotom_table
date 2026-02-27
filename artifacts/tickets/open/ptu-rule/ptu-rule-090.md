---
id: ptu-rule-090
title: Scene-end AP restoration not automated
priority: P3
severity: MEDIUM
status: open
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
