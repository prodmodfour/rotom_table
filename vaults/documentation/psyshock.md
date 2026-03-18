Psyshock is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Psychic"`, `damageBase: 8`, `frequency: "At-Will"`, `ac: 2`, `range: "4, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Psyshock flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
