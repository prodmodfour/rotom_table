Octolock is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fighting"`, `damageBase: null`, `frequency: "Scene"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Octolock skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
