False Surrender is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 8`, `frequency: "EOT"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

False Surrender flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
