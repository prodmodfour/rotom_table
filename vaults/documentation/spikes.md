Spikes is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ground"`, `damageBase: null`, `frequency: "At-Will"`, `ac: null`, `range: "6, Hazard"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Spikes skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Slowed condition halves movement, tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
