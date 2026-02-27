---
cap_id: pokemon-lifecycle-C056
name: encounter.distributeXp
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C056: encounter.distributeXp
- **cap_id**: pokemon-lifecycle-C056
- **name**: Distribute XP (Store Action)
- **type**: store-action
- **location**: `app/stores/encounter.ts` -- `distributeXp()`
- **game_concept**: Apply post-combat XP to Pokemon
- **description**: POSTs to /api/encounters/:id/xp-distribute with significance, playerCount, boss flag, and distribution array. Returns XpApplicationResult[] and totalXpDistributed. Used by XpDistributionModal Apply button.
- **inputs**: { significanceMultiplier, playerCount, isBossEncounter?, distribution: [{ pokemonId, xpAmount }] }
- **outputs**: { results: XpApplicationResult[], totalXpDistributed }
- **accessible_from**: gm

---

## Store Getters
