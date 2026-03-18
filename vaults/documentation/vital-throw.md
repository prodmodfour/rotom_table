Vital Throw is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 7`, `frequency: "EOT"`, `ac: null`, `range: "Melee, 1 Target, Push, Reaction"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Vital Throw flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
