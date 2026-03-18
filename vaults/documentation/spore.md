Spore is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Grass"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "4, 1 Target, Powder"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Spore skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
