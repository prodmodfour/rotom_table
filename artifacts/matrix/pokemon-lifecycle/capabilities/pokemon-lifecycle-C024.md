---
cap_id: pokemon-lifecycle-C024
name: getLevelForXp
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C024: getLevelForXp
- **cap_id**: pokemon-lifecycle-C024
- **name**: Level from XP Lookup
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getLevelForXp()`
- **game_concept**: Reverse XP chart lookup
- **description**: Pure function. Walks chart from level 100 down to find highest level the XP qualifies for. Returns 1-100.
- **inputs**: totalXp number
- **outputs**: level number
- **accessible_from**: gm (via modal level-up preview)
