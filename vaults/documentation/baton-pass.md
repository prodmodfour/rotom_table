Baton Pass is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "At-Will"`, `ac: null`, `range: "Self"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Baton Pass skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]]. Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
