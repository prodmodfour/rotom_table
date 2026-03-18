Weather Ball is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 5`, `frequency: "EOT"`, `ac: 2`, `range: "8, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Weather Ball flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
