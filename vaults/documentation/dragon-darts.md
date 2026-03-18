Dragon Darts is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dragon"`, `damageBase: 5`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target, Double Strike; or 6, 2 Targets"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Dragon Darts flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
