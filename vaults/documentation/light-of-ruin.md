Light of Ruin is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fairy"`, `damageBase: 14`, `frequency: "Scene"`, `ac: 4`, `range: "8, Ranged Blast 3, Smite, Recoil 1/2"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Light of Ruin flows through the standard [[damage-flow-pipeline]] with DB 14 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Reckless in the [[moves-csv-source-file]].
