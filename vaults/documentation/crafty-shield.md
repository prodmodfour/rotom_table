Crafty Shield is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fairy"`, `damageBase: null`, `frequency: "Scene"`, `ac: null`, `range: "Burst 2, Trigger, Interrupt, Shield"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Crafty Shield skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Timing

Crafty Shield uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
