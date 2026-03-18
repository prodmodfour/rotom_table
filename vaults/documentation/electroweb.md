Electroweb is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 6`, `frequency: "EOT"`, `ac: 3`, `range: "4, Ranged Blast 2"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Electroweb flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
