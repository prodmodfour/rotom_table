Ion Deluge is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Electric"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "5, Ranged Blast 3, Interrupt"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Ion Deluge skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Ion Deluge uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
