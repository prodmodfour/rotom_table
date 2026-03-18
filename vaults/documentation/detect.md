Detect is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fighting"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Self, Trigger, Interrupt, Shield"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Detect skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Detect uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
