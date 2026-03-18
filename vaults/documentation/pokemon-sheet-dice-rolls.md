# Pokemon Sheet Dice Rolls

`usePokemonSheetRolls` composable in `composables/usePokemonSheetRolls.ts` handles all dice rolling from the [[pokemon-sheet-page]].

## Skill Rolls

`rollSkill(skillName, diceNotation)` rolls the dice notation for a skill check. Stores the result in `lastSkillRoll` reactive state, displayed in the skills tab.

## Attack Rolls

`rollAttack(move)` rolls 1d20 against the move's AC. Detects natural 20 (crit), natural 1 (auto-miss), or compares to AC for hit/miss. Stores result in `lastMoveRoll` with a `resultClass` for hit/miss/crit styling.

## Damage Rolls

`rollDamage(move, isCrit)` rolls damage dice derived from the move's `damageBase`. Adds the relevant attack stat (Attack for physical, Special Attack for special). For crits, uses `rollCritical()`. Updates `lastMoveRoll.damage` with breakdown string.

## Damage Formula Display

`getMoveDamageFormula(move)` returns a human-readable formula string (e.g., "2d6+10+12"). Returns '-' for status moves with no damageBase.

## See also

- [[composable-domain-grouping]] — part of the Pokemon composable group
- [[pokemon-sheet-page]] — the page that uses this composable
