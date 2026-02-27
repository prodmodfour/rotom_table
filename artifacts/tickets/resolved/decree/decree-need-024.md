---
ticket_id: decree-need-024
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-024
domain: vtt-grid
topic: diagonal-cone-expansion-semantics
source: rules-review-160 M1
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
---

## Summary

Two implementations of diagonal cone shapes produce different cell sets. Decree-007 says "cone shapes use fixed 3m-wide rows" but does not specify how "3m wide" maps to diagonal expansion.

## Ambiguity

For Cone 2 aimed diagonally (e.g., northeast from 5,5):

1. **useRangeParser.ts** (move targeting): Expands along both axes separately (2 push groups: horizontal + vertical), producing a cross-like pattern. **6 cells.**

2. **measurement.ts** (measurement preview): Adds a third push group filling the diagonal corner `(baseX + w, baseY + w)`, producing a wider diamond pattern. **7 cells.**

The two implementations should agree. PTU's p.343 diagram for "Cone 2 - used diagonally" is in the original PDF but not captured in text form.

## Affected Code

- `app/composables/useRangeParser.ts:403-406` (move targeting — cross pattern)
- `app/stores/measurement.ts:243-247` (measurement preview — diamond pattern)

## Ruling Needed

For diagonal cones, should the perpendicular expansion include the diagonal corner cell? (6 cells vs 7 cells for Cone 2 diagonal)
