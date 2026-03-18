Stealth Rock is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Rock"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Field, Hazard"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Stealth Rock skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Materializer capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
