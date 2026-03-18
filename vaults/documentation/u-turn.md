U-Turn is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 7`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

U-Turn flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
