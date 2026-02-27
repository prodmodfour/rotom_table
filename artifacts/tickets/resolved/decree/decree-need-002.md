---
ticket_id: decree-need-002
ticket_type: decree-need
priority: P0
status: addressed
decree_id: decree-002
domain: vtt
topic: range-measurement-diagonal
affected_files:
  - app/composables/useRangeParser.ts
  - app/utils/gridDistance.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should ranged attack distance use the same alternating diagonal rule (1-2-1) as movement, or simple Chebyshev (max of dx, dy)?

## PTU Rule Reference

- **p.231**: Diagonal movement rule: "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again."
- **p.344**: "Ranged X — The Move hits one target within X meters of the user." Does not specify how "within X meters" is counted diagonally.

## Current Behavior

The code uses TWO different distance metrics:
- **Movement**: `ptuDiagonalDistance()` in `gridDistance.ts` — alternating 1-2-1 rule
- **Attack range**: `chebyshevDistanceTokens()` in `useRangeParser.ts` — `Math.max(gapX, gapY)` (every diagonal = 1)

Example: Thunderbolt (range 6) at a target 6 diagonal squares away:
- Chebyshev: distance = 6 (in range) — current behavior
- PTU diagonal: distance = 6 + floor(6/2) = 9 (out of range)

## Options

### Option A: Chebyshev for ranges (current)
Simpler, more generous. Common in D&D 3.5e-derived systems where range and movement use different metrics.

### Option B: PTU diagonal for ranges too
Stricter, consistent with movement metric. But PTU never explicitly says to use the alternating rule for attack ranges.

### Option C: Configurable
Let GM choose via AppSettings.

## Blocking

Affects all ranged attack validation. Current behavior is functional but generous.
