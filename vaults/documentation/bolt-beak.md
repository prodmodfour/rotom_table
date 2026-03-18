Bolt Beak is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Electric"`, `damageBase: 9`, `frequency: "Scene x2"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Bolt Beak flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
