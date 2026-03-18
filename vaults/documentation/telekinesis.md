Telekinesis is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: null`, `range: "4, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Telekinesis skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Slowed condition halves movement, tracked via the [[condition-source-rules]]. The Telekinetic capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
