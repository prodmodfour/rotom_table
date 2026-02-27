---
cap_id: pokemon-lifecycle-C023
name: getXpForLevel
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C023: getXpForLevel
- **cap_id**: pokemon-lifecycle-C023
- **name**: XP Threshold Lookup
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getXpForLevel()`
- **game_concept**: PTU Experience Chart lookup (Core p.203)
- **description**: Pure function. Returns cumulative XP needed to reach a specific level (1-100). Returns 0 for invalid levels below 1, MAX_EXPERIENCE for levels above 100.
- **inputs**: level number
- **outputs**: XP threshold number
- **accessible_from**: gm (via modal preview)
