Stone Edge is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 10`, `frequency: "EOT"`, `ac: 5`, `range: "8, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Stone Edge flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect



## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
