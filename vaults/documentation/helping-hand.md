Helping Hand is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "4, 1 Target, Priority"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Helping Hand skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Helping Hand has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
