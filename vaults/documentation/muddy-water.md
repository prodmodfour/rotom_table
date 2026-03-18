Muddy Water is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Water"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 5`, `range: "Close Blast 2"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Muddy Water flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
