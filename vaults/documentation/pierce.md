Pierce! is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 7`, `frequency: "EOT"`, `ac: 2`, `range: "WR, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Pierce! flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
