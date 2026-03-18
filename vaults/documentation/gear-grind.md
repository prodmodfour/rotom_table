Gear Grind is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Steel"`, `damageBase: 5`, `frequency: "EOT"`, `ac: 3`, `range: "Melee, 1 Target, Double Strike"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Gear Grind flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
