Two combatants are Adjacent if any of their occupied squares touch, including diagonally. "Cardinally Adjacent" excludes diagonal squares — only up/down/left/right touching counts.

PTU uses both definitions in different contexts. The app's grid system must support both adjacency checks, especially for multi-tile tokens where [[size-determines-grid-footprint]] means many squares can be adjacent.

## See also

- [[ptu-alternating-diagonal-everywhere]]
- [[flanking-scales-with-target-size]]
- [[melee-range-is-adjacency]] — all melee attacks require adjacency
- [[reach-extends-melee-by-size]] — Reach extends melee beyond adjacency
