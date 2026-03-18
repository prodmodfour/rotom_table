Fake Out is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 4`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Priority"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Fake Out flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Timing

Fake Out has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
