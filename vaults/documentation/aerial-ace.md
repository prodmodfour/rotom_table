Aerial Ace is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Flying"`, `damageBase: 6`, `frequency: "EOT"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Aerial Ace flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
