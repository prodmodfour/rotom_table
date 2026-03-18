Leaf Blade is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Grass"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, Pass"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Leaf Blade flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect



## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
