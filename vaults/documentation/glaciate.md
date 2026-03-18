Glaciate is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ice"`, `damageBase: 7`, `frequency: "EOT"`, `ac: 3`, `range: "Burst 2"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Glaciate flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The Slowed condition halves movement, tracked via the [[condition-source-rules]]. Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
