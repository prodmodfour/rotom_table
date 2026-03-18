Poltergeist is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ghost"`, `damageBase: 11`, `frequency: "Scene"`, `ac: 4`, `range: "8, Ranged Blast 3, Smite"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Poltergeist flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
