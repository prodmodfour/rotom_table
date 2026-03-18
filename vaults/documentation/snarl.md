Snarl is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dark"`, `damageBase: 6`, `frequency: "EOT"`, `ac: 3`, `range: "Cone 2, Sonic"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Snarl flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Technician, Punk Rock in the [[moves-csv-source-file]].
