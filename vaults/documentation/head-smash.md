Head Smash is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 15`, `frequency: "Scene"`, `ac: 5`, `range: "Melee, 1 Target, Dash, Push, Recoil 1/3"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Head Smash flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
