Doom Desire is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Steel"`, `damageBase: 14`, `frequency: "Scene x2"`, `ac: null`, `range: "10, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Doom Desire flows through the standard [[damage-flow-pipeline]] with DB 14 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness.

## Effect



## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
