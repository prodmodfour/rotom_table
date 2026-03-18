Hyper Fang is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 8`, `frequency: "At-Will"`, `ac: 4`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Hyper Fang flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Strong Jaw in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
