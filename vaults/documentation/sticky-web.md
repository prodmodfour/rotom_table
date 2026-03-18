Sticky Web is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `frequency: "EOT"`, `ac: null`, `range: "6, Hazard"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Sticky Web skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Slowed condition halves movement, tracked via the [[condition-source-rules]]. Combat stage changes are applied through the [[combat-stage-system]]. The Threaded capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
