Block is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Block skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The Stuck condition is tracked via the [[condition-source-rules]]. The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
