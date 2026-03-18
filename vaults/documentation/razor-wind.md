Razor Wind is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 8`, `frequency: "EOT"`, `ac: 2`, `range: "10, 3 Targets, Set -Up"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Razor Wind flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect



## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
