Drain Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 8`, `frequency: "Scene x2"`, `ac: 2`, `range: "Melee, 1 Target, Aura"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Drain Punch flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].
