Low Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: X, See Effect`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target, Weight Class"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Low Kick flows through the standard [[damage-flow-pipeline]] with DB X, See Effect as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
