---
cap_id: pokemon-lifecycle-C055
name: encounter.calculateXp
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C055: encounter.calculateXp
- **cap_id**: pokemon-lifecycle-C055
- **name**: Calculate XP (Store Action)
- **type**: store-action
- **location**: `app/stores/encounter.ts` -- `calculateXp()`
- **game_concept**: Preview post-combat XP distribution
- **description**: POSTs to /api/encounters/:id/xp-calculate with significance, playerCount, and boss flag. Returns totalXpPerPlayer, breakdown, and participatingPokemon array. Used by XpDistributionModal.
- **inputs**: { significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }
- **outputs**: XP calculation result with participating Pokemon
- **accessible_from**: gm
