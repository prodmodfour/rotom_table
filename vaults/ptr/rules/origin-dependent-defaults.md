When PTU defines different defaults based on a Pokemon's origin, the app implements origin-dependent behavior rather than collapsing to a single universal default.

This is why [[loyalty-varies-by-origin]] uses Loyalty 2 (Wary) for wild catches and Loyalty 3 (Neutral) for hatched/gifted Pokemon. Wild Pokemon must earn trust; hatched Pokemon bond naturally.

The `origin` enum (`wild`, `hatched`, `gifted`, `starter`, `custom`) is the canonical source for branching default values.

## See also

- [[raw-fidelity-as-default]]
