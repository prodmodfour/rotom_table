Smokescreen is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "5, Ranged Blast 3"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Smokescreen skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
