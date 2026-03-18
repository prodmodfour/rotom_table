Dynamic Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 10`, `frequency: "At-Will"`, `ac: 9`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Dynamic Punch flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 9 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Confusion follows the [[confused-three-outcome-save]] resolution.

## Ability Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
