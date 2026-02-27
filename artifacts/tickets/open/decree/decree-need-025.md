---
ticket_id: decree-need-025
ticket_type: decree-need
priority: P4
status: open
domain: vtt-grid
topic: rough-terrain-penalty-endpoint-inclusion
source: rules-review-172 MED-2
created_by: slave-collector (plan-20260227-174900)
created_at: 2026-02-27T18:10:00
---

## Summary

Ambiguity in whether the rough terrain accuracy penalty applies when the target is standing IN rough terrain but there is no rough terrain BETWEEN the attacker and target.

## PTU Rule

PTU p.231: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."

## Ambiguity

The word "through" is ambiguous. Two valid interpretations:

**Interpretation A (current implementation):** The attack path must pass through rough terrain between attacker and target. Rough terrain at the attacker's or target's position does not count. The Bresenham trace excludes both endpoint cells.

**Interpretation B:** Any rough terrain along the attack path, including the target's cell, triggers the penalty. The target standing in rough terrain means the attack must travel "through" that terrain to reach them.

## Context

- Current implementation uses Interpretation A (endpoints excluded)
- rules-review-172 notes Interpretation A is "the more common tabletop ruling"
- The PTU example on p.2135-2136 describes "targeting through the grassy terrain at the target" which could support either interpretation
- The flavor text says rough terrain "obscure attacks" — terrain at the target's feet arguably doesn't obscure the attack path

## Ruling Needed

Should the -2 rough terrain accuracy penalty apply when:
1. Only intervening terrain (between attacker and target) is rough? (current behavior)
2. The target's cell is also rough terrain (endpoint included)?
3. The attacker's cell is also rough terrain?

## Impact

Affects `getRoughTerrainPenalty()` in `app/composables/useMoveCalculation.ts` (lines 157-169, 191 for endpoint exclusion logic).
