Counter is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: "See Effect"`, `frequency: "Scene x2"`, `ac: null`, `range: "Melee, 1 Target, Reaction, Trigger"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Counter flows through the standard [[damage-flow-pipeline]] with a variable Damage Base as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness.

## Effect



## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
