# PTU Diagonal Distance Formula

`ptuDiagonalDistance` in `utils/gridDistance.ts` implements PTU's alternating diagonal movement rule as a closed-form formula: `diagonals + floor(diagonals / 2) + straights`, where `diagonals = min(|dx|, |dy|)` and `straights = ||dx| - |dy||`.

The first diagonal costs 1m, the second 2m, the third 1m, and so on. This is cheaper than D&D 5e's approach (where each diagonal costs 1.5m equivalent) but more expensive than naive 8-direction movement.

`ptuDistanceTokensBBox` extends this to multi-tile tokens by computing the gap between bounding boxes before applying the formula. `maxDiagonalCells` inverts the formula to find how many diagonal cells fit within a given budget (used for diagonal Line attacks).

## See also

- [[pathfinding-uses-flood-fill-with-ptu-diagonal-costs]] — uses this formula for movement range
- [[measurement-calculates-ptu-aoe-shapes]] — uses this formula for distance measurement
