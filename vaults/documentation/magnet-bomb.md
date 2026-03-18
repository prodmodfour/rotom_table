Magnet Bomb is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Steel"`, `damageBase: 6`, `frequency: "EOT"`, `ac: null`, `range: "8, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Magnet Bomb flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness.

## Effect

The Magnetic capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
