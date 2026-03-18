Aurora Beam is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ice"`, `damageBase: 7`, `frequency: "At-Will"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Aurora Beam flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Freeze application on Ice-types. Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
