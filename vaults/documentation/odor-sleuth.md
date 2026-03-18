Odor Sleuth is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: null`, `range: "Self, Swift Action"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Odor Sleuth skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
