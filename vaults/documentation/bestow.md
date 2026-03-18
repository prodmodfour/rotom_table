Bestow is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "At-Will"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Bestow skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
