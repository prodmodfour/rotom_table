Rock Tomb is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 5`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Rock Tomb flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]]. The Materializer capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
