Mist is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ice"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: null`, `range: "Blessing"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Mist skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
