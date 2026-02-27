---
cap_id: pokemon-lifecycle-C081
name: XpDistributionResults
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C081: XpDistributionResults
- **cap_id**: pokemon-lifecycle-C081
- **name**: XP Distribution Results Display
- **type**: component
- **location**: `app/components/encounter/XpDistributionResults.vue`
- **game_concept**: Post-XP-distribution summary
- **description**: Displays per-Pokemon XP results: species, XP gained, level change (highlighted if leveled). Shows total XP distributed. Conditionally renders LevelUpNotification for any Pokemon that leveled up.
- **inputs**: results: XpApplicationResult[], totalXpDistributed: number
- **outputs**: Visual-only
- **accessible_from**: gm
