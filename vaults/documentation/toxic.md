Toxic is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: 4`, `range: "4, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Toxic skips the [[damage-flow-pipeline]]. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

The [[type-status-immunity-utility]] prevents application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles the escalating tick damage at turn boundaries, and the [[condition-source-rules]] track what inflicted the condition.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
