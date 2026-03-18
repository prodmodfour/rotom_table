Water Shuriken is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Water"`, `damageBase: 2`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target, Five Strike, Priority"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Water Shuriken flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Water Shuriken has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
