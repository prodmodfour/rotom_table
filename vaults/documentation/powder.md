Powder is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: null`, `range: "6, 1 Target, Interrupt, Powder"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Powder skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Powder uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
