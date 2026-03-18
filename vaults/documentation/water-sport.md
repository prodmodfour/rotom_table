Water Sport is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Water"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "Burst 2, Coat"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Water Sport skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Fountain capability grant is tracked through the [[combatant-capabilities-utility]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
