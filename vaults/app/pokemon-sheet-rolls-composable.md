The `usePokemonSheetRolls` composable (`app/composables/usePokemonSheetRolls.ts`) handles dice rolling from the [[gm-pokemon-detail-page]].

It provides:
- `rollAttack(move)` — rolls 1d20 against the move's AC (from the [[move-interface-tracks-usage-counters]])
- `rollDamage(move, isCrit)` — rolls the move's damage dice + the relevant attack stat (Attack or Sp. Atk depending on move class)
- `rollSkill(skill, notation)` — rolls the skill's dice notation (e.g., "3d6")

Skill rolls are triggered by clicking skill entries on the [[gm-pokemon-detail-skills-tab]].
