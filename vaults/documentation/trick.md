Trick is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `frequency: "Scene"`, `ac: 2`, `range: "5, 2 Targets"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Trick skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
