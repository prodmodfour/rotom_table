Bonemerang is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ground"`, `damageBase: 5`, `frequency: "EOT"`, `ac: 3`, `range: "6, 1 Target, Doublestrike"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Bonemerang flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. The Doublestrike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
