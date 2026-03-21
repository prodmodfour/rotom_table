PTU's alternating diagonal rule (1-2-1 cost pattern) applies to ALL grid distance measurements: movement, ranged attack distance, burst containment, line length, and area effects. No Chebyshev distance (max of dx, dy) anywhere in the app.

This is the implementation of [[one-distance-metric-everywhere]]. Under this rule:
- Diagonal line attacks cover fewer cells than cardinal lines of the same size
- Burst shapes produce diamond-like patterns rather than filled squares
- Range and movement use identical distance calculations

The word "squares" in PTU p.343 refers to grid cells, not geometric shapes.

## See also

- [[cone-shapes-fixed-three-wide]]
- [[rough-terrain-intervening-only]]
- [[adjacency-includes-diagonals]]
- [[size-determines-grid-footprint]]
