Fury Swipes is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 3`, `frequency: "EOT"`, `ac: 5`, `range: "Melee, 1 Target, Five Strike"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Fury Swipes flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
