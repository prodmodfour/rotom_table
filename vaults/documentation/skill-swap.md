Skill Swap is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Skill Swap skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
