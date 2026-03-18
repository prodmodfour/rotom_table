Overdrive is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 8`, `frequency: "EOT"`, `ac: 2`, `range: "Cone 2, Sonic"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Overdrive flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
