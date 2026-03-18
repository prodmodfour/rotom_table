Eternabeam is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: 16`, `frequency: "Scene"`, `ac: 4`, `range: "Line 6, Smite, Exhaust"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Eternabeam flows through the standard [[damage-flow-pipeline]] with DB 16 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
