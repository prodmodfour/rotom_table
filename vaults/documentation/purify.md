Purify is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Purify skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
