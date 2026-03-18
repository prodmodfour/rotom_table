Heavy Slam is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Steel"`, `damageBase: 4`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Heavy Slam flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
