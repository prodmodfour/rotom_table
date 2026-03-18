Strength is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 8`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target, Push"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Strength flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The +1 Power capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
