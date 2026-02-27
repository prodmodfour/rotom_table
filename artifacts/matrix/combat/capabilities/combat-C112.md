---
cap_id: combat-C112
name: encounter store — addWildPokemon
type: store-action
domain: combat
---

### combat-C112: encounter store — addWildPokemon
- **cap_id**: combat-C112
- **name**: Add Wild Pokemon
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `addWildPokemon()`
- **game_concept**: Wild spawn
- **description**: Creates and adds wild Pokemon as combatants.
- **inputs**: pokemon[], side
- **outputs**: Updated encounter + IDs
- **accessible_from**: gm

### combat-C113-C114: encounter store — significance + XP
- **cap_id**: combat-C113
- **name**: Significance and XP Actions
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: XP management
- **description**: setSignificance, calculateXp, distributeXp.
- **inputs**: Multiplier, counts, distribution
- **outputs**: XP data
- **accessible_from**: gm
