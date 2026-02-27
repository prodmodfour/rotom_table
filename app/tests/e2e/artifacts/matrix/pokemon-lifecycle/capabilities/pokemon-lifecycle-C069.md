---
cap_id: pokemon-lifecycle-C069
name: usePokemonSheetRolls.getMoveDamageFormula
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C069: usePokemonSheetRolls.getMoveDamageFormula
- **cap_id**: pokemon-lifecycle-C069
- **name**: Move Damage Formula Display
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `getMoveDamageFormula()`
- **game_concept**: Damage dice + stat display
- **description**: Returns human-readable damage formula string (e.g., "2d6+10+12" for dice+stat). Returns '-' for status moves with no damageBase.
- **inputs**: Move object
- **outputs**: Formula string
- **accessible_from**: gm
