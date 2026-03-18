Sucker Punch [SM] is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 7`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Trigger, Interrupt"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Sucker Punch [SM] flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Sucker Punch [SM] uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
