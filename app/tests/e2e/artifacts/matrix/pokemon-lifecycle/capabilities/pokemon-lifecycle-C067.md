---
cap_id: pokemon-lifecycle-C067
name: usePokemonSheetRolls.rollAttack
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C067: usePokemonSheetRolls.rollAttack
- **cap_id**: pokemon-lifecycle-C067
- **name**: Pokemon Move Attack Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollAttack()`
- **game_concept**: PTU attack accuracy check (d20 vs AC)
- **description**: Rolls 1d20. Detects natural 20 (crit), natural 1 (miss), or compares to move AC for hit/miss. Stores result in lastMoveRoll with resultClass for styling.
- **inputs**: Move object
- **outputs**: Sets lastMoveRoll reactive state
- **accessible_from**: gm
