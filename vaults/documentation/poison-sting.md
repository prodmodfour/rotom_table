Poison Sting is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Poison"`, `damageBase: 2`, `frequency: "At-Will"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Poison Sting flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.

## Ability Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
