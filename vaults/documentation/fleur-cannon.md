Fleur Cannon is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fairy"`, `damageBase: 13`, `frequency: "Scene"`, `ac: 4`, `range: "Line 9, Smite"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Fleur Cannon flows through the standard [[damage-flow-pipeline]] with DB 13 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
