Ice Shard is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ice"`, `damageBase: 4`, `frequency: "At-Will"`, `ac: 2`, `range: "4, 1 Target, Priority"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Ice Shard flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Ice Shard has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
