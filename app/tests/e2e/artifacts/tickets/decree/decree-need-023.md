---
ticket_id: decree-need-023
ticket_type: decree-need
priority: P2
status: open
domain: vtt-grid
topic: burst-shape-distance-rule
source: code-review-183 HIGH-3
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
---

## Summary

Burst shapes currently use Chebyshev distance (`Math.max(|dx|, |dy|) <= radius`) to determine affected cells, producing a filled square. Decree-002 says "All grid distance measurements use PTU's alternating diagonal rule" and "No Chebyshev distance in the app." However, PTU p.343 describes bursts as "squares" which is consistent with Chebyshev containment.

## Ambiguity

Two valid interpretations:

1. **Chebyshev (current):** Burst shapes are explicitly described as "squares" in PTU p.343. A Burst 2 is a 5x5 square. This matches the PTU diagram. Bursts are containment checks ("is cell within N squares"), not point-to-point distance.

2. **PTU diagonal:** Decree-002 says ALL grid distance measurements. Under PTU diagonal, a cell at (2,2) costs 3m, so it would be OUT of a Burst 2. Corner cells would be excluded, producing a diamond-like shape instead of a square.

## Affected Code

- `app/stores/measurement.ts:184-198` (`getBurstCells`)
- `app/composables/useRangeParser.ts` (burst case in `getAffectedCells`)
- Comment on line 186 says "Use Chebyshev distance for PTU" which contradicts decree-002

## Ruling Needed

Are burst shapes exempt from the alternating diagonal rule? Should bursts remain squares (Chebyshev containment) or switch to PTU diagonal distance?
