Tail Glow is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Self"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Tail Glow skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Combat stage changes are applied through the [[combat-stage-system]]. The Glow capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
