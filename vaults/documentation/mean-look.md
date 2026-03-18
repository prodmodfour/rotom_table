Mean Look is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "6, 1 Target, Social"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Mean Look skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]]. The Slowed condition halves movement, tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
