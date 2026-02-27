---
id: ptu-rule-116
title: "Naturewalk status condition immunity (Slowed/Stuck) not implemented"
priority: P4
severity: LOW
status: open
domain: vtt-grid
source: rules-review-181 (scope boundary note)
created_by: slave-collector (plan-20260227-122512)
created_at: 2026-02-27
---

# ptu-rule-116: Naturewalk status condition immunity (Slowed/Stuck) not implemented

## Summary

PTU p.276 states that Naturewalk grants "Immunity to Slowed or Stuck in its appropriate Terrains." The current implementation (ptu-rule-112) only handles terrain flag bypass (movement cost and accuracy penalty). Status condition immunity — preventing the Slowed/Stuck conditions from being applied while the Pokemon is on matching terrain — is a separate behavioral rule.

## PTU Reference

- PTU p.276 (04-trainer-classes.md line 2800-2801): "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains."
- This is distinct from p.322's "treat all listed terrains as Basic Terrain" which governs terrain flags.

## Affected Files

- `app/composables/useMoveCalculation.ts` or status condition application logic
- Would need to check combatant position + terrain type + Naturewalk capability at condition-application time

## Implementation Notes

This requires tracking the combatant's current grid position and checking if the terrain matches their Naturewalk capabilities when a Slowed or Stuck condition is about to be applied. The existing `naturewalkBypassesTerrain` utility from ptu-rule-112 can be reused for the terrain matching.

## Impact

Low — Slowed/Stuck conditions from terrain are relatively rare in typical encounters. The terrain flag bypass (movement cost and accuracy) from ptu-rule-112 covers the most common Naturewalk interactions.
