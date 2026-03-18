Heat Crash is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fire"`, `damageBase: 4`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Heat Crash flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
