Victory Dance is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fighting"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "Self"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Victory Dance skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
