---
cap_id: pokemon-lifecycle-C068
name: usePokemonSheetRolls.rollDamage
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C068: usePokemonSheetRolls.rollDamage
- **cap_id**: pokemon-lifecycle-C068
- **name**: Pokemon Move Damage Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollDamage()`
- **game_concept**: PTU damage roll with stat bonus
- **description**: Rolls damage dice from getDamageRoll(damageBase). Adds attack/specialAttack stat. For crits, uses rollCritical(). Updates lastMoveRoll with damage result and breakdown string.
- **inputs**: Move object, isCrit boolean
- **outputs**: Sets lastMoveRoll.damage reactive state
- **accessible_from**: gm
