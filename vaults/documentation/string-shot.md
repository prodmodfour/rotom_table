String Shot is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `frequency: "At-Will"`, `ac: 3`, `range: "Cone 2"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, String Shot skips the [[damage-flow-pipeline]]. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

The Stuck condition is tracked via the [[condition-source-rules]]. Combat stage changes are applied through the [[combat-stage-system]]. The Threaded capability grant is tracked through the [[combatant-capabilities-utility]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
