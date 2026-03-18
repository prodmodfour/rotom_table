Sing is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Scene"`, `ac: 10`, `range: "Burst 2, Friendly, Sonic"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Sing skips the [[damage-flow-pipeline]]. An accuracy roll against AC 10 is required via the [[evasion-and-accuracy-system]].

## Effect

Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]]. The Slowed condition halves movement, tracked via the [[condition-source-rules]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
