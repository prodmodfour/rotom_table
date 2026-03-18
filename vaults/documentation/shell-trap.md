Shell Trap is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fire"`, `damageBase: 15`, `frequency: "Scene"`, `ac: 2`, `range: "Melee, 1 Target, Interrupt, Trigger"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Shell Trap flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Shell Trap uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
