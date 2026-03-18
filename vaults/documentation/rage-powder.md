Rage Powder is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: null`, `range: "Burst 1 or Line 6; Powder"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Rage Powder skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Enraged condition is tracked via the [[condition-source-rules]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
