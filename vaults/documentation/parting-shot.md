Parting Shot is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Dark"`, `damageBase: null`, `frequency: "At-Will"`, `ac: 2`, `range: "6, 1 Target, Social"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Parting Shot skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
