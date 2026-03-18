Feint Attack is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 6`, `frequency: "EOT"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Feint Attack flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
