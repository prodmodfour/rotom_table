Shadow Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ghost"`, `damageBase: 6`, `frequency: "EOT"`, `ac: null`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Shadow Punch flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Technician, Iron Fist in the [[moves-csv-source-file]].
