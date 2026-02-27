---
cap_id: pokemon-lifecycle-C017
name: applyNatureToBaseStats
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C017: applyNatureToBaseStats
- **cap_id**: pokemon-lifecycle-C017
- **name**: Nature Stat Modifier Application
- **type**: utility
- **location**: `app/constants/natures.ts` -- `applyNatureToBaseStats()`
- **game_concept**: PTU nature stat adjustments (HP: +1/-1, others: +2/-2)
- **description**: Pure function. Returns a new stats object with nature modifiers applied. HP uses +1/-1, non-HP stats use +2/-2. Stats floored at 1. Neutral natures return unmodified copy. Does not mutate input.
- **inputs**: baseStats object, natureName string
- **outputs**: Modified stats object (immutable)
- **accessible_from**: api-only (used by pokemon-generator)
