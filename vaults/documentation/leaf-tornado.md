Leaf Tornado is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Grass"`, `damageBase: 7`, `frequency: "EOT"`, `ac: 4`, `range: "6, Ranged Blast 3"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Leaf Tornado flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
