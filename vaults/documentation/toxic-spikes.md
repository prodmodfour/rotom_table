Toxic Spikes is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "6, Hazard"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Toxic Spikes skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The [[type-status-immunity-utility]] prevents application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles the escalating tick damage at turn boundaries, and the [[condition-source-rules]] track what inflicted the condition. The Slowed condition halves movement, tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
