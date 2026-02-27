---
id: ptu-rule-116
title: "Naturewalk status condition immunity (Slowed/Stuck) not implemented"
priority: P4
severity: LOW
status: in-progress
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

## Resolution Log

**Commit:** 657430b (slave/5-dev-mechanics-p4-20260227-153711)

**Files changed:**
- `app/utils/combatantCapabilities.ts` — add `findNaturewalkImmuneStatuses()` utility that checks combatant position against terrain grid cells and Naturewalk capabilities
- `app/server/api/encounters/[id]/status.post.ts` — add Naturewalk terrain immunity check after type immunity check; rejects Slowed/Stuck with 409 when Pokemon has matching Naturewalk on current terrain cell; GM can override with `override: true`

**Approach:** Follows the same pattern as decree-012 type immunity: server-side enforcement with informative 409 response and GM override. Parses encounter `terrainState` JSON to resolve cell type at combatant position. Reuses existing `naturewalkBypassesTerrain()` for terrain matching and `getCombatantNaturewalks()` for capability extraction (covers both `capabilities.naturewalk` and `otherCapabilities` parsing).
