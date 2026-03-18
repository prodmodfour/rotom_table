Acid Spray is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Poison"`, `damageBase: 4`, `frequency: "EOT"`, `ac: 2`, `range: "4, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Acid Spray flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
