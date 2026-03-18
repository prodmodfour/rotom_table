Super Fang is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: "See Effect"`, `frequency: "Scene"`, `ac: 4`, `range: "Melee, 1 Target"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Super Fang flows through the standard [[damage-flow-pipeline]] with a variable Damage Base as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
