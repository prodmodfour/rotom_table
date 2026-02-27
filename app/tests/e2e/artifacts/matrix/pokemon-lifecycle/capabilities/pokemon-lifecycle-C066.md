---
cap_id: pokemon-lifecycle-C066
name: usePokemonSheetRolls.rollSkill
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C066: usePokemonSheetRolls.rollSkill
- **cap_id**: pokemon-lifecycle-C066
- **name**: Pokemon Skill Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollSkill()`
- **game_concept**: Pokemon skill check dice roll
- **description**: Rolls dice notation for a skill check. Stores result in lastSkillRoll ref for display in PokemonSkillsTab.
- **inputs**: skill name string, dice notation string
- **outputs**: Sets lastSkillRoll reactive state
- **accessible_from**: gm
