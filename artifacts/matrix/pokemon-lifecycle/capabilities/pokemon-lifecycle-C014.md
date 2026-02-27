---
cap_id: pokemon-lifecycle-C014
name: EXPERIENCE_CHART
type: constant
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C014: EXPERIENCE_CHART
- **cap_id**: pokemon-lifecycle-C014
- **name**: PTU Experience Chart
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -- `EXPERIENCE_CHART`
- **game_concept**: Cumulative XP thresholds for levels 1-100 (Core p.203)
- **description**: Record<number, number> mapping level to cumulative XP needed. Level 1 = 0 XP, Level 100 = 20,555 XP. Used by getLevelForXp(), getXpForLevel(), getXpToNextLevel().
- **inputs**: N/A (constant)
- **outputs**: Level determination from XP
- **accessible_from**: gm (via utility functions)
