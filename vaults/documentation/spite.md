Spite is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "1 Target, Trigger"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Spite skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Disabled condition is tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
