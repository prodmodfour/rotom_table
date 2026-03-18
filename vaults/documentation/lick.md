Lick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ghost"`, `damageBase: 3`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Lick flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS.

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
