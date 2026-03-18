Teatime is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Field, Social"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Teatime skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
